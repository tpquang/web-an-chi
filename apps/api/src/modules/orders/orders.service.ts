import { randomInt } from "node:crypto";
import { z } from "zod";
import {
  OrderStatus,
  PaymentMethod,
  Prisma,
  PublishStatus,
} from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { getStore, shippingFee } from "../../lib/store.js";
import { HttpError } from "../../middleware/errors.js";

export const cartItems = z
  .array(z.object({ slug: z.string().min(1), quantity: z.number().int().min(1).max(99) }))
  .min(1)
  .max(50);

// Số Việt Nam 10 chữ số bắt đầu bằng 0, cho phép nhập kèm khoảng trắng, dấu chấm, +84
export const phoneField = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s.-]/g, "").replace(/^\+84/, "0"))
  .refine((value) => /^0\d{9}$/.test(value), "Số điện thoại cần đủ 10 chữ số, bắt đầu bằng 0.");

export const checkoutInput = z.object({
  idempotencyKey: z.uuid(),
  customer: z.object({
    name: z.string().trim().min(2, "Vui lòng nhập họ tên người nhận.").max(80),
    phone: phoneField,
    email: z
      .union([z.literal(""), z.email("Email chưa đúng định dạng, ví dụ ten@gmail.com.")])
      .optional()
      .transform((value) => value || null),
    address: z.string().trim().min(10, "Vui lòng nhập địa chỉ đủ số nhà, đường, phường, tỉnh.").max(300),
    note: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => value || null),
  }),
  marketingConsent: z.boolean().default(false),
  paymentMethod: z.enum(PaymentMethod),
  items: cartItems,
});

type CartItems = z.infer<typeof cartItems>;

// Gộp dòng trùng sản phẩm để kiểm tồn kho đúng tổng số lượng
function mergeItems(items: CartItems) {
  const merged = new Map<string, number>();
  for (const { slug, quantity } of items) merged.set(slug, (merged.get(slug) ?? 0) + quantity);
  return [...merged].map(([slug, quantity]) => ({ slug, quantity }));
}

export async function quoteCart(items: CartItems) {
  const wanted = mergeItems(items);
  const [products, store] = await Promise.all([
    prisma.product.findMany({
      where: { slug: { in: wanted.map((item) => item.slug) }, status: PublishStatus.PUBLISHED },
      include: { images: { orderBy: { position: "asc" }, take: 1 }, category: { select: { name: true } } },
    }),
    getStore(),
  ]);
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const lines = wanted.map(({ slug, quantity }) => {
    const found = bySlug.get(slug);
    if (!found) return { slug, quantity, problem: "UNAVAILABLE" as const, product: null, lineTotalVnd: 0 };
    const problem = found.stock === 0 ? "OUT_OF_STOCK" : quantity > found.stock ? "NOT_ENOUGH" : null;
    return {
      slug,
      quantity,
      problem,
      product: {
        id: found.id,
        name: found.name,
        categoryName: found.category.name,
        image: found.images[0] ?? null,
        unitPriceVnd: found.priceVnd,
        stock: found.stock,
      },
      // Món hết hàng không cộng vào tổng để khách thấy đúng số sẽ trả sau khi xoá nó
      lineTotalVnd: problem === "OUT_OF_STOCK" ? 0 : found.priceVnd * quantity,
    };
  });

  const subtotalVnd = lines.reduce((sum, line) => sum + line.lineTotalVnd, 0);
  const shippingVnd = shippingFee(store, subtotalVnd);
  return {
    lines,
    subtotalVnd,
    shippingVnd,
    totalVnd: subtotalVnd + shippingVnd,
    shipping: store.shipping,
    canCheckout: lines.every((line) => line.problem === null),
  };
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function orderCode(now = new Date()) {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  let random = "";
  for (let i = 0; i < 6; i++) random += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `AC${yy}${mm}${random}`;
}

export async function placeOrder(input: z.infer<typeof checkoutInput>, accountId: string | null = null) {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return { order: existing, created: false };

  const quote = await quoteCart(input.items);
  const problems = quote.lines.filter((line) => line.problem !== null);
  if (problems.length > 0) {
    throw new HttpError(409, "Một số sản phẩm trong giỏ đã thay đổi. Vui lòng xem lại giỏ hàng.", "CART_CHANGED", problems);
  }

  const { customer } = input;
  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const { slug, product, quantity } of quote.lines) {
        if (!product) continue;
        // Trừ có điều kiện để hai đơn cùng lúc không bán quá tồn kho
        const { count } = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: quantity }, status: PublishStatus.PUBLISHED },
          data: { stock: { decrement: quantity } },
        });
        if (count === 0) {
          throw new HttpError(409, `"${product.name}" vừa hết hàng. Vui lòng xem lại giỏ hàng.`, "CART_CHANGED", [
            { slug, problem: "NOT_ENOUGH" },
          ]);
        }
      }

      // Đã đăng nhập: gắn đơn vào tài khoản, người nhận có thể là người khác nên không dò theo số điện thoại
      const account = accountId ? await tx.customer.findUnique({ where: { id: accountId } }) : null;
      if (account) {
        await tx.customer.update({
          where: { id: account.id },
          data: {
            ...(account.address ? {} : { address: customer.address }),
            ...(account.email || !customer.email ? {} : { email: customer.email }),
            ...(input.marketingConsent ? { marketingConsent: true } : {}),
          },
        });
      }
      const saved = account ?? await tx.customer.upsert({
        where: { phone: customer.phone },
        create: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          marketingConsent: input.marketingConsent,
        },
        // Không tự gỡ đồng ý cũ khi khách bỏ trống ô lần này
        update: {
          name: customer.name,
          address: customer.address,
          ...(customer.email ? { email: customer.email } : {}),
          ...(input.marketingConsent ? { marketingConsent: true } : {}),
        },
      });

      return tx.order.create({
        data: {
          code: orderCode(),
          idempotencyKey: input.idempotencyKey,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          address: customer.address,
          note: customer.note,
          subtotalVnd: quote.subtotalVnd,
          shippingVnd: quote.shippingVnd,
          totalVnd: quote.totalVnd,
          paymentMethod: input.paymentMethod,
          customerId: saved.id,
          items: {
            create: quote.lines.flatMap(({ product, quantity }) =>
              product ? [{ productId: product.id, productName: product.name, unitPriceVnd: product.unitPriceVnd, quantity }] : [],
            ),
          },
        },
      });
    });
    return { order, created: true };
  } catch (err) {
    // Hai request cùng khoá chạy song song: request sau trả lại đơn của request trước
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const order = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (order) return { order, created: false };
    }
    throw err;
  }
}

// Huỷ đơn thì trả lại tồn kho; mở lại đơn đã huỷ thì trừ lại
export async function changeOrderStatus(id: string, status: OrderStatus) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
    const wasCancelled = order.status === OrderStatus.CANCELLED;
    const willCancel = status === OrderStatus.CANCELLED;

    if (wasCancelled !== willCancel) {
      for (const item of order.items) {
        if (!item.productId) continue;
        if (willCancel) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          continue;
        }
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) {
          throw new HttpError(409, `Không đủ tồn kho "${item.productName}" để mở lại đơn.`, "NOT_ENOUGH_STOCK");
        }
      }
    }

    return tx.order.update({ where: { id }, data: { status } });
  });
}
