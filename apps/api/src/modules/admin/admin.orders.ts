import { Router, type Response } from "express";
import { z } from "zod";
import { OrderEventType, OrderStatus, SalesChannel, type Prisma } from "../../generated/prisma/client.js";
import type { StaffContext } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { getStore, holdHours } from "../../lib/store.js";
import { optionalText, pageQuery } from "../../lib/text.js";
import { amountDue, cancelOrder, logEvent, markRefunded, recordPayment, suggestedRefund, TRANSITIONS, transition, type Actor } from "../orders/order-flow.js";
import { convertPreorder, convertPreorderInput } from "../orders/orders.preorder.js";

// Quản lý đơn ở CMS: danh sách theo việc cần làm, chi tiết kèm lịch sử, nút hành động theo trạng thái.
// Luật trạng thái, kho, tiền nằm ở orders/order-flow.ts
export const adminOrdersRouter = Router();

const staffActor = (res: Response): Actor => {
  const staff = res.locals.staff as StaffContext;
  return { kind: "staff", id: staff.id, name: staff.name || staff.email };
};

// Tab nhanh ở danh sách đơn
const VIEWS = {
  // Shop phải làm ngay: đơn chờ xác nhận không còn chờ khách chuyển tiền, đơn còn tiền phải hoàn
  todo: {
    OR: [
      { status: OrderStatus.PENDING, paymentDueAt: null },
      { refundVnd: { gt: 0 }, refundedAt: null },
    ],
  },
  payment: { status: { in: [OrderStatus.PENDING, OrderStatus.PREORDER] }, paymentDueAt: { not: null } },
  preorder: { status: OrderStatus.PREORDER },
  confirmed: { status: OrderStatus.CONFIRMED },
  shipping: { status: OrderStatus.SHIPPING },
  refund: { refundVnd: { gt: 0 }, refundedAt: null },
} satisfies Record<string, Prisma.OrderWhereInput>;
type View = keyof typeof VIEWS;

const orderQuery = z.object({
  ...pageQuery,
  q: z.string().trim().optional(),
  status: z.enum(OrderStatus).optional(),
  channel: z.enum(SalesChannel).optional(),
  view: z.enum(Object.keys(VIEWS) as [View, ...View[]]).optional(),
});

adminOrdersRouter.get("/orders", async (req, res) => {
  const { page, limit, q, status, channel, view } = orderQuery.parse(req.query);
  const where: Prisma.OrderWhereInput = {
    AND: [
      view ? VIEWS[view] : {},
      status ? { status } : {},
      channel ? { channel } : {},
      q
        ? {
            OR: [
              { code: { contains: q.toUpperCase() } },
              { customerPhone: { contains: q.replace(/\s/g, "") } },
              { customerName: { contains: q, mode: "insensitive" } },
              { externalCode: { contains: q, mode: "insensitive" } },
              { trackingCode: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };
  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: { _count: { select: { items: true } } },
      // Chờ thanh toán: đơn sắp hết hạn lên đầu
      orderBy: view === "payment" ? [{ paymentDueAt: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

// Số đơn mỗi tab, cho tab danh sách, menu và khối việc cần làm ở tổng quan
adminOrdersRouter.get("/orders/counts", async (_req, res) => {
  const views = Object.keys(VIEWS) as View[];
  const counts = await prisma.$transaction(views.map((view) => prisma.order.count({ where: VIEWS[view] })));
  res.json({ data: Object.fromEntries(views.map((view, i) => [view, counts[i]])) });
});

adminOrdersRouter.get("/orders/:id", async (req, res) => {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      items: { include: { product: { select: { slug: true, requiresDeposit: true } } } },
      events: { orderBy: { createdAt: "desc" } },
    },
  });
  // Lịch sử của khách để nhắc shop khi khách từng huỷ hoặc không nhận hàng
  const sameCustomer: Prisma.OrderWhereInput = order.customerId ? { customerId: order.customerId } : { customerPhone: order.customerPhone || "-" };
  const history = await prisma.order.groupBy({ by: ["status"], where: { ...sameCustomer, NOT: { id: order.id } }, _count: { _all: true }, orderBy: { status: "asc" } });
  const refund = await prisma.$transaction((tx) => suggestedRefund(tx, order));
  res.json({
    data: {
      ...order,
      amountDue: amountDue(order),
      next: TRANSITIONS[order.status].filter((status) => status !== OrderStatus.CANCELLED),
      canCancel: [OrderStatus.PREORDER, OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status as "PENDING"),
      suggestedRefund: refund,
      customerHistory: Object.fromEntries(history.map((row) => [row.status, row._count._all])),
    },
  });
});

const vnd = z.number().int().min(0).max(2_000_000_000);
const text = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

adminOrdersRouter.post("/orders/:id/transition", async (req, res) => {
  const input = z
    .object({ to: z.enum(OrderStatus), note: text(500), carrier: text(80), trackingCode: text(80) })
    .parse(req.body);
  const store = await getStore();
  const order = await prisma.$transaction((tx) => transition(tx, req.params.id, input.to, staffActor(res), { ...input, holdHours: holdHours(store) }));
  res.json({ data: order });
});

adminOrdersRouter.post("/orders/:id/cancel", async (req, res) => {
  const input = z.object({ reason: z.string().trim().min(2, "Chọn hoặc ghi lý do huỷ.").max(300), refundVnd: vnd.optional() }).parse(req.body);
  const order = await prisma.$transaction((tx) => cancelOrder(tx, req.params.id, staffActor(res), input));
  res.json({ data: order });
});

adminOrdersRouter.post("/orders/:id/payment", async (req, res) => {
  const input = z.object({ amountVnd: vnd.min(1, "Nhập số tiền đã nhận."), note: text(300) }).parse(req.body);
  const order = await prisma.$transaction((tx) => recordPayment(tx, req.params.id, input.amountVnd, staffActor(res), input.note));
  res.json({ data: order });
});

adminOrdersRouter.post("/orders/:id/refund", async (req, res) => {
  const input = z.object({ refundVnd: vnd.min(1).optional() }).parse(req.body);
  const order = await prisma.$transaction((tx) => markRefunded(tx, req.params.id, staffActor(res), input.refundVnd));
  res.json({ data: order });
});

// Ghi chú nội bộ vào lịch sử đơn, ví dụ "Đã gọi, khách hẹn chiều mai"
adminOrdersRouter.post("/orders/:id/notes", async (req, res) => {
  const { note } = z.object({ note: z.string().trim().min(1, "Nhập ghi chú.").max(500) }).parse(req.body);
  await prisma.$transaction((tx) => logEvent(tx, req.params.id, staffActor(res), { type: OrderEventType.NOTE, note }));
  res.status(201).json({ data: { ok: true } });
});

// Đối soát nhập tay. Trạng thái, tiền nhận, huỷ đi qua các endpoint riêng ở trên để có lịch sử
const orderPatch = z.object({
  platformFeeVnd: vnd.optional(),
  shippingCostVnd: vnd.optional(),
  // Tiền cọc, sửa khi khách thoả thuận lại với shop
  depositVnd: vnd.optional(),
  externalCode: optionalText,
  carrier: optionalText,
  trackingCode: optionalText,
  note: optionalText,
});

adminOrdersRouter.patch("/orders/:id", async (req, res) => {
  const input = orderPatch.parse(req.body);
  const fields = Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
  const order = await prisma.$transaction(async (tx) => {
    const before = await tx.order.findUniqueOrThrow({ where: { id: req.params.id } });
    const updated = await tx.order.update({ where: { id: req.params.id }, data: fields });
    // Bỏ cọc hoặc đủ tiền sau khi sửa cọc thì không còn hạn thanh toán
    if (input.depositVnd !== undefined && input.depositVnd !== before.depositVnd) {
      await logEvent(tx, before.id, staffActor(res), { type: OrderEventType.NOTE, note: `Đổi tiền cọc ${before.depositVnd.toLocaleString("vi-VN")}đ → ${input.depositVnd.toLocaleString("vi-VN")}đ` });
      if (amountDue(updated) === 0 && updated.paymentDueAt) return tx.order.update({ where: { id: before.id }, data: { paymentDueAt: null } });
    }
    return updated;
  });
  res.json({ data: order });
});

// Đơn đặt chờ cũ (trước khi đặt chờ đi qua giỏ) chưa có địa chỉ: ghi địa chỉ rồi chuyển "Chờ xác nhận"
adminOrdersRouter.post("/orders/:id/convert", async (req, res) => {
  await convertPreorder(req.params.id, convertPreorderInput.parse(req.body), staffActor(res));
  res.json({ data: await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } }) });
});
