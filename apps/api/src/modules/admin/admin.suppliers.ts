import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { newSupplierCode, normalizeSupplierCode } from "../../lib/supplier-code.js";
import { optionalText } from "../../lib/text.js";
import { HttpError } from "../../middleware/errors.js";

export const adminSuppliersRouter = Router();

const supplierInput = z.object({
  name: z.string().trim().min(2, "Nhập tên nhà cung cấp.").max(120),
  phone: optionalText,
  note: optionalText,
  // Bỏ trống thì hệ thống tự tạo mã
  code: z
    .string()
    .nullish()
    .transform((value) => (value ? normalizeSupplierCode(value) : newSupplierCode()))
    .pipe(z.string().min(8, "Mã giới thiệu cần ít nhất 8 chữ và số để khó đoán.").max(32)),
  active: z.boolean().default(true),
});

const include = { _count: { select: { batches: true } } } as const;

// Báo rõ trường nào trùng thay cho lỗi chung của database
async function parse(body: unknown, id?: string) {
  const data = supplierInput.parse(body);
  const clash = await prisma.supplier.findFirst({ where: { OR: [{ name: data.name }, { code: data.code }], NOT: id ? { id } : undefined }, select: { name: true, code: true } });
  if (clash?.name === data.name) throw new HttpError(409, "Đã có nhà cung cấp cùng tên.", "DUPLICATE_NAME");
  if (clash) throw new HttpError(409, "Mã giới thiệu này đã dùng cho nhà cung cấp khác.", "DUPLICATE_CODE");
  return data;
}

adminSuppliersRouter.get("/suppliers", async (_req, res) => {
  res.json({ data: await prisma.supplier.findMany({ include, orderBy: { name: "asc" } }) });
});

adminSuppliersRouter.post("/suppliers", async (req, res) => {
  res.status(201).json({ data: await prisma.supplier.create({ data: await parse(req.body), include }) });
});

adminSuppliersRouter.put("/suppliers/:id", async (req, res) => {
  res.json({ data: await prisma.supplier.update({ where: { id: req.params.id }, data: await parse(req.body, req.params.id), include }) });
});

// Đợt nhập cũ vẫn giữ, chỉ bỏ liên kết nhà cung cấp
adminSuppliersRouter.delete("/suppliers/:id", async (req, res) => {
  const supplier = await prisma.supplier.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!supplier) throw new HttpError(404, "Không tìm thấy nhà cung cấp.", "NOT_FOUND");
  await prisma.supplier.delete({ where: { id: supplier.id } });
  res.status(204).end();
});
