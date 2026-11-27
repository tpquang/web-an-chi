import { Router } from "express";
import { z } from "zod";
import { OrderEventType, OrderStatus, Prisma } from "../../generated/prisma/client.js";
import { customerIdFrom } from "../../lib/auth.js";
import { publishOrder } from "../../lib/chat-bus.js";
import { clientIp } from "../../lib/client-ip.js";
import { prisma } from "../../lib/prisma.js";
import { failureLimiter } from "../../lib/rate-limit.js";
import { getStore } from "../../lib/store.js";
import { HttpError } from "../../middleware/errors.js";
import { amountDue, cancelOrder } from "./order-flow.js";
import { cartItems, checkoutInput, phoneField, placeOrder, quoteCart } from "./orders.service.js";

export const ordersRouter = Router();

ordersRouter.post("/cart/quote", async (req, res) => {
  const { items } = z.object({ items: cartItems }).parse(req.body);
  res.json({ data: await quoteCart(items) });
});

// Chống spam đơn giữ kho: tối đa 5 đơn mỗi IP trong 10 phút (đếm cả đơn thành công)
const orderLimit = failureLimiter({ max: 5, windowMs: 10 * 60 * 1000, message: "Bạn đặt nhiều đơn quá nhanh. Đợi ít phút rồi thử lại, hoặc nhắn shop để được hỗ trợ." });
// Huỷ đơn: sai số điện thoại nhiều lần thì chặn, để không dò được đơn của người khác
const cancelLimit = failureLimiter({ max: 8, windowMs: 15 * 60 * 1000, message: "Bạn nhập sai nhiều lần. Đợi 15 phút hoặc nhắn shop để huỷ đơn." });

ordersRouter.post("/orders", async (req, res) => {
  const input = checkoutInput.parse(req.body);
  const ip = clientIp(req);
  orderLimit.check(ip);
  const { order, created } = await placeOrder(input, await customerIdFrom(req));
  if (created) {
    orderLimit.fail(ip);
    publishOrder({ id: order.id, code: order.code, kind: "created", customerName: order.customerName, totalVnd: order.totalVnd });
  }
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
  depositVnd: true,
  paidVnd: true,
  paymentDueAt: true,
  refundVnd: true,
  refundedAt: true,
  cancelReason: true,
  cancelledBy: true,
  carrier: true,
  trackingCode: true,
  id: true,
  items: { select: { productName: true, unitPriceVnd: true, quantity: true, design: true, product: { select: { requiresDeposit: true } } } },
  // Mốc trạng thái cho khách, không có tên nhân viên hay ghi chú nội bộ
  events: { where: { type: { in: [OrderEventType.CREATED, OrderEventType.STATUS] } }, select: { toStatus: true, createdAt: true }, orderBy: { createdAt: "asc" } },
} as const satisfies Prisma.OrderSelect;

type PublicRow = Prisma.OrderGetPayload<{ select: typeof publicOrder }>;

// Dạng trả cho khách: thêm số tiền còn phải chuyển, có được tự huỷ, có hàng làm riêng (chính sách huỷ khác)
async function publicView({ id: _id, items, events, ...order }: PublicRow) {
  return {
    ...order,
    items: items.map(({ productName, unitPriceVnd, quantity }) => ({ productName, unitPriceVnd, quantity })),
    timeline: events.map((event) => ({ status: event.toStatus, at: event.createdAt })),
    amountDue: amountDue(order),
    canCancel: order.status === OrderStatus.PENDING || order.status === OrderStatus.PREORDER,
    madeToOrder: items.some((item) => item.design !== null || item.product?.requiresDeposit),
    payment: await paymentInfo(order),
  };
}

// Thông tin chuyển khoản khi khách còn phải chuyển: phần còn lại của cả đơn (chuyển khoản) hoặc tiền cọc
async function paymentInfo(order: Omit<PublicRow, "id" | "items" | "events">) {
  const due = amountDue(order);
  if (due === 0 || order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED) return null;
  const { bank } = await getStore();
  return bank ? { ...bank, transferNote: order.code, amountVnd: due, deposit: order.paymentMethod === "COD" } : null;
}

// Trang cảm ơn chỉ biết mã đơn, nên không trả tên, điện thoại, địa chỉ
ordersRouter.get("/orders/:code", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { code: req.params.code.toUpperCase() }, select: publicOrder });
  if (!order) throw new HttpError(404, "Không tìm thấy đơn hàng");
  res.json({ data: await publicView(order) });
});

ordersRouter.post("/orders/lookup", async (req, res) => {
  const { code, phone } = z.object({ code: z.string().trim().min(4), phone: phoneField }).parse(req.body);
  const order = await prisma.order.findFirst({
    where: { code: code.toUpperCase(), customerPhone: phone },
    select: { ...publicOrder, customerName: true, address: true },
  });
  // Cùng một câu cho cả hai trường hợp để không dò được mã đơn nào tồn tại
  if (!order) throw new HttpError(404, "Không tìm thấy đơn với mã và số điện thoại này. Bạn kiểm tra lại giúp shop.");
  const { customerName, address, ...rest } = order;
  res.json({ data: { ...(await publicView(rest)), customerName, address } });
});

// Khách tự huỷ khi shop chưa xác nhận. Cần đúng số điện thoại của đơn
ordersRouter.post("/orders/:code/cancel", async (req, res) => {
  const { phone, reason } = z
    .object({ phone: phoneField, reason: z.string().trim().min(2, "Chọn lý do huỷ.").max(300) })
    .parse(req.body);
  const ip = clientIp(req);
  cancelLimit.check(ip);
  const found = await prisma.order.findFirst({ where: { code: req.params.code.toUpperCase(), customerPhone: phone }, select: { id: true } });
  if (!found) {
    cancelLimit.fail(ip);
    throw new HttpError(404, "Số điện thoại không khớp với đơn này. Bạn nhập số đã dùng khi đặt hàng.", "PHONE_MISMATCH");
  }
  const order = await prisma.$transaction((tx) => cancelOrder(tx, found.id, { kind: "customer" }, { reason }));
  publishOrder({ id: order.id, code: order.code, kind: "cancelled", customerName: order.customerName, totalVnd: order.totalVnd });
  const fresh = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, select: publicOrder });
  res.json({ data: await publicView(fresh) });
});
