import {
  CancelActor,
  OrderEventType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  type Order,
} from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { applyStock, stockNeeds } from "../../lib/stock.js";
import { HttpError } from "../../middleware/errors.js";

// Luật vòng đời đơn, một nơi cho web, CMS và việc nền. Xem docs/web/plans/order-flow-2026-11.md
// Mọi thay đổi trạng thái, tiền, huỷ đều ghi OrderEvent

type Tx = Prisma.TransactionClient;
export type Actor = { kind: "customer" } | { kind: "system" } | { kind: "staff"; id: string; name: string };

const actorName = (actor: Actor) => (actor.kind === "staff" ? actor.name : actor.kind === "customer" ? "Khách" : "Hệ thống");
const cancelActor = { customer: CancelActor.CUSTOMER, staff: CancelActor.STAFF, system: CancelActor.SYSTEM } as const;

export const statusLabel: Record<OrderStatus, string> = {
  PREORDER: "Chờ chuẩn bị",
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  COMPLETED: "Đã giao",
  CANCELLED: "Đã huỷ",
  RETURNED: "Hoàn hàng",
};

// Được chuyển sang đâu. Huỷ đi qua cancelOrder vì cần lý do và tiền hoàn
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PREORDER: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  SHIPPING: [OrderStatus.COMPLETED, OrderStatus.RETURNED],
  COMPLETED: [OrderStatus.RETURNED],
  CANCELLED: [OrderStatus.PENDING],
  RETURNED: [],
};

// Ai được huỷ ở trạng thái nào
const CANCELLABLE: Record<Actor["kind"], OrderStatus[]> = {
  customer: [OrderStatus.PREORDER, OrderStatus.PENDING],
  staff: [OrderStatus.PREORDER, OrderStatus.PENDING, OrderStatus.CONFIRMED],
  system: [OrderStatus.PREORDER, OrderStatus.PENDING],
};

// Đơn giữ kho khi không phải Đặt chờ, Huỷ hay Hoàn hàng
export const holdsStock = (status: OrderStatus) =>
  status !== OrderStatus.CANCELLED && status !== OrderStatus.PREORDER && status !== OrderStatus.RETURNED;

type Money = Pick<Order, "paymentMethod" | "totalVnd" | "depositVnd" | "paidVnd" | "refundVnd" | "refundedAt">;

// Số tiền khách phải chuyển trước khi shop làm tiếp: cả đơn (chuyển khoản) hoặc tiền cọc (trả khi nhận hàng có cọc)
export function amountDue(order: Money) {
  const need = order.paymentMethod === PaymentMethod.BANK_TRANSFER ? order.totalVnd : order.depositVnd;
  return Math.max(0, need - order.paidVnd);
}

export function paymentStatusOf(order: Money) {
  if (order.refundedAt && order.refundVnd > 0) return PaymentStatus.REFUNDED;
  if (order.totalVnd > 0 && order.paidVnd >= order.totalVnd) return PaymentStatus.PAID;
  if (order.paidVnd > 0) return PaymentStatus.DEPOSITED;
  return PaymentStatus.UNPAID;
}

export async function logEvent(
  tx: Tx,
  orderId: string,
  actor: Actor,
  data: { type: OrderEventType; fromStatus?: OrderStatus; toStatus?: OrderStatus; amountVnd?: number; note?: string | null },
) {
  await tx.orderEvent.create({ data: { orderId, actor: actorName(actor), staffId: actor.kind === "staff" ? actor.id : null, ...data } });
}

// Đơn có hàng làm riêng: vòng tự thiết kế hoặc sản phẩm bật "Cần đặt cọc". Huỷ sau khi shop xác nhận thì giữ cọc
async function hasMadeToOrder(tx: Tx, orderId: string) {
  const count = await tx.orderItem.count({
    where: { orderId, OR: [{ NOT: { design: { equals: Prisma.DbNull } } }, { product: { requiresDeposit: true } }] },
  });
  return count > 0;
}

// Tiền hoàn gợi ý theo chính sách huỷ: hoàn hết tiền đã nhận, trừ tiền cọc khi đơn làm riêng đã được shop xác nhận
export async function suggestedRefund(tx: Tx, order: Order) {
  const keepDeposit = order.status === OrderStatus.CONFIRMED && (await hasMadeToOrder(tx, order.id));
  return Math.max(0, order.paidVnd - (keepDeposit ? Math.min(order.depositVnd, order.paidVnd) : 0));
}

function beadList(design: Prisma.JsonValue | null) {
  const list = (design as { beads?: unknown } | null)?.beads;
  return Array.isArray(list) ? list.filter((slug): slug is string => typeof slug === "string") : null;
}

// Cộng lại kho theo các dòng sổ kho của đơn, để trả đúng thứ đã trừ kể cả khi công thức đã đổi
async function returnOrderStock(tx: Tx, orderId: string, note: string) {
  const rows = await tx.stockMovement.groupBy({ by: ["materialId", "productId"], where: { orderId }, _sum: { quantity: true } });
  const needs = { materials: new Map<string, number>(), products: new Map<string, number>() };
  for (const r of rows) {
    const out = -(r._sum.quantity ?? 0);
    if (out <= 0) continue;
    if (r.materialId) needs.materials.set(r.materialId, out);
    else if (r.productId) needs.products.set(r.productId, out);
  }
  await applyStock(tx, needs, 1, { orderId, note });
}

async function takeOrderStock(tx: Tx, orderId: string, note: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  const stock = items.map((item) => ({ productId: item.productId, beads: beadList(item.design), quantity: item.quantity, label: item.productName }));
  await applyStock(tx, await stockNeeds(tx, stock), -1, { orderId, note });
}

// Trừ hoặc trả kho khi đổi trạng thái
async function moveStock(tx: Tx, order: Order, to: OrderStatus) {
  const held = holdsStock(order.status);
  const willHold = holdsStock(to);
  if (held && !willHold) await returnOrderStock(tx, order.id, `${statusLabel[to]} đơn ${order.code}`);
  if (!held && willHold) {
    const note = order.status === OrderStatus.PREORDER ? `Chốt đơn đặt chờ ${order.code}` : `Mở lại đơn ${order.code}`;
    await takeOrderStock(tx, order.id, note);
  }
}

const lock = (tx: Tx, id: string) => tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`;

export async function transition(
  tx: Tx,
  id: string,
  to: OrderStatus,
  actor: Actor,
  extra: { note?: string | null; carrier?: string | null; trackingCode?: string | null; holdHours?: number } = {},
) {
  await lock(tx, id);
  const order = await tx.order.findUniqueOrThrow({ where: { id } });
  if (to === OrderStatus.CANCELLED) throw new HttpError(400, "Huỷ đơn cần lý do, dùng nút Huỷ đơn.", "USE_CANCEL");
  if (!TRANSITIONS[order.status].includes(to)) {
    throw new HttpError(409, `Đơn đang "${statusLabel[order.status]}", không chuyển sang "${statusLabel[to]}" được.`, "BAD_TRANSITION");
  }
  try {
    await moveStock(tx, order, to);
  } catch (err) {
    if (err instanceof HttpError) throw new HttpError(409, `Không đủ hàng để ${to === OrderStatus.PENDING ? "mở lại" : "chốt"} đơn. ${err.message}`, "NOT_ENOUGH_STOCK");
    throw err;
  }

  const data: Prisma.OrderUpdateInput = { status: to };
  // Shop đã nhận đơn: hệ thống không tự huỷ vì quá hạn thanh toán nữa
  if (to !== OrderStatus.PENDING) data.paymentDueAt = null;
  if (to === OrderStatus.SHIPPING) Object.assign(data, { carrier: extra.carrier ?? order.carrier, trackingCode: extra.trackingCode ?? order.trackingCode });
  // Đơn COD giao xong: người giao đã thu đủ
  if (to === OrderStatus.COMPLETED && order.paymentMethod === PaymentMethod.COD && order.paidVnd < order.totalVnd) {
    Object.assign(data, { paidVnd: order.totalVnd, paidAt: new Date() });
    await logEvent(tx, id, actor, { type: OrderEventType.PAYMENT, amountVnd: order.totalVnd - order.paidVnd, note: "Tiền thu hộ khi giao" });
  }
  // Hoàn hàng: gợi ý hoàn tiền đã nhận trừ phí giao, shop sửa được ở CMS
  if (to === OrderStatus.RETURNED && order.paidVnd > 0) data.refundVnd = Math.max(0, order.paidVnd - order.shippingVnd);
  // Mở lại đơn huỷ: xoá thông tin huỷ, có tiền phải chuyển thì đặt hạn mới
  if (order.status === OrderStatus.CANCELLED) {
    Object.assign(data, { cancelReason: null, cancelledBy: null, refundVnd: 0, refundedAt: null });
    if (amountDue(order) > 0 && extra.holdHours) data.paymentDueAt = new Date(Date.now() + extra.holdHours * 3600_000);
  }

  const changed = await tx.order.update({ where: { id }, data });
  const updated = await tx.order.update({ where: { id }, data: { paymentStatus: paymentStatusOf(changed) } });
  const shipping = to === OrderStatus.SHIPPING && (extra.carrier || extra.trackingCode) ? [extra.carrier, extra.trackingCode].filter(Boolean).join(" · ") : null;
  await logEvent(tx, id, actor, { type: OrderEventType.STATUS, fromStatus: order.status, toStatus: to, note: [shipping, extra.note].filter(Boolean).join(". ") || null });
  return updated;
}

export async function cancelOrder(tx: Tx, id: string, actor: Actor, input: { reason: string; refundVnd?: number }) {
  await lock(tx, id);
  const order = await tx.order.findUniqueOrThrow({ where: { id } });
  if (!CANCELLABLE[actor.kind].includes(order.status)) {
    const message =
      actor.kind === "customer"
        ? order.status === OrderStatus.CANCELLED
          ? "Đơn này đã huỷ."
          : "Shop đã xác nhận đơn này. Bạn nhắn hoặc gọi shop để huỷ."
        : `Đơn đang "${statusLabel[order.status]}", không huỷ được.${order.status === OrderStatus.SHIPPING ? " Khách không nhận hàng thì ghi Hoàn hàng." : ""}`;
    throw new HttpError(409, message, "CANNOT_CANCEL");
  }
  const suggested = await suggestedRefund(tx, order);
  const refundVnd = actor.kind === "staff" && input.refundVnd !== undefined ? Math.min(Math.max(0, input.refundVnd), order.paidVnd) : suggested;
  if (holdsStock(order.status)) await returnOrderStock(tx, order.id, `Huỷ đơn ${order.code}`);
  const changed = await tx.order.update({
    where: { id },
    data: { status: OrderStatus.CANCELLED, cancelReason: input.reason, cancelledBy: cancelActor[actor.kind], paymentDueAt: null, refundVnd, refundedAt: null },
  });
  const updated = await tx.order.update({ where: { id }, data: { paymentStatus: paymentStatusOf(changed) } });
  const kept = order.paidVnd - refundVnd;
  await logEvent(tx, id, actor, {
    type: OrderEventType.STATUS,
    fromStatus: order.status,
    toStatus: OrderStatus.CANCELLED,
    amountVnd: refundVnd || undefined,
    note: [input.reason, refundVnd > 0 && `Cần hoàn ${refundVnd.toLocaleString("vi-VN")}đ`, kept > 0 && `Giữ ${kept.toLocaleString("vi-VN")}đ tiền cọc`].filter(Boolean).join(". "),
  });
  return updated;
}

// Ghi nhận tiền nhận được (chuyển khoản, cọc, tiền mặt). Đủ số phải chuyển thì bỏ hạn thanh toán
export async function recordPayment(tx: Tx, id: string, amountVnd: number, actor: Actor, note?: string | null) {
  await lock(tx, id);
  const order = await tx.order.findUniqueOrThrow({ where: { id } });
  if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.RETURNED) {
    throw new HttpError(409, "Đơn đã huỷ hoặc hoàn hàng, không ghi nhận thêm tiền.", "ORDER_CLOSED");
  }
  const paidVnd = Math.min(order.totalVnd, order.paidVnd + amountVnd);
  const next = { ...order, paidVnd };
  const updated = await tx.order.update({
    where: { id },
    data: {
      paidVnd,
      paymentStatus: paymentStatusOf(next),
      paidAt: paidVnd >= order.totalVnd ? new Date() : order.paidAt,
      ...(amountDue(next) === 0 ? { paymentDueAt: null } : {}),
    },
  });
  await logEvent(tx, id, actor, { type: OrderEventType.PAYMENT, amountVnd: paidVnd - order.paidVnd, note });
  return updated;
}

export async function markRefunded(tx: Tx, id: string, actor: Actor, refundVnd?: number) {
  await lock(tx, id);
  const order = await tx.order.findUniqueOrThrow({ where: { id } });
  const amount = refundVnd ?? order.refundVnd;
  if (amount <= 0) throw new HttpError(409, "Đơn này không có tiền phải hoàn.", "NO_REFUND");
  if (order.refundedAt) throw new HttpError(409, "Đơn này đã ghi hoàn tiền.", "ALREADY_REFUNDED");
  const updated = await tx.order.update({ where: { id }, data: { refundVnd: amount, refundedAt: new Date(), paymentStatus: PaymentStatus.REFUNDED } });
  await logEvent(tx, id, actor, { type: OrderEventType.REFUND, amountVnd: amount });
  return updated;
}

// Việc nền: huỷ đơn quá hạn chuyển khoản mà chưa nhận đủ, trả kho. Mỗi đơn một transaction để lỗi một đơn không chặn đơn khác
export async function expireUnpaidOrders(now = new Date()) {
  const due = await prisma.order.findMany({
    where: { paymentDueAt: { lt: now }, status: { in: [OrderStatus.PENDING, OrderStatus.PREORDER] } },
    select: { id: true, code: true },
    take: 100,
  });
  const cancelled: string[] = [];
  for (const { id, code } of due) {
    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUniqueOrThrow({ where: { id } });
        if (amountDue(order) === 0) return tx.order.update({ where: { id }, data: { paymentDueAt: null } });
        await cancelOrder(tx, id, { kind: "system" }, { reason: "Quá hạn thanh toán" });
        cancelled.push(code);
      });
    } catch (error) {
      console.error(`Không huỷ được đơn quá hạn ${code}`, error);
    }
  }
  return cancelled;
}
