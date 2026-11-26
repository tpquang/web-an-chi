import { Link } from "react-router-dom";
import { RowActions } from "../components/RowActions";
import { DataTable, PageHeader, Pagination, td, tdMoney, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { EmptyState, ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { api } from "../lib/api";
import { formatDateTime, formatVnd } from "../lib/format";
import { PlusIcon } from "../components/icons";
import { ButtonLink } from "../components/ui/Button";
import { useAuth } from "../lib/auth";
import { options, orderStatus, paymentMethod, paymentStatus, salesChannel } from "../lib/labels";
import type { OrderRow } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useQueryState } from "../lib/use-query-state";
import { orderFlags, useOrderCounts } from "../lib/order-counts";
import type { OrderCounts } from "../lib/types";

// Tab theo việc cần làm. Cần xử lý: đơn chờ xác nhận không còn chờ khách chuyển tiền, đơn còn tiền phải hoàn
const views: { key: keyof OrderCounts | ""; label: string }[] = [
  { key: "todo", label: "Cần xử lý" },
  { key: "payment", label: "Chờ chuyển khoản" },
  { key: "preorder", label: "Đặt chờ" },
  { key: "confirmed", label: "Đang chuẩn bị" },
  { key: "shipping", label: "Đang giao" },
  { key: "refund", label: "Cần hoàn tiền" },
  { key: "", label: "Tất cả" },
];
import { SearchBox } from "./ProductsPage";

export function OrdersPage() {
  const { can } = useAuth();
  const query = useQueryState(["q", "status", "channel", "view"] as const);
  const counts = useOrderCounts();
  const { state, slow, reload } = useLoad(() => api.list<OrderRow>(`/orders?${query.toQuery({ limit: 20 })}`), [query.toQuery()]);

  return (
    <>
      <PageHeader
        title="Đơn hàng"
        desc="Đơn web vào tự động. Đơn Shopee, TikTok, khách giới thiệu nhập tay để trừ kho và tính lợi nhuận."
        actions={can("orders", "edit") && <ButtonLink to="/orders/new"><PlusIcon size={18} /> Nhập đơn</ButtonLink>}
      />
      <nav aria-label="Lọc theo việc cần làm" className="-mx-1 mb-3 flex gap-1 overflow-x-auto px-1 pb-1">
        {views.map(({ key, label }) => {
          const active = query.values.view === key;
          const count = key ? counts?.[key] : undefined;
          return (
            <button
              key={key || "all"}
              type="button"
              aria-pressed={active}
              onClick={() => query.set({ view: key })}
              className={`inline-flex min-h-10 flex-none items-center gap-2 rounded-sm px-3 text-sm whitespace-nowrap transition-colors duration-(--d-fast) ${active ? "bg-wood-soft font-medium text-wood" : "text-ink-2 hover:bg-paper-2 hover:text-ink"}`}
            >
              {label}
              {count ? <span className={`inline-flex min-w-5 justify-center rounded-full px-1.5 text-[11px] leading-5 font-semibold ${key === "todo" || key === "refund" ? "bg-wood text-on-wood" : "bg-paper-2 text-ink-2"}`}>{count}</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchBox label="Tìm mã đơn, tên, số điện thoại" value={query.values.q} onSearch={(q) => query.set({ q })} />
        <div className="sm:w-52">
          <Select ariaLabel="Lọc theo trạng thái" value={query.values.status} onChange={(status) => query.set({ status })} options={[{ value: "", label: "Mọi trạng thái" }, ...options(orderStatus)]} />
        </div>
        <div className="sm:w-44">
          <Select ariaLabel="Lọc theo kênh" value={query.values.channel} onChange={(channel) => query.set({ channel })} options={[{ value: "", label: "Mọi kênh" }, ...options(salesChannel)]} />
        </div>
      </div>
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được đơn hàng" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.data.length === 0 &&
        (query.values.view && !query.values.q && !query.values.status && !query.values.channel ? (
          <EmptyState title="Không còn đơn ở mục này." desc="Mọi đơn đã được xử lý." />
        ) : (
          <EmptyState title="Không có đơn khớp bộ lọc." desc="Bỏ bớt bộ lọc hoặc thử từ khoá khác." />
        ))}
      {state.status === "ready" && state.data.data.length > 0 && (
        <>
          <DataTable
            head={
              <tr>
                <th className={th}>Mã đơn</th>
                <th className={th}>Khách hàng</th>
                <th className={`${th} text-right`}>Tổng tiền</th>
                <th className={th}>Thanh toán</th>
                <th className={th}>Trạng thái</th>
                <th className={`${th} text-right`}>Thao tác</th>
              </tr>
            }
          >
            {state.data.data.map((order) => (
              <tr key={order.id} className="hover:bg-paper">
                <td className={td}>
                  <Link to={`/orders/${order.id}`} className="font-medium hover:text-wood">{order.code}</Link>
                  <span className="block text-xs whitespace-nowrap text-ink-3">{formatDateTime(order.createdAt)} · {salesChannel[order.channel].label}{order.externalCode ? ` · ${order.externalCode}` : ""}</span>
                </td>
                <td className={td}>
                  {order.customerName}
                  <span className="block text-[13px] text-ink-3">{order.customerPhone}</span>
                </td>
                <td className={tdMoney}>{formatVnd(order.totalVnd)}</td>
                <td className={td}>
                  <span className="block text-[13px] text-ink-3">{paymentMethod[order.paymentMethod]}</span>
                  <Tag tone={paymentStatus[order.paymentStatus].tone}>{paymentStatus[order.paymentStatus].label}</Tag>
                </td>
                <td className={td}>
                  <span className="flex flex-col items-start gap-1">
                    <Tag tone={orderStatus[order.status].tone}>{orderStatus[order.status].label}</Tag>
                    {orderFlags(order).map((flag) => <Tag key={flag.label} tone={flag.tone}>{flag.label}</Tag>)}
                  </span>
                </td>
                <td className={td}><RowActions name={order.code} editTo={`/orders/${order.id}`} editLabel="Xem" /></td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={query.page} totalPages={state.data.meta.totalPages} onPage={(page) => query.set({ page })} />
        </>
      )}
    </>
  );
}
