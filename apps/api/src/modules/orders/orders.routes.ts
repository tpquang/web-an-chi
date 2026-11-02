import { Router } from "express";
import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "../../generated/prisma/client.js";
import { customerIdFrom } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { getStore } from "../../lib/store.js";
import { HttpError } from "../../middleware/errors.js";
import { cartItems, checkoutInput, phoneField, placeOrder, quoteCart } from "./orders.service.js";

export const ordersRouter = Router();

ordersRouter.post("/cart/quote", async (req, res) => {
  const { items } = z.object({ items: cartItems }).parse(req.body);
  res.json({ data: await quoteCart(items) });
});

ordersRouter.post("/orders", async (req, res) => {
  const { order, created } = await placeOrder(checkoutInput.parse(req.body), customerIdFrom(req));
  res.status(created ? 201 : 200).json({ data: { code: order.code } });
});

const publicOrder = {
  code: true,
  createdAt: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  subtotalVnd: true,
  shippingVnd: true,
  totalVnd: true,
  items: { select: { productName: true, unitPriceVnd: true, quantity: true } },
} as const;

async function paymentInfo(order: { paymentMethod: PaymentMethod; paymentStatus: PaymentStatus; code: string }) {
  if (order.paymentMethod !== PaymentMethod.BANK_TRANSFER || order.paymentStatus !== PaymentStatus.UNPAID) return null;
  const { bank } = await getStore();
  return bank ? { ...bank, transferNote: order.code } : null;
}

// Trang cảm ơn chỉ biết mã đơn, nên không trả tên, điện thoại, địa chỉ
ordersRouter.get("/orders/:code", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { code: req.params.code.toUpperCase() }, select: publicOrder });
  if (!order) throw new HttpError(404, "Không tìm thấy đơn hàng");
  res.json({ data: { ...order, payment: await paymentInfo(order) } });
});

ordersRouter.post("/orders/lookup", async (req, res) => {
  const { code, phone } = z.object({ code: z.string().trim().min(4), phone: phoneField }).parse(req.body);
  const order = await prisma.order.findFirst({
    where: { code: code.toUpperCase(), customerPhone: phone },
    select: { ...publicOrder, customerName: true, address: true },
  });
  // Cùng một câu cho cả hai trường hợp để không dò được mã đơn nào tồn tại
  if (!order) throw new HttpError(404, "Không tìm thấy đơn với mã và số điện thoại này. Bạn kiểm tra lại giúp shop.");
  res.json({ data: { ...order, payment: await paymentInfo(order) } });
});
