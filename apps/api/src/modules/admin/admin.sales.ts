import { Router } from "express";
import { z } from "zod";
import { OrderStatus, PaymentStatus, type Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { pageQuery } from "../../lib/text.js";
import { changeOrderStatus } from "../orders/orders.service.js";

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
  const data = await prisma.customer.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { orders: { orderBy: { createdAt: "desc" }, include: { _count: { select: { items: true } } } } },
  });
  res.json({ data });
});

// ---- Đơn hàng

const orderQuery = z.object({
  ...pageQuery,
  q: z.string().trim().optional(),
  status: z.enum(OrderStatus).optional(),
});

adminSalesRouter.get("/orders", async (req, res) => {
  const { page, limit, q, status } = orderQuery.parse(req.query);
  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q.toUpperCase() } },
            { customerPhone: { contains: q.replace(/\s/g, "") } },
            { customerName: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: { _count: { select: { items: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);
  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

adminSalesRouter.get("/orders/:id", async (req, res) => {
  const data = await prisma.order.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { items: { include: { product: { select: { slug: true } } } } },
  });
  res.json({ data });
});

const orderPatch = z.object({
  status: z.enum(OrderStatus).optional(),
  paymentStatus: z.enum(PaymentStatus).optional(),
});

adminSalesRouter.patch("/orders/:id", async (req, res) => {
  const { status, paymentStatus } = orderPatch.parse(req.body);
  if (status) await changeOrderStatus(req.params.id, status);
  if (paymentStatus) await prisma.order.update({ where: { id: req.params.id }, data: { paymentStatus } });
  res.json({ data: await prisma.order.findUniqueOrThrow({ where: { id: req.params.id } }) });
});

// ---- Tổng quan

adminSalesRouter.get("/dashboard", async (_req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [byStatus, revenue, lowStock, recentOrders, customers] = await prisma.$transaction([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true }, orderBy: { status: "asc" } }),
    prisma.order.aggregate({
      where: { status: OrderStatus.COMPLETED, createdAt: { gte: since } },
      _sum: { totalVnd: true },
      _count: { _all: true },
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED", stock: { lte: 3 } },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, code: true, customerName: true, totalVnd: true, status: true, createdAt: true },
    }),
    prisma.customer.count(),
  ]);

  res.json({
    data: {
      ordersByStatus: Object.fromEntries(byStatus.map((row) => [row.status, (row._count as { _all: number })._all])),
      revenue30dVnd: revenue._sum.totalVnd ?? 0,
      completed30d: revenue._count._all,
      lowStock,
      recentOrders,
      customers,
    },
  });
});
