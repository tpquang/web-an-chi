import { Router } from "express";
import { z } from "zod";
import { BatchStatus, MovementType } from "../../generated/prisma/client.js";
import { markupPrice } from "../../lib/pricing.js";
import { syncCustomPrices } from "../../lib/stock.js";
import { batchMaterialCosts, movingAverage } from "../../lib/inventory.js";
import { prisma } from "../../lib/prisma.js";
import { optionalText } from "../../lib/text.js";
import { HttpError } from "../../middleware/errors.js";

export const adminBusinessRouter = Router();

const vnd = z.number().int().min(0).max(10_000_000_000);
const qty = z.number().int().positive("Số lượng phải lớn hơn 0.").max(100_000_000);

const batchInput = z
  .object({
    name: z.string().trim().min(2, "Đặt tên cho đợt nhập, ví dụ Đợt 1 bán thử.").max(120),
    supplier: optionalText,
    orderedAt: z.iso.date().nullish().transform((value) => (value ? new Date(value) : null)),
    status: z.enum([BatchStatus.PLANNED, BatchStatus.ORDERED]),
    capitalVnd: vnd.nullish().transform((value) => value ?? null),
    feePct: z.number().min(0).max(100).default(0),
    note: optionalText,
    lines: z
      .array(
        z.object({
          materialId: z.string().min(1, "Chọn nguyên liệu."),
          quantity: qty,
          totalCostVnd: vnd,
          inputKg: z.number().positive().nullish().transform((value) => value ?? null),
          pricePerKgVnd: vnd.nullish().transform((value) => value ?? null),
        }),
      )
      .max(50)
      .default([]),
    // allocate: chia vào giá vốn (ship nhập, thuế). Khấu hao và chi phí khác bỏ chọn, tính tỉ lệ riêng
    extras: z
      .array(z.object({ label: z.string().trim().min(1, "Nhập tên khoản chi."), amountVnd: vnd, allocate: z.boolean().default(true), note: optionalText }))
      .max(50)
      .default([]),
    writeOffs: z
      .array(z.object({ materialId: z.string().min(1, "Chọn nguyên liệu."), quantity: qty, reason: z.string().trim().min(1, "Ghi lý do, ví dụ móp méo.") }))
      .max(50)
      .default([]),
    plans: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(0) })).max(50).default([]),
  })
  .superRefine((batch, ctx) => {
    const inQty = new Map<string, number>();
    for (const line of batch.lines) inQty.set(line.materialId, (inQty.get(line.materialId) ?? 0) + line.quantity);
    const outQty = new Map<string, number>();
    batch.writeOffs.forEach((wo, i) => {
      const total = (outQty.get(wo.materialId) ?? 0) + wo.quantity;
      outQty.set(wo.materialId, total);
      if (!inQty.has(wo.materialId)) ctx.addIssue({ code: "custom", path: ["writeOffs", i, "materialId"], message: "Nguyên liệu này không có trong đợt nhập." });
      else if (total > inQty.get(wo.materialId)!) ctx.addIssue({ code: "custom", path: ["writeOffs", i, "quantity"], message: "Hao hụt nhiều hơn số lượng nhập." });
    });
  });

const include = {
  lines: { orderBy: { position: "asc" } },
  extras: { orderBy: { position: "asc" } },
  writeOffs: { orderBy: { position: "asc" } },
  plans: true,
} as const;

function children(input: z.infer<typeof batchInput>) {
  const { lines, extras, writeOffs, plans, ...batch } = input;
  return {
    batch,
    lines: lines.map((line, position) => ({ ...line, position })),
    extras: extras.map((extra, position) => ({ ...extra, position })),
    writeOffs: writeOffs.map((wo, position) => ({ ...wo, position })),
    plans: plans.filter((plan) => plan.quantity > 0),
  };
}

adminBusinessRouter.get("/batches", async (_req, res) => {
  res.json({ data: await prisma.purchaseBatch.findMany({ include, orderBy: [{ createdAt: "desc" }, { id: "asc" }] }) });
});

adminBusinessRouter.get("/batches/:id", async (req, res) => {
  res.json({ data: await prisma.purchaseBatch.findUniqueOrThrow({ where: { id: req.params.id }, include }) });
});

adminBusinessRouter.post("/batches", async (req, res) => {
  const { batch, lines, extras, writeOffs, plans } = children(batchInput.parse(req.body));
  const data = await prisma.purchaseBatch.create({
    data: { ...batch, lines: { create: lines }, extras: { create: extras }, writeOffs: { create: writeOffs }, plans: { create: plans } },
    include,
  });
  res.status(201).json({ data });
});

async function editable(id: string) {
  const batch = await prisma.purchaseBatch.findUniqueOrThrow({ where: { id } });
  if (batch.status === BatchStatus.RECEIVED) throw new HttpError(409, "Đợt này đã nhập kho, không sửa được nữa. Điều chỉnh kho ở trang Nguyên liệu.", "LOCKED");
}

adminBusinessRouter.put("/batches/:id", async (req, res) => {
  await editable(req.params.id);
  const { batch, lines, extras, writeOffs, plans } = children(batchInput.parse(req.body));
  const data = await prisma.purchaseBatch.update({
    where: { id: req.params.id },
    data: {
      ...batch,
      lines: { deleteMany: {}, create: lines },
      extras: { deleteMany: {}, create: extras },
      writeOffs: { deleteMany: {}, create: writeOffs },
      plans: { deleteMany: {}, create: plans },
    },
    include,
  });
  res.json({ data });
});

adminBusinessRouter.delete("/batches/:id", async (req, res) => {
  await editable(req.params.id);
  await prisma.purchaseBatch.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// Nhập kho: cộng nguyên liệu đã trừ hao hụt, cập nhật giá vốn bình quân, ghi sổ kho. Chỉ làm được một lần
adminBusinessRouter.post("/batches/:id/receive", async (req, res) => {
  const data = await prisma.$transaction(async (tx) => {
    const batch = await tx.purchaseBatch.findUniqueOrThrow({ where: { id: req.params.id }, include });
    if (batch.status === BatchStatus.RECEIVED) throw new HttpError(409, "Đợt này đã nhập kho rồi.", "ALREADY_RECEIVED");
    if (batch.lines.length === 0) throw new HttpError(400, "Đợt nhập chưa có nguyên liệu nào.", "EMPTY");

    const extrasVnd = batch.extras.filter((e) => e.allocate).reduce((sum, e) => sum + e.amountVnd, 0);
    const costs = batchMaterialCosts(batch.lines, extrasVnd, batch.writeOffs);
    for (const cost of costs) {
      const material = await tx.material.findUniqueOrThrow({ where: { id: cost.materialId } });
      const avgCostVnd = movingAverage(material.stock, material.avgCostVnd, cost.received, cost.unitCostVnd);
      await tx.material.update({ where: { id: material.id }, data: { stock: { increment: cost.received }, avgCostVnd } });
      // Hạt, charm có % lãi: giá bán theo giá vốn mới, có giá rồi mới hiện ở trang thiết kế vòng
      const priceVnd = material.markupPct === null ? 0 : markupPrice(avgCostVnd, material.markupPct);
      if (priceVnd > 0) await tx.bead.updateMany({ where: { materialId: material.id }, data: { priceVnd, active: true } });
      await tx.stockMovement.create({
        data: { type: MovementType.PURCHASE, materialId: material.id, quantity: cost.quantityIn, unitCostVnd: cost.unitCostVnd, batchId: batch.id, note: batch.name },
      });
    }
    for (const wo of batch.writeOffs) {
      await tx.stockMovement.create({
        data: { type: MovementType.WRITE_OFF, materialId: wo.materialId, quantity: -wo.quantity, batchId: batch.id, note: `${wo.reason} (khi nhận ${batch.name})` },
      });
    }
    await syncCustomPrices(tx);
    return tx.purchaseBatch.update({ where: { id: batch.id }, data: { status: BatchStatus.RECEIVED, receivedAt: new Date() }, include });
  });
  res.json({ data });
});
