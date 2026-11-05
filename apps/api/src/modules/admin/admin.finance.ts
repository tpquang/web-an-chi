import { Router } from "express";
import { z } from "zod";
import { OrderStatus, SalesChannel, type Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { optionalText } from "../../lib/text.js";

// Chi phí phát sinh và báo cáo lợi nhuận theo tháng. Chỉ chủ shop xem.
export const adminFinanceRouter = Router();

// Tháng tính theo giờ Việt Nam
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const monthKey = (date: Date) => new Date(date.getTime() + VN_OFFSET_MS).toISOString().slice(0, 7);
const monthStart = (key: string) => new Date(Date.parse(`${key}-01T00:00:00Z`) - VN_OFFSET_MS);
function nextMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Tháng dạng YYYY-MM, ví dụ 2026-11.");

// Nhóm hay dùng, CMS gợi ý sẵn. Vẫn nhập được nhóm khác
export const EXPENSE_CATEGORIES = ["Khấu hao", "Mặt bằng", "Lương", "Quảng cáo", "Phí sàn", "Vận chuyển", "Bao bì ship", "Khác"];

// ---- Chi phí phát sinh

const expenseInput = z.object({
  spentAt: z.iso.date("Chọn ngày phát sinh.").transform((value) => new Date(`${value}T12:00:00+07:00`)),
  category: z.string().trim().min(1, "Chọn hoặc nhập nhóm chi phí.").max(60),
  amountVnd: z.number().int().positive("Số tiền phải lớn hơn 0.").max(2_000_000_000),
  note: optionalText,
});

const expenseQuery = z.object({ from: month.optional(), to: month.optional(), category: z.string().optional() });

function monthRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  return { ...(from ? { gte: monthStart(from) } : {}), ...(to ? { lt: monthStart(nextMonth(to)) } : {}) };
}

adminFinanceRouter.get("/expenses", async (req, res) => {
  const { from, to, category } = expenseQuery.parse(req.query);
  const spentAt = monthRange(from, to);
  const data = await prisma.expense.findMany({
    where: { ...(spentAt ? { spentAt } : {}), ...(category ? { category } : {}) },
    orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
  });
  res.json({ data, meta: { categories: EXPENSE_CATEGORIES } });
});

adminFinanceRouter.post("/expenses", async (req, res) => {
  res.status(201).json({ data: await prisma.expense.create({ data: expenseInput.parse(req.body) }) });
});

adminFinanceRouter.put("/expenses/:id", async (req, res) => {
  res.json({ data: await prisma.expense.update({ where: { id: req.params.id }, data: expenseInput.parse(req.body) }) });
});

adminFinanceRouter.delete("/expenses/:id", async (req, res) => {
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ---- Báo cáo lợi nhuận
// Doanh thu tính đơn đã xác nhận trở đi, bỏ đơn chờ và đơn huỷ. Giá vốn lấy theo giá vốn lưu trên từng dòng đơn.
// Lợi nhuận gộp = tiền hàng - giá vốn.
// Lợi nhuận ròng = lợi nhuận gộp - phí sàn + (ship thu khách - ship thực trả) - chi phí phát sinh - chi phí khác của đợt nhập.
// Chi phí khác của đợt nhập (khấu hao...) không chia vào giá vốn, tính vào tháng nhận hàng và báo tỉ lệ % trên doanh thu.
// Tiền đã thu tính theo ngày nhận tiền nhập tay, không theo ngày đặt.

const COUNTED = [OrderStatus.CONFIRMED, OrderStatus.SHIPPING, OrderStatus.COMPLETED];
const CUSTOM_DESIGN = "Vòng tự thiết kế";

const reportQuery = z.object({ from: month, to: month, categoryId: z.string().optional(), channel: z.enum(SalesChannel).optional() });

type Bucket = {
  orders: number;
  revenueVnd: number;
  costVnd: number;
  platformFeeVnd: number;
  shippingVnd: number;
  shippingCostVnd: number;
  expensesVnd: number;
  batchOtherVnd: number;
  collectedVnd: number;
};
const empty = (): Bucket => ({ orders: 0, revenueVnd: 0, costVnd: 0, platformFeeVnd: 0, shippingVnd: 0, shippingCostVnd: 0, expensesVnd: 0, batchOtherVnd: 0, collectedVnd: 0 });
const net = (b: Bucket) => b.revenueVnd - b.costVnd - b.platformFeeVnd + b.shippingVnd - b.shippingCostVnd - b.expensesVnd - b.batchOtherVnd;
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);

adminFinanceRouter.get("/reports/profit", async (req, res) => {
  const { from, to, categoryId, channel } = reportQuery.parse(req.query);
  const range = monthRange(from, to)!;
  // Lọc theo dòng sản phẩm hoặc kênh thì chi phí chung không chia được, nên không trừ
  const whole = !categoryId && !channel;
  const [orders, expenses, batchExtras, paid, byChannel] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: COUNTED }, createdAt: range, ...(channel ? { channel } : {}) },
      select: {
        createdAt: true,
        shippingVnd: true,
        shippingCostVnd: true,
        platformFeeVnd: true,
        items: {
          select: {
            productName: true,
            productId: true,
            quantity: true,
            unitPriceVnd: true,
            unitCostVnd: true,
            design: true,
            product: { select: { category: { select: { id: true, name: true } } } },
          },
        },
      },
    }),
    whole ? prisma.expense.findMany({ where: { spentAt: range }, select: { spentAt: true, category: true, amountVnd: true } }) : Promise.resolve([]),
    whole
      ? prisma.purchaseExtra.findMany({ where: { allocate: false, batch: { receivedAt: range } }, select: { label: true, amountVnd: true, batch: { select: { receivedAt: true } } } })
      : Promise.resolve([]),
    prisma.order.findMany({ where: { paidAt: range, status: { not: OrderStatus.CANCELLED }, ...(channel ? { channel } : {}) }, select: { paidAt: true, totalVnd: true } }),
    prisma.order.groupBy({
      by: ["channel"],
      where: { status: { in: COUNTED }, createdAt: range },
      _count: { _all: true },
      _sum: { subtotalVnd: true, platformFeeVnd: true },
      orderBy: { channel: "asc" },
    }),
  ]);

  const months = new Map<string, Bucket>();
  for (let key = from; key <= to; key = nextMonth(key)) months.set(key, empty());
  const categories = new Map<string, { id: string | null; name: string; quantity: number; revenueVnd: number; costVnd: number }>();
  const products = new Map<string, { name: string; quantity: number; revenueVnd: number; costVnd: number }>();
  const expenseByCategory = new Map<string, number>();
  let missingCost = 0;

  for (const order of orders) {
    const items = order.items.filter((item) => !categoryId || item.product?.category.id === categoryId);
    if (items.length === 0) continue;
    const bucket = months.get(monthKey(order.createdAt))!;
    bucket.orders += 1;
    if (!categoryId) {
      bucket.shippingVnd += order.shippingVnd;
      bucket.shippingCostVnd += order.shippingCostVnd;
      bucket.platformFeeVnd += order.platformFeeVnd;
    }
    for (const item of items) {
      const revenue = item.unitPriceVnd * item.quantity;
      const cost = item.unitCostVnd * item.quantity;
      if (item.unitCostVnd === 0) missingCost += 1;
      bucket.revenueVnd += revenue;
      bucket.costVnd += cost;
      const category = item.product?.category ?? { id: null, name: item.design ? CUSTOM_DESIGN : "Sản phẩm đã xoá" };
      const catKey = category.id ?? category.name;
      const cat = categories.get(catKey) ?? { ...category, quantity: 0, revenueVnd: 0, costVnd: 0 };
      cat.quantity += item.quantity;
      cat.revenueVnd += revenue;
      cat.costVnd += cost;
      categories.set(catKey, cat);
      const prodKey = item.productId ?? (item.design ? CUSTOM_DESIGN : item.productName);
      const prod = products.get(prodKey) ?? { name: item.design ? CUSTOM_DESIGN : item.productName, quantity: 0, revenueVnd: 0, costVnd: 0 };
      prod.quantity += item.quantity;
      prod.revenueVnd += revenue;
      prod.costVnd += cost;
      products.set(prodKey, prod);
    }
  }
  for (const e of expenses) {
    months.get(monthKey(e.spentAt))!.expensesVnd += e.amountVnd;
    expenseByCategory.set(e.category, (expenseByCategory.get(e.category) ?? 0) + e.amountVnd);
  }
  for (const e of batchExtras) {
    months.get(monthKey(e.batch.receivedAt!))!.batchOtherVnd += e.amountVnd;
    const label = `Đợt nhập: ${e.label}`;
    expenseByCategory.set(label, (expenseByCategory.get(label) ?? 0) + e.amountVnd);
  }
  for (const o of paid) months.get(monthKey(o.paidAt!))!.collectedVnd += o.totalVnd;

  const withProfit = <T extends { revenueVnd: number; costVnd: number }>(row: T) => ({ ...row, grossProfitVnd: row.revenueVnd - row.costVnd });
  const monthRows = [...months].map(([key, b]) => ({ month: key, ...withProfit(b), netProfitVnd: net(b), batchOtherPct: pct(b.batchOtherVnd, b.revenueVnd) }));
  const total = monthRows.reduce((sum, m) => {
    for (const k of Object.keys(sum) as (keyof Bucket)[]) sum[k] += m[k];
    return sum;
  }, empty());

  res.json({
    data: {
      from,
      to,
      categoryId: categoryId ?? null,
      channel: channel ?? null,
      includesSharedCosts: whole,
      total: { ...withProfit(total), netProfitVnd: net(total), batchOtherPct: pct(total.batchOtherVnd, total.revenueVnd), grossMarginPct: pct(total.revenueVnd - total.costVnd, total.revenueVnd) },
      channels: byChannel.map((c) => ({ channel: c.channel, orders: c._count._all, revenueVnd: c._sum.subtotalVnd ?? 0, platformFeeVnd: c._sum.platformFeeVnd ?? 0 })),
      months: monthRows,
      categories: [...categories.values()].map(withProfit).sort((a, b) => b.revenueVnd - a.revenueVnd),
      topProducts: [...products.values()].map(withProfit).sort((a, b) => b.revenueVnd - a.revenueVnd).slice(0, 10),
      expenses: [...expenseByCategory].map(([category, amountVnd]) => ({ category, amountVnd })).sort((a, b) => b.amountVnd - a.amountVnd),
      // Số dòng đơn chưa có giá vốn (đơn cũ, hoặc bán trước khi nhập kho): lợi nhuận đang bị tính cao hơn thật
      itemsMissingCost: missingCost,
    },
  });
});
