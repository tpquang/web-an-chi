import express, { Router } from "express";
import { z } from "zod";
import { MaterialKind, MovementType, type Prisma } from "../../generated/prisma/client.js";
import { movingAverage } from "../../lib/inventory.js";
import { prisma } from "../../lib/prisma.js";
import { optionalText, pageQuery } from "../../lib/text.js";
import { HttpError } from "../../middleware/errors.js";

export const adminInventoryRouter = Router();

// ---- Nguyên liệu thô

const materialInput = z
  .object({
    name: z.string().trim().min(2, "Nhập tên nguyên liệu, ví dụ Nụ trầm thô.").max(120),
    kind: z.enum(MaterialKind).default(MaterialKind.GENERAL),
    unit: z.string().trim().min(1, "Nhập đơn vị, ví dụ viên, cái.").max(20),
    unitsPerKg: z.number().int().positive().nullish().transform((value) => value ?? null),
    beadMaterial: z.string().trim().max(60).nullish().transform((value) => value || null),
    note: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.kind === MaterialKind.BEAD && !value.beadMaterial) ctx.addIssue({ code: "custom", path: ["beadMaterial"], message: "Chọn loại trầm để dùng ảnh vân." });
  })
  // Hạt trầm và charm nhập theo số lượng, chỉ nguyên liệu khác mới quy đổi kg
  .transform((value) => ({
    ...value,
    unitsPerKg: value.kind === MaterialKind.GENERAL ? value.unitsPerKg : null,
    beadMaterial: value.kind === MaterialKind.BEAD ? value.beadMaterial : null,
  }));

// File 3D charm: .glb, bắt đầu bằng chữ "glTF"
export const MODEL_SPEC = { maxBytes: 15_000_000 } as const;
const modelInfo = { select: { fileName: true, size: true, updatedAt: true } } as const;

adminInventoryRouter.get("/materials", async (_req, res) => {
  const [materials, textures] = await Promise.all([
    prisma.material.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { components: true } }, model: modelInfo } }),
    prisma.beadTexture.findMany({ select: { id: true, material: true, roughness: true, updatedAt: true } }),
  ]);
  const byMaterial = new Map(textures.map((t) => [t.material, { ...t, version: t.updatedAt.getTime() }]));
  const data = materials.map((m) => ({ ...m, texture: m.beadMaterial ? (byMaterial.get(m.beadMaterial) ?? null) : null }));
  res.json({ data });
});

adminInventoryRouter.post("/materials", async (req, res) => {
  res.status(201).json({ data: await prisma.material.create({ data: materialInput.parse(req.body) }) });
});

adminInventoryRouter.put("/materials/:id", async (req, res) => {
  res.json({ data: await prisma.material.update({ where: { id: req.params.id }, data: materialInput.parse(req.body) }) });
});

adminInventoryRouter.delete("/materials/:id", async (req, res) => {
  const material = await prisma.material.findUniqueOrThrow({ where: { id: req.params.id }, include: { _count: { select: { components: true, lines: true } } } });
  if (material._count.components || material._count.lines) {
    throw new HttpError(409, "Nguyên liệu đang có trong công thức sản phẩm hoặc đợt nhập, không xoá được.", "IN_USE");
  }
  await prisma.material.delete({ where: { id: material.id } });
  res.status(204).end();
});

adminInventoryRouter.get("/materials/:id/model", async (req, res) => {
  const model = await prisma.materialModel.findUnique({ where: { materialId: req.params.id } });
  if (!model) throw new HttpError(404, "Charm chưa có file 3D.", "NOT_FOUND");
  res.type("model/gltf-binary").setHeader("cache-control", "private, no-cache").send(Buffer.from(model.data));
});

adminInventoryRouter.put(
  "/materials/:id/model",
  express.raw({ type: ["model/gltf-binary", "application/octet-stream"], limit: MODEL_SPEC.maxBytes }),
  async (req, res) => {
    const material = await prisma.material.findUniqueOrThrow({ where: { id: String(req.params.id) }, select: { id: true, kind: true } });
    if (material.kind !== MaterialKind.CHARM) throw new HttpError(400, "Chỉ charm mới tải được file 3D.", "NOT_CHARM");
    if (!Buffer.isBuffer(req.body) || req.body.length < 12 || req.body.toString("ascii", 0, 4) !== "glTF") {
      throw new HttpError(400, "File không phải .glb hợp lệ. Xuất file từ Blender bằng glTF Binary (.glb).", "BAD_MODEL");
    }
    const fileName = String(req.query.name ?? "charm.glb").slice(0, 120);
    const data = new Uint8Array(req.body);
    const saved = await prisma.materialModel.upsert({
      where: { materialId: material.id },
      update: { data, fileName, size: data.length },
      create: { materialId: material.id, data, fileName, size: data.length },
      ...modelInfo,
    });
    res.json({ data: saved });
  },
);

adminInventoryRouter.delete("/materials/:id/model", async (req, res) => {
  await prisma.materialModel.deleteMany({ where: { materialId: req.params.id } });
  res.status(204).end();
});

// Hao hụt trong kho (móp, ẩm, tiêu huỷ) hoặc điều chỉnh sau kiểm kê
const adjustInput = z.object({
  type: z.enum([MovementType.WRITE_OFF, MovementType.ADJUST]),
  quantity: z.number().int().refine((v) => v !== 0, "Số lượng phải khác 0."),
  reason: z.string().trim().min(1, "Ghi lý do, ví dụ móp méo, kiểm kê."),
});

function parseAdjust(body: unknown) {
  const input = adjustInput.parse(body);
  if (input.type === MovementType.WRITE_OFF && input.quantity > 0) input.quantity = -input.quantity;
  return input;
}

adminInventoryRouter.post("/materials/:id/adjust", async (req, res) => {
  const { type, quantity, reason } = parseAdjust(req.body);
  const data = await prisma.$transaction(async (tx) => {
    const material = await tx.material.findUniqueOrThrow({ where: { id: req.params.id } });
    if (material.stock + quantity < 0) throw new HttpError(409, `Kho chỉ còn ${material.stock} ${material.unit}.`, "NOT_ENOUGH_STOCK");
    await tx.stockMovement.create({ data: { type, materialId: material.id, quantity, unitCostVnd: material.avgCostVnd, note: reason } });
    return tx.material.update({ where: { id: material.id }, data: { stock: { increment: quantity } } });
  });
  res.json({ data });
});

adminInventoryRouter.post("/products/:id/adjust", async (req, res) => {
  const { type, quantity, reason } = parseAdjust(req.body);
  const data = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({ where: { id: req.params.id } });
    if (product.stock + quantity < 0) throw new HttpError(409, `Kho chỉ còn ${product.stock} sản phẩm.`, "NOT_ENOUGH_STOCK");
    await tx.stockMovement.create({ data: { type, productId: product.id, quantity, unitCostVnd: product.unitCostVnd ?? 0, note: reason } });
    return tx.product.update({ where: { id: product.id }, data: { stock: { increment: quantity } } });
  });
  res.json({ data });
});

// ---- Công thức đóng gói (sản phẩm nhóm)

const componentsInput = z.object({
  components: z
    .array(z.object({ materialId: z.string().min(1, "Chọn nguyên liệu."), quantity: z.number().int().positive("Số lượng phải lớn hơn 0.") }))
    .max(20)
    .refine((list) => new Set(list.map((c) => c.materialId)).size === list.length, "Mỗi nguyên liệu chỉ thêm một lần."),
});

adminInventoryRouter.put("/products/:id/components", async (req, res) => {
  const { components } = componentsInput.parse(req.body);
  await prisma.$transaction([
    prisma.productComponent.deleteMany({ where: { productId: req.params.id } }),
    prisma.productComponent.createMany({ data: components.map((c, position) => ({ ...c, position, productId: req.params.id })) }),
  ]);
  res.json({ data: { ok: true } });
});

// Mọi sản phẩm có công thức, kèm số có thể đóng thêm từ tồn kho hiện tại và giá vốn theo bình quân
adminInventoryRouter.get("/recipes", async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { components: { some: {} } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      priceVnd: true,
      stock: true,
      unitCostVnd: true,
      components: { orderBy: { position: "asc" }, select: { quantity: true, material: { select: { id: true, name: true, unit: true, stock: true, avgCostVnd: true } } } },
    },
  });
  const data = products.map((p) => ({
    ...p,
    canPack: Math.min(...p.components.map((c) => Math.floor(c.material.stock / c.quantity))),
    materialCostVnd: p.components.reduce((sum, c) => sum + c.quantity * c.material.avgCostVnd, 0),
  }));
  res.json({ data });
});

adminInventoryRouter.get("/products/:id/components", async (req, res) => {
  const data = await prisma.productComponent.findMany({ where: { productId: req.params.id }, orderBy: { position: "asc" } });
  res.json({ data });
});

// ---- Đóng gói: trừ nguyên liệu, cộng thành phẩm

const packInput = z.object({
  productId: z.string().min(1, "Chọn sản phẩm."),
  quantity: z.number().int().positive("Số lượng phải lớn hơn 0.").max(100_000),
  note: optionalText,
});

adminInventoryRouter.post("/pack", async (req, res) => {
  const { productId, quantity, note } = packInput.parse(req.body);
  const data = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUniqueOrThrow({ where: { id: productId }, include: { components: { include: { material: true } } } });
    if (product.components.length === 0) throw new HttpError(400, "Sản phẩm chưa có công thức đóng gói.", "NO_RECIPE");

    let unitCostVnd = 0;
    for (const c of product.components) {
      const need = c.quantity * quantity;
      // Trừ có điều kiện để hai lần đóng gói cùng lúc không làm kho âm
      const { count } = await tx.material.updateMany({ where: { id: c.materialId, stock: { gte: need } }, data: { stock: { decrement: need } } });
      if (count === 0) throw new HttpError(409, `Không đủ ${c.material.name}: cần ${need} ${c.material.unit}, kho còn ${c.material.stock}.`, "NOT_ENOUGH_STOCK");
      unitCostVnd += c.quantity * c.material.avgCostVnd;
    }

    const run = await tx.packRun.create({ data: { productId, quantity, unitCostVnd, note } });
    await tx.stockMovement.createMany({
      data: [
        ...product.components.map((c) => ({
          type: MovementType.PACK_CONSUME,
          materialId: c.materialId,
          quantity: -c.quantity * quantity,
          unitCostVnd: c.material.avgCostVnd,
          packRunId: run.id,
          note: `Đóng ${quantity} ${product.name}`,
        })),
        { type: MovementType.PACK_PRODUCE, productId, quantity, unitCostVnd, packRunId: run.id, note },
      ],
    });
    // Hàng tồn cũ chưa có giá vốn thì coi như cùng giá với lần đóng này
    const avg = movingAverage(product.stock, product.unitCostVnd ?? unitCostVnd, quantity, unitCostVnd);
    await tx.product.update({ where: { id: productId }, data: { stock: { increment: quantity }, unitCostVnd: avg } });
    return run;
  });
  res.status(201).json({ data });
});

adminInventoryRouter.get("/pack-runs", async (_req, res) => {
  const data = await prisma.packRun.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { product: { select: { name: true } } } });
  res.json({ data });
});

// ---- Sổ kho

const movementQuery = z.object({ ...pageQuery, materialId: z.string().optional(), productId: z.string().optional(), type: z.enum(MovementType).optional() });

adminInventoryRouter.get("/movements", async (req, res) => {
  const { page, limit, materialId, productId, type } = movementQuery.parse(req.query);
  const where: Prisma.StockMovementWhereInput = {
    ...(materialId ? { materialId } : {}),
    ...(productId ? { productId } : {}),
    ...(type ? { type } : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.stockMovement.findMany({
      where,
      include: { material: { select: { name: true, unit: true } }, product: { select: { name: true } }, batch: { select: { id: true, name: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);
  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});
