import { Link } from "react-router-dom";
import { MonthChart } from "../components/finance/MonthChart";
import { DataTable, PageHeader, Panel, td, tdMoney, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { ErrorState, Skeleton, Tag } from "../components/ui/States";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { addMonths, loadProfit, monthLabel, monthOf, monthOptions, pct, type BreakEven, type ProfitReport } from "../lib/finance";
import { formatDateTime, formatVnd } from "../lib/format";
import { options, orderStatus, salesChannel, type OrderStatus, type SalesChannel } from "../lib/labels";
import { useLoad } from "../lib/use-load";
import { useQueryState } from "../lib/use-query-state";
import { useOrderCounts } from "../lib/order-counts";

type Dashboard = {
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  lowStock: { id: string; name: string; stock: number }[];
  lowMaterials: { id: string; name: string; stock: number; unit: string }[];
  recentOrders: { id: string; code: string; customerName: string; totalVnd: number; status: OrderStatus; channel: SalesChannel; createdAt: string }[];
};

export function DashboardPage() {
  const { can } = useAuth();
  return (
    <>
      <PageHeader title="Tổng quan" />
      <div className="flex flex-col gap-5">
        {can("finance") && <ProfitSection />}
        <OperationsSection />
      </div>
    </>
  );
}

// Trang Lợi nhuận riêng cho người có quyền tài chính mà không cần phần vận hành
export function ReportsPage() {
  return (
    <>
      <PageHeader title="Lợi nhuận" desc="Doanh thu, giá vốn, phí sàn, ship, chi phí phát sinh và khấu hao theo tháng." />
      <ProfitSection />
    </>
  );
}

// ---- Lợi nhuận: lọc theo khoảng tháng, dòng sản phẩm, kênh bán. Bộ lọc nằm trên URL

function ProfitSection() {
  const now = monthOf(new Date());
  const query = useQueryState(["from", "to", "category", "channel"] as const);
  const to = query.values.to || now;
  const from = query.values.from || addMonths(to, -5);
  const categories = useLoad(() => api.get<{ id: string; name: string }[]>("/categories"), []);
  const report = useLoad(() => loadProfit({ from, to, categoryId: query.values.category, channel: query.values.channel }), [from, to, query.values.category, query.values.channel]);
  const months = monthOptions();

  return (
    <section aria-labelledby="loi-nhuan" className="flex flex-col gap-4">
      <h2 id="loi-nhuan" className="sr-only">Lợi nhuận</h2>
      <div className="flex flex-wrap gap-2">
        <div className="w-40"><Select ariaLabel="Từ tháng" value={from} onChange={(v) => query.set({ from: v, ...(v > to ? { to: v } : {}) })} options={months} /></div>
        <div className="w-40"><Select ariaLabel="Đến tháng" value={to} onChange={(v) => query.set({ to: v, ...(v < from ? { from: v } : {}) })} options={months} /></div>
        <div className="w-52">
          <Select
            ariaLabel="Dòng sản phẩm"
            value={query.values.category}
            onChange={(category) => query.set({ category })}
            options={[{ value: "", label: "Mọi dòng sản phẩm" }, ...(categories.state.status === "ready" ? categories.state.data.map((c) => ({ value: c.id, label: c.name })) : [])]}
          />
        </div>
        <div className="w-44"><Select ariaLabel="Kênh bán" value={query.values.channel} onChange={(channel) => query.set({ channel })} options={[{ value: "", label: "Mọi kênh" }, ...options(salesChannel)]} /></div>
      </div>

      {report.state.status === "error" && <ErrorState title="Chưa tải được báo cáo" desc={report.state.error} onRetry={report.reload} />}
      {report.state.status === "loading" && (
        <div className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${report.slow ? "" : "invisible"}`}>
          {[0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-20" />)}
        </div>
      )}
      {report.state.status === "ready" && <ProfitBody data={report.state.data} />}
    </section>
  );
}

function ProfitBody({ data }: { data: ProfitReport }) {
  const { total, months } = data;
  const last = months.at(-1);
  const prev = months.at(-2);
  const delta = (pick: (m: ProfitReport["months"][number]) => number) => (last && prev ? change(pick(last), pick(prev)) : undefined);
  const aov = total.orders > 0 ? Math.round(total.revenueVnd / total.orders) : 0;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Doanh thu tiền hàng" value={formatVnd(total.revenueVnd)} delta={delta((m) => m.revenueVnd)} />
        <Stat label={`Lợi nhuận gộp · ${pct(total.grossMarginPct)}`} value={formatVnd(total.grossProfitVnd)} delta={delta((m) => m.grossProfitVnd)} />
        <Stat label="Lợi nhuận ròng" value={formatVnd(total.netProfitVnd)} delta={delta((m) => m.netProfitVnd)} tone={total.netProfitVnd < 0 ? "err" : undefined} />
        <Stat label="Chi phí phát sinh" value={formatVnd(total.expensesVnd + total.batchOtherVnd)} hint={`Khấu hao, chi phí khác đợt nhập: ${pct(total.batchOtherPct)} doanh thu`} />
        <Stat label="Số đơn" value={total.orders.toLocaleString("vi-VN")} delta={delta((m) => m.orders)} />
        <Stat label="Giá trị trung bình mỗi đơn" value={formatVnd(aov)} />
        <Stat label="Phí sàn" value={formatVnd(total.platformFeeVnd)} hint={`Ship thu khách ${formatVnd(total.shippingVnd)}, thực trả ${formatVnd(total.shippingCostVnd)}`} />
        <Stat label="Tiền đã thu" value={formatVnd(total.collectedVnd)} hint="Theo ngày nhận tiền nhập tay" />
      </div>
      {last && prev && <p className="-mt-1 text-xs text-ink-3">Mức tăng giảm so {monthLabel(last.month)} với {monthLabel(prev.month)}.</p>}
      {!data.includesSharedCosts && <p className="text-sm text-ink-2">Đang lọc theo dòng sản phẩm hoặc kênh nên lợi nhuận ròng chưa trừ chi phí chung.</p>}
      {data.itemsMissingCost > 0 && (
        <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-ink" role="status">
          Có {data.itemsMissingCost} dòng đơn chưa có giá vốn (bán trước khi nhập kho). Lợi nhuận đang cao hơn thực tế.
        </p>
      )}

      {total.breakEven && <BreakEvenPanel be={total.breakEven} revenueVnd={total.revenueVnd} months={months.length} />}

      <Panel title="Theo tháng">
        <MonthChart months={months} />
        <div className="mt-4">
          <DataTable
            head={
              <tr>
                <th className={th}>Tháng</th>
                <th className={`${th} text-right`}>Đơn</th>
                <th className={`${th} text-right`}>Doanh thu</th>
                <th className={`${th} text-right`}>Giá vốn</th>
                <th className={`${th} text-right`}>Phí sàn</th>
                <th className={`${th} text-right`}>Chi phí</th>
                <th className={`${th} text-right`}>Lợi nhuận ròng</th>
                {data.includesSharedCosts && <th className={`${th} text-right`}>Doanh thu hoà vốn</th>}
              </tr>
            }
          >
            {months.map((m) => (
              <tr key={m.month}>
                <td className={td}>{monthLabel(m.month)}</td>
                <td className={tdMoney}>{m.orders}</td>
                <td className={tdMoney}>{formatVnd(m.revenueVnd)}</td>
                <td className={tdMoney}>{formatVnd(m.costVnd)}</td>
                <td className={tdMoney}>{formatVnd(m.platformFeeVnd)}</td>
                <td className={tdMoney}>{formatVnd(m.expensesVnd + m.batchOtherVnd)}</td>
                <td className={`${tdMoney} font-medium ${m.netProfitVnd < 0 ? "text-err" : ""}`}>{formatVnd(m.netProfitVnd)}</td>
                {data.includesSharedCosts && (
                  <td className={tdMoney}>
                    {/* Tháng chưa có chi phí cố định hoặc lãi góp âm thì không có điểm hoà vốn */}
                    {m.breakEven?.breakEvenRevenueVnd ? formatVnd(m.breakEven.breakEvenRevenueVnd) : "–"}
                    {m.breakEven?.progressPct != null && m.breakEven.breakEvenRevenueVnd ? (
                      <span className={`block text-[13px] ${m.breakEven.progressPct >= 100 ? "text-ok" : "text-ink-3"}`}>đạt {pct(m.breakEven.progressPct)}</span>
                    ) : null}
                  </td>
                )}
              </tr>
            ))}
          </DataTable>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Theo dòng sản phẩm">
          <MoneyTable rows={data.categories.map((c) => ({ key: c.id ?? c.name, ...c }))} empty="Chưa có đơn trong khoảng này." />
        </Panel>
        <Panel title="Sản phẩm bán chạy">
          <MoneyTable rows={data.topProducts.map((p) => ({ key: p.name, ...p }))} empty="Chưa có đơn trong khoảng này." />
        </Panel>
        <Panel title="Theo kênh bán">
          {data.channels.length === 0 ? (
            <p className="text-sm text-ink-2">Chưa có đơn trong khoảng này.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {data.channels.map((c) => (
                <li key={c.channel} className="flex items-center justify-between gap-2 py-2">
                  <span className="flex items-center gap-2"><Tag tone={salesChannel[c.channel].tone}>{salesChannel[c.channel].label}</Tag>{c.orders} đơn</span>
                  <span className="text-right tabular-nums">
                    {formatVnd(c.revenueVnd)}
                    {c.platformFeeVnd > 0 && <span className="block text-xs text-ink-3">phí sàn {formatVnd(c.platformFeeVnd)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Chi phí theo nhóm">
          {data.expenses.length === 0 ? (
            <p className="text-sm text-ink-2">
              Chưa có chi phí. <Link to="/expenses" className="text-wood underline">Nhập chi phí phát sinh</Link>
            </p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {data.expenses.map((e) => (
                <li key={e.category} className="flex items-center justify-between gap-2 py-2">
                  <span>{e.category}</span>
                  <span className="tabular-nums">{formatVnd(e.amountVnd)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function change(now: number, before: number) {
  if (before === 0) return now === 0 ? 0 : null;
  return Math.round(((now - before) / Math.abs(before)) * 1000) / 10;
}

// Doanh thu cần có để lãi góp bù đủ chi phí cố định của kỳ đang xem (công thức ở apps/api/src/lib/break-even.ts)
function BreakEvenPanel({ be, revenueVnd, months }: { be: BreakEven; revenueVnd: number; months: number }) {
  const reached = be.revenueGapVnd === 0;
  const progress = Math.min(100, be.progressPct ?? 0);
  return (
    <Panel title="Điểm hoà vốn">
      {be.fixedCostVnd === 0 ? (
        <p className="text-sm text-ink-2">
          Chưa có chi phí cố định nào trong khoảng này nên chưa tính được điểm hoà vốn. Nhập mặt bằng, lương, quảng cáo, khấu hao ở mục <Link to="/expenses" className="text-wood hover:underline">Chi phí</Link>.
        </p>
      ) : be.breakEvenRevenueVnd === null ? (
        <p className="text-sm text-ink-2">
          {revenueVnd === 0 ? "Chưa có doanh thu trong khoảng này nên chưa tính được điểm hoà vốn." : "Lãi góp đang âm: tiền hàng chưa bù được giá vốn và phí sàn, bán thêm chỉ lỗ thêm. Xem lại giá bán hoặc giá vốn trước."}
        </p>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div><p className="text-xs text-ink-2">Chi phí cố định{months > 1 ? ` ${months} tháng` : ""}</p><p className="mt-1 text-lg font-semibold tabular-nums">{formatVnd(be.fixedCostVnd)}</p></div>
            <div><p className="text-xs text-ink-2">Tỉ lệ lãi góp</p><p className="mt-1 text-lg font-semibold tabular-nums">{pct(be.contributionPct)}</p></div>
            <div><p className="text-xs text-ink-2">Doanh thu hoà vốn</p><p className="mt-1 text-lg font-semibold tabular-nums">{formatVnd(be.breakEvenRevenueVnd)}</p></div>
          </div>
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-label="Tiến độ tới điểm hoà vốn" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
              <div className={`h-full rounded-full ${reached ? "bg-ok" : "bg-wood"}`} style={{ width: `${progress}%` }} />
            </div>
            <p className={`mt-2 ${reached ? "text-ok" : "text-ink"}`}>
              {reached
                ? `Đã qua điểm hoà vốn, doanh thu đạt ${pct(be.progressPct)} mức cần.`
                : `Cần thêm ${formatVnd(be.revenueGapVnd ?? 0)} doanh thu tiền hàng để hoà vốn (đang đạt ${pct(be.progressPct)}).`}
            </p>
          </div>
          <p className="text-[13px] text-ink-3">
            Lãi góp là tiền hàng trừ giá vốn, phí sàn và chênh lệch ship. Chi phí cố định gồm chi phí phát sinh và chi phí khác của đợt nhập không chia vào giá vốn. Tính theo cơ cấu hàng đã bán trong khoảng này.
          </p>
        </div>
      )}
    </Panel>
  );
}

function Stat({ label, value, delta, hint, tone }: { label: string; value: string; delta?: number | null; hint?: string; tone?: "err" }) {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <p className="text-xs text-ink-2">{label}</p>
      <p className={`mt-1 text-xl leading-tight font-semibold tabular-nums ${tone === "err" ? "text-err" : ""}`}>{value}</p>
      {delta !== undefined && (
        <p className="mt-1 text-xs text-ink-3">
          {delta === null ? "Tháng trước chưa có số" : `${delta > 0 ? "▲ Tăng" : delta < 0 ? "▼ Giảm" : "Không đổi"} ${delta !== 0 ? `${Math.abs(delta).toLocaleString("vi-VN")}%` : ""}`}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

function MoneyTable({ rows, empty }: { rows: { key: string; name: string; quantity: number; revenueVnd: number; grossProfitVnd: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-ink-2">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-xs text-ink-3">
        <tr>
          <th className="py-1.5 text-left font-semibold">Tên</th>
          <th className="py-1.5 text-right font-semibold">SL</th>
          <th className="py-1.5 text-right font-semibold">Doanh thu</th>
          <th className="py-1.5 text-right font-semibold">Lãi gộp</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((r) => (
          <tr key={r.key}>
            <td className="py-2 pr-2">{r.name}</td>
            <td className="py-2 text-right tabular-nums">{r.quantity}</td>
            <td className="py-2 text-right tabular-nums">{formatVnd(r.revenueVnd)}</td>
            <td className="py-2 text-right tabular-nums">
              {formatVnd(r.grossProfitVnd)}
              <span className="block text-xs text-ink-3">{pct(r.revenueVnd > 0 ? Math.round((r.grossProfitVnd / r.revenueVnd) * 1000) / 10 : null)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---- Vận hành: đơn cần xử lý, hàng sắp hết

// Việc cần làm lấy từ cùng số đếm với tab danh sách đơn
const todo = [
  { key: "todo", label: "Cần xử lý" },
  { key: "payment", label: "Chờ chuyển khoản" },
  { key: "preorder", label: "Đặt chờ" },
  { key: "confirmed", label: "Đang chuẩn bị" },
  { key: "shipping", label: "Đang giao" },
  { key: "refund", label: "Cần hoàn tiền" },
] as const;

function OperationsSection() {
  const { state, slow, reload } = useLoad(() => api.get<Dashboard>("/dashboard"), []);
  const counts = useOrderCounts();
  if (state.status === "error") return <ErrorState title="Chưa tải được số liệu" desc={state.error} onRetry={reload} />;
  if (state.status === "loading") return <Skeleton className={`h-48 ${slow ? "" : "invisible"}`} />;
  const d = state.data;
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Panel title="Đơn hàng" className="lg:col-span-2">
        <div className="mb-3 flex flex-wrap gap-2">
          {todo.map(({ key, label }) => (
            <Link
              key={key}
              to={`/orders?view=${key}`}
              className={`rounded-sm border px-3 py-1 text-xs hover:border-wood ${(key === "todo" || key === "refund") && (counts?.[key] ?? 0) > 0 ? "border-wood bg-wood-soft text-wood" : "border-line"}`}
            >
              {label}: <span className="font-semibold">{counts?.[key] ?? "–"}</span>
            </Link>
          ))}
        </div>
        <ul className="divide-y divide-line">
          {d.recentOrders.map((order) => (
            <li key={order.id}>
              <Link to={`/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm hover:text-wood">
                <span>
                  <span className="font-medium">{order.code}</span> · {order.customerName}
                  <span className="block text-xs text-ink-3">{formatDateTime(order.createdAt)} · {salesChannel[order.channel].label}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{formatVnd(order.totalVnd)}</span>
                  <Tag tone={orderStatus[order.status].tone}>{orderStatus[order.status].label}</Tag>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Sắp hết">
        {d.lowStock.length === 0 && d.lowMaterials.length === 0 ? (
          <p className="text-sm text-ink-2">Chưa có mặt hàng nào sắp hết.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {d.lowStock.map((p) => (
              <li key={p.id}>
                <Link to={`/products/${p.id}`} className="flex items-center justify-between gap-2 py-2 hover:text-wood">
                  <span>{p.name}</span>
                  <Tag tone={p.stock === 0 ? "err" : "warn"}>{p.stock === 0 ? "Hết" : `Còn ${p.stock}`}</Tag>
                </Link>
              </li>
            ))}
            {d.lowMaterials.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-2 py-2">
                <span>{m.name} <span className="text-xs text-ink-3">· nguyên liệu</span></span>
                <Tag tone={m.stock === 0 ? "err" : "warn"}>{m.stock === 0 ? "Hết" : `Còn ${m.stock} ${m.unit}`}</Tag>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
