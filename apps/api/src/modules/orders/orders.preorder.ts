import { z } from "zod";
import { OrderStatus, PaymentMethod } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { getStore, shippingFee } from "../../lib/store.js";
import { HttpError } from "../../middleware/errors.js";
import { transition, type Actor } from "./order-flow.js";

// Đơn đặt chờ cũ (trước khi đặt chờ đi qua giỏ hàng) chỉ có tên và số điện thoại, chưa có địa chỉ.
// Đơn đặt chờ mới đã đủ địa chỉ, shop chỉ cần đổi trạng thái. Kho trừ khi rời "Chờ chuẩn bị" (xem order-flow.ts)

// Chuyển đơn đặt chờ thành đơn chính sau khi shop gọi khách: ghi địa chỉ, phí giao, cách thanh toán,
// chuyển sang "Chờ xác nhận" và trừ kho trong cùng một transaction. Thiếu hàng thì không chuyển gì cả
export const convertPreorderInput = z.object({
  address: z.string().trim().min(10, "Nhập địa chỉ đủ số nhà, đường, phường, tỉnh.").max(300),
  // Để trống thì tính theo phí giao trong cài đặt cửa hàng
  shippingVnd: z.number().int().min(0).max(10_000_000).optional(),
  paymentMethod: z.enum(PaymentMethod),
});

export async function convertPreorder(id: string, input: z.infer<typeof convertPreorderInput>, actor: Actor) {
  const store = await getStore();
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id } });
    if (order.status !== OrderStatus.PREORDER) throw new HttpError(409, "Đơn này không còn là đơn đặt chờ.", "NOT_PREORDER");
    const shippingVnd = input.shippingVnd ?? shippingFee(store, order.subtotalVnd);
    await tx.order.update({
      where: { id },
      data: { address: input.address, shippingVnd, totalVnd: order.subtotalVnd + shippingVnd, paymentMethod: input.paymentMethod,
        // Chuyển khoản cả đơn thì không còn tiền cọc
        ...(input.paymentMethod === PaymentMethod.BANK_TRANSFER ? { depositVnd: 0 } : {}) },
    });
    // Hồ sơ khách chưa có địa chỉ thì lưu luôn để lần sau điền sẵn
    if (order.customerId) await tx.customer.updateMany({ where: { id: order.customerId, OR: [{ address: null }, { address: "" }] }, data: { address: input.address } });
    return transition(tx, id, OrderStatus.PENDING, actor, { note: "Chuyển đơn đặt chờ thành đơn chính" });
  });
}
