import { Link } from "react-router-dom";
import { DataTable, PageHeader, Pagination, td, tdMoney, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { EmptyState, ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { api } from "../lib/api";
import { formatDateTime, formatVnd } from "../lib/format";
import { options, orderStatus, paymentMethod, paymentStatus } from "../lib/labels";
import type { OrderRow } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useQueryState } from "../lib/use-query-state";
import { SearchBox } from "./ProductsPage";

export function OrdersPage() {
  const query = useQueryState(["q", "status"] as const);
  const { state, slow, reload } = useLoad(() => api.list<OrderRow>(`/orders?${query.toQuery({ limit: 20 })}`), [query.toQuery()]);

  return (
    <>
      <PageHeader title="Đơn hàng" />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchBox label="Tìm mã đơn, tên, số điện thoại" value={query.values.q} onSearch={(q) => query.set({ q })} />
        <div className="sm:w-52">
          <Select ariaLabel="Lọc theo trạng thái" value={query.values.status} onChange={(status) => query.set({ status })} options={[{ value: "", label: "Mọi trạng thái" }, ...options(orderStatus)]} />
        </div>
      </div>
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được đơn hàng" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.data.length === 0 && <EmptyState title="Không có đơn khớp bộ lọc." desc="Bỏ bớt bộ lọc hoặc thử từ khoá khác." />}
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
              </tr>
            }
          >
            {state.data.data.map((order) => (
              <tr key={order.id} className="hover:bg-paper">
                <td className={td}>
                  <Link to={`/orders/${order.id}`} className="font-medium hover:text-wood">{order.code}</Link>
                  <span className="block text-[13px] whitespace-nowrap text-ink-3">{formatDateTime(order.createdAt)}</span>
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
                <td className={td}><Tag tone={orderStatus[order.status].tone}>{orderStatus[order.status].label}</Tag></td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={query.page} totalPages={state.data.meta.totalPages} onPage={(page) => query.set({ page })} />
        </>
      )}
    </>
  );
}
