import { Router } from "express";
import { z } from "zod";
import { OrderEventType, OrderStatus, PaymentMethod, PaymentStatus, ProductType, SalesChannel, type Prisma } from "../../generated/prisma/client.js";
import type { StaffContext } from "../../lib/auth.js";
import { applyStock, stockNeeds, unitCosts, withLiveStock } from "../../lib/stock.js";
import { hashPassword } from "../../lib/password.js";
import { optionalText } from "../../lib/text.js";
import { HttpError } from "../../middleware/errors.js";
import { prisma } from "../../lib/prisma.js";
import { pageQuery } from "../../lib/text.js";
import { logEvent } from "../orders/order-flow.js";
import { orderCode, phoneField } from "../orders/orders.service.js";

export const adminSalesRouter = Router();

// ---- Khách hàng

const customerQuery = z.object({ ...pageQuery, q: z.string().trim().optional() });

adminSalesRouter.get("/customers", async (req, res) => {
  const { page, limit, q } = customerQuery.parse(req.query);
  const where: Prisma.CustomerWhereInput = q
    ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/\s/g, "") } }] }
    : {};
  const [rows, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      include: {
        _count: { select: { orders: true } },
        orders: { select: { totalVnd: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);
  // Chỉ cộng đơn đã hoàn tất vào tổng chi tiêu
  const data = rows.map(({ orders, ...customer }) => ({
    ...customer,
    spentVnd: orders.filter((o) => o.status === OrderStatus.COMPLETED).reduce((sum, o) => sum + o.totalVnd, 0),
    lastOrderAt: orders[0]?.createdAt ?? null,
  }));
  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

adminSalesRouter.get("/customers/:id", async (req, res) => {
  const { passwordHash, googleSub, ...data } = await prisma.customer.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { orders: { orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } } } },
    omit: { passwordHash: false },
  });
  // Chỉ báo khách đã tạo tài khoản đăng nhập hay chưa, không trả hash
  res.json({ data: { ...data, hasPassword: Boolean(passwordHash), google: Boolean(googleSub) } });
});

// Đặt lại mật khẩu khi khách quên (chưa có OTP). Nhân viên báo mật khẩu tạm qua điện thoại, không gửi qua chat.
// Mọi phiên đăng nhập cũ của khách hết hiệu lực
adminSalesRouter.post("/customers/:id/password", async (req, res) => {
  const { password } = z.object({ password: z.string().min(8, "Mật khẩu tạm cần ít nhất 8 ký tự.").max(100) }).parse(req.body);
  await prisma.customer.update({
    where: { id: req.params.id },
    data: { passwordHash: await hashPassword(password), sessionVersion: { increment: 1 } },
    select: { id: true },
  });
  res.json({ data: { ok: true } });
});

// Sửa hồ sơ khách. Không sửa "nhận tin tiếp thị": đồng ý phải do chính khách chọn.
// Đơn cũ giữ thông tin giao hàng lúc đặt nên không đổi theo
const customerInput = z.object({
  name: z.string().trim().min(2, "Nhập tên khách").max(120),
  // Khách tạo qua Google có thể chưa có số. Bỏ trống thì giữ nguyên số đang có
  phone: z.union([z.literal(""), phoneField]).transform((v) => v || undefined),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Email chưa đúng")
    .transform((v) => v || null),
  address: optionalText,
});

adminSalesRouter.put("/customers/:id", async (req, res) => {
  const data = await prisma.customer.update({ where: { id: req.params.id }, data: customerInput.parse(req.body) });
  res.json({ data });
});

// Xoá hồ sơ và tài khoản đăng nhập của khách (ví dụ khách yêu cầu xoá dữ liệu cá nhân).
// Đơn hàng giữ lại để đối soát, chỉ bỏ liên kết tới hồ sơ
adminSalesRouter.delete("/customers/:id", async (req, res) => {
  await prisma.customer.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ---- Đơn hàng: danh sách, chi tiết, trạng thái ở admin.orders.ts

const vnd = z.number().int().min(0).max(2_000_000_000);
const day = z.iso.date().transform((value) => new Date(`${value}T12:00:00+07:00`));

// ---- Nhập đơn tay: đơn Shopee, TikTok, khách giới thiệu. Trừ kho như đơn web

const manualOrderInput = z.object({
  channel: z.enum(SalesChannel).default(SalesChannel.REFERRAL),
  externalCode: optionalText,
  createdAt: day.optional(),
  customer: z.object({
    name: z.string().trim().min(1, "Nhập tên khách.").max(80),
    phone: z.union([z.literal(""), phoneField]).optional().transform((value) => value || null),
    address: optionalText,
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Chọn sản phẩm."),
        quantity: z.number().int().min(1, "Số lượng ít nhất 1.").max(999),
        // Giá bán thật của đơn, có thể khác giá niêm yết (giảm giá trên sàn)
        unitPriceVnd: vnd,
      }),
    )
    .min(1, "Thêm ít nhất một sản phẩm.")
    .max(50),
  shippingVnd: vnd.default(0),
  shippingCostVnd: vnd.default(0),
  platformFeeVnd: vnd.default(0),
  paymentMethod: z.enum(PaymentMethod).default(PaymentMethod.BANK_TRANSFER),
  paymentStatus: z.enum(PaymentStatus).default(PaymentStatus.UNPAID),
  paidAt: day.nullish(),
  status: z.enum([OrderStatus.CONFIRMED, OrderStatus.SHIPPING, OrderStatus.COMPLETED]).default(OrderStatus.COMPLETED),
  note: optionalText,
});

adminSalesRouter.post("/orders", async (req, res) => {
  const input = manualOrderInput.parse(req.body);
  const staff = res.locals.staff as StaffContext;
  const products = await prisma.product.findMany({ where: { id: { in: input.items.map((i) => i.productId) } }, select: { id: true, name: true, type: true } });
  const byId = new Map(products.map((p) => [p.id, p]));
  for (const item of input.items) {
    const p = byId.get(item.productId);
    if (!p) throw new HttpError(400, "Có sản phẩm không còn tồn tại.", "UNKNOWN_PRODUCT");
    if (p.type === ProductType.SUPPLY) throw new HttpError(400, `"${p.name}" là hàng phát sinh, không bán.`, "NOT_FOR_SALE");
  }
  const stockItems = input.items.map((i) => ({ productId: i.productId, quantity: i.quantity, label: byId.get(i.productId)!.name }));
  const subtotalVnd = input.items.reduce((sum, i) => sum + i.unitPriceVnd * i.quantity, 0);

  const order = await prisma.$transaction(async (tx) => {
    const [needs, costs] = await Promise.all([stockNeeds(tx, stockItems), unitCosts(tx, stockItems)]);
    const customer = input.customer.phone
      ? await tx.customer.upsert({
          where: { phone: input.customer.phone },
          create: { name: input.customer.name, phone: input.customer.phone, address: input.customer.address },
          update: { name: input.customer.name, ...(input.customer.address ? { address: input.customer.address } : {}) },
        })
      : null;
    const created = await tx.order.create({
      data: {
        code: orderCode(input.createdAt),
        channel: input.channel,
        externalCode: input.externalCode,
        customerName: input.customer.name,
        customerPhone: input.customer.phone ?? "",
        address: input.customer.address ?? "",
        note: input.note,
        subtotalVnd,
        shippingVnd: input.shippingVnd,
        totalVnd: subtotalVnd + input.shippingVnd,
        shippingCostVnd: input.shippingCostVnd,
        platformFeeVnd: input.platformFeeVnd,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentStatus,
        paidAt: input.paidAt ?? (input.paymentStatus === PaymentStatus.PAID ? (input.createdAt ?? new Date()) : null),
        status: input.status,
        customerId: customer?.id ?? null,
        createdById: staff.id,
        ...(input.createdAt ? { createdAt: input.createdAt } : {}),
        items: {
          create: input.items.map((i, n) => ({ productId: i.productId, productName: byId.get(i.productId)!.name, unitPriceVnd: i.unitPriceVnd, unitCostVnd: costs[n], quantity: i.quantity })),
        },
      },
    });
    await applyStock(tx, needs, -1, { orderId: created.id, note: `Đơn ${created.code}` });
    await logEvent(tx, created.id, { kind: "staff", id: staff.id, name: staff.name || staff.email }, { type: OrderEventType.CREATED, toStatus: created.status, note: "Nhập đơn tay" });
    return created;
  });
  res.status(201).json({ data: order });
});

// ---- Tổng quan

adminSalesRouter.get("/dashboard", async (_req, res) => {
  const [byStatus, products, lowMaterials, recentOrders] = await prisma.$transaction([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
    // Vòng xâu hạt có tồn kho tính từ hạt nên lấy hết sản phẩm đang bán rồi lọc sau
    prisma.product.findMany({ where: { status: "PUBLISHED", type: { not: ProductType.SUPPLY } }, select: { id: true, name: true, stock: true, type: true } }),
    prisma.material.findMany({ where: { stock: { lte: 10 } }, select: { id: true, name: true, stock: true, unit: true }, orderBy: { stock: "asc" }, take: 8 }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, code: true, customerName: true, totalVnd: true, status: true, channel: true, createdAt: true },
    }),
  ]);
  const lowStock = (await withLiveStock(prisma, products))
    .filter((p) => p.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8)
    .map(({ id, name, stock }) => ({ id, name, stock }));

  res.json({
    data: {
      ordersByStatus: Object.fromEntries(byStatus.map((row) => [row.status, (row._count as { _all: number })._all])),
      lowStock,
      lowMaterials,
      recentOrders,
    },
  });
});
