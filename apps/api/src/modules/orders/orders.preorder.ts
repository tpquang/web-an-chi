import { z } from "zod";
import { OrderStatus, PaymentMethod, Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { unitCosts } from "../../lib/stock.js";
import { getStore, preorderOn, shippingFee } from "../../lib/store.js";
import { HttpError } from "../../middleware/errors.js";
import { cartItems, changeOrderStatusTx, orderCode, phoneField, quoteCart } from "./orders.service.js";

// Đặt chờ (đặt trước ngày mở bán): khách chỉ để lại tên, số điện thoại và món muốn đặt.
// Đơn vào CMS ở trạng thái "Đặt chờ", chưa trừ kho và chưa tính phí giao; shop gọi lại chốt địa chỉ, phí giao,
// rồi chuyển trạng thái thì mới trừ kho (xem changeOrderStatus)
export const preorderInput = z.object({
  idempotencyKey: z.uuid(),
  customer: z.object({
    name: z.string().trim().min(2, "Vui lòng nhập họ tên để shop xưng hô khi gọi lại.").max(80),
    phone: phoneField,
    note: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => value || null),
  }),
  items: cartItems,
});

// Hết hàng hay thiếu hàng không chặn đặt chờ: shop nhập thêm trước ngày giao. Các lỗi khác (ngừng bán, vòng sai cỡ) vẫn chặn
const PREORDER_OK = new Set(["OUT_OF_STOCK", "NOT_ENOUGH"]);

export async function placePreorder(input: z.infer<typeof preorderInput>) {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return { order: existing, created: false };

  if (!preorderOn(await getStore())) throw new HttpError(403, "Shop đang tạm ngừng nhận đặt chờ. Bạn nhắn shop để được tư vấn.", "PREORDER_OFF");

  const quote = await quoteCart(input.items);
  const problems = quote.lines.filter((line) => line.problem !== null && !PREORDER_OK.has(line.problem));
  if (problems.length > 0) throw new HttpError(409, "Một số món không còn đặt được. Bạn xem lại giúp shop.", "CART_CHANGED", problems);

  const { customer } = input;
  try {
    const order = await prisma.$transaction(async (tx) => {
      const lines = quote.lines.filter((line) => line.product);
      // Báo giá để 0đ cho dòng hết hàng; đặt chờ vẫn tính đủ theo giá hiện tại
      const subtotalVnd = lines.reduce((sum, { product, quantity }) => sum + product!.unitPriceVnd * quantity, 0);
      const costs = await unitCosts(
        tx,
        lines.map(({ product, quantity, design }) => ({ productId: design ? null : product!.id, beads: design ? design.beads : null, quantity, label: product!.name })),
      );
      // Gắn khách theo số điện thoại; không ghi đè địa chỉ đã có vì đặt chờ chưa hỏi địa chỉ
      const saved = await tx.customer.upsert({
        where: { phone: customer.phone },
        create: { name: customer.name, phone: customer.phone },
        update: { name: customer.name },
      });
      return tx.order.create({
        data: {
          code: orderCode(),
          idempotencyKey: input.idempotencyKey,
          status: OrderStatus.PREORDER,
          customerName: customer.name,
          customerPhone: customer.phone,
          address: "",
          note: customer.note,
          subtotalVnd,
          shippingVnd: 0,
          totalVnd: subtotalVnd,
          paymentMethod: PaymentMethod.COD,
          customerId: saved.id,
          items: {
            create: lines.map(({ product, quantity, design }, i): Prisma.OrderItemUncheckedCreateWithoutOrderInput =>
              design
                ? { productName: product!.name, unitPriceVnd: product!.unitPriceVnd, unitCostVnd: costs[i], quantity, design: design as Prisma.InputJsonValue }
                : { productId: product!.id, productName: product!.name, unitPriceVnd: product!.unitPriceVnd, unitCostVnd: costs[i], quantity },
            ),
          },
        },
      });
    });
    return { order, created: true };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const order = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (order) return { order, created: false };
    }
    throw err;
  }
}

// Chuyển đơn đặt chờ thành đơn chính sau khi shop gọi khách: ghi địa chỉ, phí giao, cách thanh toán,
// chuyển sang "Chờ xác nhận" và trừ kho trong cùng một transaction. Thiếu hàng thì không chuyển gì cả
export const convertPreorderInput = z.object({
  address: z.string().trim().min(10, "Nhập địa chỉ đủ số nhà, đường, phường, tỉnh.").max(300),
  // Để trống thì tính theo phí giao trong cài đặt cửa hàng
  shippingVnd: z.number().int().min(0).max(10_000_000).optional(),
  paymentMethod: z.enum(PaymentMethod),
});

export async function convertPreorder(id: string, input: z.infer<typeof convertPreorderInput>) {
  const store = await getStore();
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id } });
    if (order.status !== OrderStatus.PREORDER) throw new HttpError(409, "Đơn này không còn là đơn đặt chờ.", "NOT_PREORDER");
    const shippingVnd = input.shippingVnd ?? shippingFee(store, order.subtotalVnd);
    await tx.order.update({
      where: { id },
      data: { address: input.address, shippingVnd, totalVnd: order.subtotalVnd + shippingVnd, paymentMethod: input.paymentMethod },
    });
    // Hồ sơ khách chưa có địa chỉ thì lưu luôn để lần sau điền sẵn
    if (order.customerId) await tx.customer.updateMany({ where: { id: order.customerId, OR: [{ address: null }, { address: "" }] }, data: { address: input.address } });
    return changeOrderStatusTx(tx, id, OrderStatus.PENDING);
  });
}
