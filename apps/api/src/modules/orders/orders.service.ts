import { randomInt } from "node:crypto";
import { z } from "zod";
import {
  OrderEventType,
  OrderStatus,
  PaymentMethod,
  Prisma,
  PublishStatus,
} from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { sellableProduct } from "../../lib/pricing.js";
import { applyStock, stockNeeds, unitCosts, withLiveStock, type StockItem } from "../../lib/stock.js";
import { depositFor, getStore, holdHours, isPreLaunch, preorderOn, shippingFee } from "../../lib/store.js";
import { HttpError } from "../../middleware/errors.js";
import {
  activeBeads,
  braceletDesign,
  braceletName,
  braceletRules,
  countBeads,
  designSnapshot,
  maxBuildable,
  priceBracelet,
} from "../bracelet/bracelet.service.js";
import { logEvent } from "./order-flow.js";

export const cartItems = z
  .array(
    z.object({
      slug: z.string().min(1).max(120),
      quantity: z.number().int().min(1).max(99),
      // Có design là vòng tự thiết kế, slug lúc đó chỉ là khoá dòng trong giỏ
      design: braceletDesign.optional(),
    }),
  )
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
  // Tổng tiền khách thấy ở trang thanh toán. Giá đổi trong lúc khách điền form thì báo lại, không tự tính giá mới
  expectedTotalVnd: z.number().int().min(0).optional(),
});

// Hết hàng, thiếu hàng không chặn đơn đặt chờ: đơn chưa trừ kho, shop nhập thêm trước ngày giao
const STOCK_PROBLEMS = new Set<string>(["OUT_OF_STOCK", "NOT_ENOUGH"]);

type CartItems = z.infer<typeof cartItems>;

// Gộp dòng trùng sản phẩm để kiểm tồn kho đúng tổng số lượng
function mergeItems(items: CartItems) {
  const merged = new Map<string, CartItems[number]>();
  for (const item of items) {
    const current = merged.get(item.slug);
    merged.set(item.slug, current ? { ...current, quantity: current.quantity + item.quantity } : item);
  }
  return [...merged.values()];
}

type LineProblem = "UNAVAILABLE" | "OUT_OF_STOCK" | "NOT_ENOUGH";

export async function quoteCart(items: CartItems) {
  const wanted = mergeItems(items);
  const beadSlugs = [...new Set(wanted.flatMap((item) => item.design?.beads ?? []))];
  const [products, beads, store] = await Promise.all([
    prisma.product
      .findMany({
        where: { slug: { in: wanted.filter((item) => !item.design).map((item) => item.slug) }, ...sellableProduct },
        include: { images: { orderBy: { position: "asc" }, take: 1 }, category: { select: { name: true } } },
      })
      .then((rows) => withLiveStock(prisma, rows)),
    beadSlugs.length ? activeBeads(beadSlugs) : Promise.resolve([]),
    getStore(),
  ]);
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const beadBySlug = new Map(beads.map((bead) => [bead.slug, bead]));
  // Hạt đã giữ cho các vòng phía trước trong giỏ, để hai vòng dùng chung một loại hạt không vượt tồn kho
  const reserved = new Map<string, number>();

  const lines = wanted.map(({ slug, quantity, design }) => {
    if (design) {
      const priced = priceBracelet(design, beadBySlug);
      if (!priced) return { slug, quantity, problem: "UNAVAILABLE" as LineProblem, product: null, lineTotalVnd: 0, design: null };
      const stock = maxBuildable(design, beadBySlug, reserved);
      for (const [bead, count] of countBeads(design)) reserved.set(bead, (reserved.get(bead) ?? 0) + count * Math.min(quantity, stock));
      const problem: LineProblem | null =
        // Khách xâu dài ngắn tuỳ ý (quấn dư vòng cũng được), chỉ chặn khi thiếu hàng
        stock === 0 ? "OUT_OF_STOCK"
        : quantity > stock ? "NOT_ENOUGH"
        : null;
      return {
        slug,
        quantity,
        problem,
        product: {
          id: "bracelet",
          name: braceletName(design, beadBySlug),
          categoryName: "Vòng tự thiết kế",
          image: null,
          unitPriceVnd: priced.unitPriceVnd,
          stock,
        },
        lineTotalVnd: problem === "OUT_OF_STOCK" ? 0 : priced.unitPriceVnd * quantity,
        design: { ...designSnapshot(design, beadBySlug), lengthMm: priced.lengthMm, beadsVnd: priced.beadsVnd },
      };
    }
    const found = bySlug.get(slug);
    if (!found) return { slug, quantity, problem: "UNAVAILABLE" as LineProblem, product: null, lineTotalVnd: 0, design: null };
    const problem: LineProblem | null = found.stock === 0 ? "OUT_OF_STOCK" : quantity > found.stock ? "NOT_ENOUGH" : null;
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
      design: null,
    };
  });

  // Trước giờ mở bán (CMS > Thông tin cửa hàng) đơn là đơn đặt chờ, nếu shop bật nhận đặt chờ
  const preLaunch = isPreLaunch(store);
  const preorder = preLaunch && preorderOn(store);
  const priced = preorder
    ? lines.map((line) =>
        line.problem && STOCK_PROBLEMS.has(line.problem) && line.product
          ? { ...line, problem: null, lineTotalVnd: line.product.unitPriceVnd * line.quantity }
          : line,
      )
    : lines;
  const subtotalVnd = priced.reduce((sum, line) => sum + line.lineTotalVnd, 0);
  const shippingVnd = shippingFee(store, subtotalVnd);
  const deposit = depositFor(store, {
    subtotalVnd,
    preorder,
    custom: priced.some((line) => line.design),
    marked: wanted.some((item) => !item.design && bySlug.get(item.slug)?.requiresDeposit),
  });
  return {
    lines: priced,
    preorder,
    // Trước ngày mở bán mà shop tắt đặt chờ thì không nhận đơn
    preorderClosed: preLaunch && !preorder,
    // Cách thanh toán khách chọn được. Có deposit thì trả khi nhận hàng phải chuyển khoản cọc trước số này
    payment: { bankTransfer: Boolean(store.bank), deposit, holdHours: holdHours(store) },
    subtotalVnd,
    shippingVnd,
    totalVnd: subtotalVnd + shippingVnd,
    shipping: store.shipping,
    canCheckout: priced.every((line) => line.problem === null) && !(preLaunch && !preorder),
  };
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function orderCode(now = new Date()) {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  let random = "";
  for (let i = 0; i < 6; i++) random += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `AC${yy}${mm}${random}`;
}


// Dòng giỏ đã báo giá quy ra dòng trừ kho
function orderStockItems(lines: Awaited<ReturnType<typeof quoteCart>>["lines"]): StockItem[] {
  return lines.flatMap(({ product, quantity, design }) =>
    !product ? [] : [{ productId: design ? null : product.id, beads: design ? design.beads : null, quantity, label: product.name }],
  );
}

// Đơn đang chờ chuyển tiền tối đa mỗi số điện thoại, để một người không giữ hết kho bằng đơn không trả
const OPEN_UNPAID_PER_PHONE = 3;

export async function placeOrder(input: z.infer<typeof checkoutInput>, accountId: string | null = null) {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return { order: existing, created: false };

  const quote = await quoteCart(input.items);
  if (input.expectedTotalVnd !== undefined && input.expectedTotalVnd !== quote.totalVnd) {
    throw new HttpError(409, "Giá hoặc phí giao vừa thay đổi. Bạn xem lại tổng tiền rồi đặt hàng.", "PRICE_CHANGED");
  }
  if (quote.preorderClosed) throw new HttpError(403, "Shop đang tạm ngừng nhận đặt chờ. Bạn nhắn shop để được tư vấn.", "PREORDER_OFF");
  if (input.paymentMethod === PaymentMethod.BANK_TRANSFER && !quote.payment.bankTransfer) {
    throw new HttpError(400, "Shop chưa nhận chuyển khoản. Bạn chọn trả tiền khi nhận hàng.", "NO_BANK");
  }
  // Chuyển khoản toàn bộ thì không cần cọc
  const depositVnd = input.paymentMethod === PaymentMethod.COD ? (quote.payment.deposit?.amountVnd ?? 0) : 0;
  // Có tiền phải chuyển (cả đơn hoặc cọc) thì có hạn; quá hạn hệ thống huỷ đơn, trả kho (expireUnpaidOrders)
  const mustTransfer = input.paymentMethod === PaymentMethod.BANK_TRANSFER || depositVnd > 0;
  const paymentDueAt = mustTransfer ? new Date(Date.now() + quote.payment.holdHours * 3600_000) : null;
  if (mustTransfer) {
    const open = await prisma.order.count({
      where: { customerPhone: input.customer.phone, paymentDueAt: { not: null }, status: { in: [OrderStatus.PENDING, OrderStatus.PREORDER] } },
    });
    if (open >= OPEN_UNPAID_PER_PHONE) {
      throw new HttpError(429, "Số điện thoại này đang có nhiều đơn chờ chuyển khoản. Bạn chuyển khoản hoặc huỷ bớt đơn cũ, hoặc chọn trả khi nhận hàng.", "TOO_MANY_UNPAID");
    }
  }
  const problems = quote.lines.filter((line) => line.problem !== null);
  if (problems.length > 0) {
    throw new HttpError(409, "Một số sản phẩm trong giỏ đã thay đổi. Vui lòng xem lại giỏ hàng.", "CART_CHANGED", problems);
  }

  const { customer } = input;
  try {
    const order = await prisma.$transaction(async (tx) => {
      const stockItems = orderStockItems(quote.lines);
      const [needs, costs] = await Promise.all([stockNeeds(tx, stockItems), unitCosts(tx, stockItems)]);

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

      const created = await tx.order.create({
        data: {
          code: orderCode(),
          idempotencyKey: input.idempotencyKey,
          ...(quote.preorder ? { status: OrderStatus.PREORDER } : {}),
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          address: customer.address,
          note: customer.note,
          subtotalVnd: quote.subtotalVnd,
          shippingVnd: quote.shippingVnd,
          totalVnd: quote.totalVnd,
          depositVnd,
          paymentDueAt,
          paymentMethod: input.paymentMethod,
          customerId: saved.id,
          items: {
            create: quote.lines.filter((l) => l.product).flatMap(({ product, quantity, design }, i): Prisma.OrderItemUncheckedCreateWithoutOrderInput[] =>
              !product ? []
              : design ? [{ productName: product.name, unitPriceVnd: product.unitPriceVnd, unitCostVnd: costs[i], quantity, design: design as Prisma.InputJsonValue }]
              : [{ productId: product.id, productName: product.name, unitPriceVnd: product.unitPriceVnd, unitCostVnd: costs[i], quantity }],
            ),
          },
        },
      });
      await logEvent(tx, created.id, { kind: "customer" }, { type: OrderEventType.CREATED, toStatus: created.status });
      // Đơn đặt chờ chưa trừ kho; shop chuyển sang "Chờ xác nhận" thì mới trừ (order-flow.ts)
      if (quote.preorder) return created;
      try {
        await applyStock(tx, needs, -1, { orderId: created.id, note: `Đơn ${created.code}` });
      } catch (err) {
        if (err instanceof HttpError) throw new HttpError(409, `${err.message} Vui lòng xem lại giỏ hàng.`, "CART_CHANGED", []);
        throw err;
      }
      return created;
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
