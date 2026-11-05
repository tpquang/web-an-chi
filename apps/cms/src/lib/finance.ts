import { api } from "./api";
import type { SalesChannel } from "./labels";

// Cùng dạng với GET /reports/profit ở apps/api/src/modules/admin/admin.finance.ts
type Money = { revenueVnd: number; costVnd: number; grossProfitVnd: number };
export type MonthRow = Money & {
  month: string;
  orders: number;
  platformFeeVnd: number;
  shippingVnd: number;
  shippingCostVnd: number;
  expensesVnd: number;
  batchOtherVnd: number;
  collectedVnd: number;
  netProfitVnd: number;
  batchOtherPct: number | null;
};
export type ProfitReport = {
  from: string;
  to: string;
  includesSharedCosts: boolean;
  total: MonthRow & { grossMarginPct: number | null };
  months: MonthRow[];
  channels: { channel: SalesChannel; orders: number; revenueVnd: number; platformFeeVnd: number }[];
  categories: (Money & { id: string | null; name: string; quantity: number })[];
  topProducts: (Money & { name: string; quantity: number })[];
  expenses: { category: string; amountVnd: number }[];
  itemsMissingCost: number;
};

export type Expense = { id: string; spentAt: string; category: string; amountVnd: number; note: string | null };

// Tháng dạng YYYY-MM theo giờ máy (người dùng ở Việt Nam)
export function monthOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
export function addMonths(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  return monthOf(new Date(y, m - 1 + delta, 1));
}
export const monthLabel = (month: string) => {
  const [y, m] = month.split("-");
  return `T${Number(m)}/${y.slice(2)}`;
};
export function monthOptions(count = 24) {
  const now = monthOf(new Date());
  return Array.from({ length: count }, (_, i) => {
    const value = addMonths(now, -i);
    const [y, m] = value.split("-");
    return { value, label: `Tháng ${Number(m)}/${y}` };
  });
}

export const loadProfit = (q: { from: string; to: string; categoryId?: string; channel?: string }) => {
  const params = new URLSearchParams({ from: q.from, to: q.to });
  if (q.categoryId) params.set("categoryId", q.categoryId);
  if (q.channel) params.set("channel", q.channel);
  return api.get<ProfitReport>(`/reports/profit?${params}`);
};
export const pct = (value: number | null) => (value === null ? "–" : `${value.toLocaleString("vi-VN")}%`);
