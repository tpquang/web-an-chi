import { Router } from "express";
import { z } from "zod";
import { BatchStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { failureLimiter } from "../../lib/rate-limit.js";
import { normalizeSupplierCode } from "../../lib/supplier-code.js";
import { HttpError } from "../../middleware/errors.js";

export const supplierRouter = Router();

// Web gọi qua server Next nên mọi lượt đến từ cùng một IP: đếm chung. Mã 10 ký tự nên đoán mò không khả thi,
// giới hạn này chỉ chặn dò hàng loạt
const limiter = failureLimiter({ max: 30, windowMs: 15 * 60 * 1000, message: "Nhập sai mã nhiều lần. Vui lòng thử lại sau 15 phút." });
const KEY = "supplier-portal";

// Nhà cung cấp chỉ thấy đơn shop đã đặt hoặc đã nhận. Đợt "dự kiến" là nháp nội bộ có vốn và kế hoạch bán nên không lộ ra.
// Không trả vốn, phí bán, chi phí khác, hao hụt, kế hoạch bán
supplierRouter.post("/orders", async (req, res) => {
  limiter.check(KEY);
  const { code } = z.object({ code: z.string().max(64) }).parse(req.body);
  const supplier = await prisma.supplier.findFirst({ where: { code: normalizeSupplierCode(code), active: true }, select: { id: true, name: true } });
  if (!supplier) {
    limiter.fail(KEY);
    throw new HttpError(401, "Mã giới thiệu không đúng hoặc đã ngừng dùng.", "BAD_CODE");
  }
  const batches = await prisma.purchaseBatch.findMany({
    where: { supplierId: supplier.id, status: { in: [BatchStatus.ORDERED, BatchStatus.RECEIVED] } },
    orderBy: [{ orderedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      status: true,
      orderedAt: true,
      receivedAt: true,
      lines: {
        orderBy: { position: "asc" },
        select: { id: true, quantity: true, totalCostVnd: true, inputKg: true, pricePerKgVnd: true, material: { select: { name: true, unit: true } } },
      },
    },
  });
  res.setHeader("cache-control", "no-store");
  res.json({ data: { supplier: { name: supplier.name }, batches } });
});
