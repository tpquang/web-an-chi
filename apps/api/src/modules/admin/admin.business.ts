import { Router } from "express";
import { z } from "zod";
import { BatchStatus } from "../../generated/prisma/client.js";
import { batchInclude, receiveBatch } from "../../lib/receive.js";
import { prisma } from "../../lib/prisma.js";
import { optionalText } from "../../lib/text.js";
import { HttpError } from "../../middleware/errors.js";

export const adminBusinessRouter = Router();

const vnd = z.number().int().min(0).max(10_000_000_000);
const qty = z.number().int().positive("Số lượng phải lớn hơn 0.").max(100_000_000);

const batchInput = z
  .object({
    name: z.string().trim().min(2, "Đặt tên cho đợt nhập, ví dụ Đợt 1 bán thử.").max(120),
    supplierId: z.string().min(1).nullish().transform((value) => value ?? null),
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

const include = batchInclude;

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

// Nhập kho: logic ở lib/receive.ts, seed đợt nhập đầu cũng dùng chung
adminBusinessRouter.post("/batches/:id/receive", async (req, res) => {
  res.json({ data: await prisma.$transaction((tx) => receiveBatch(tx, req.params.id)) });
});
