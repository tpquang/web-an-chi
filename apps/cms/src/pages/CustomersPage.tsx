import { Link, useParams } from "react-router-dom";
import { DataTable, PageHeader, Pagination, Panel, td, tdMoney, th } from "../components/ui/Page";
import { EmptyState, ErrorState, Skeleton, TableSkeleton, Tag } from "../components/ui/States";
import { api } from "../lib/api";
import { formatDate, formatDateTime, formatVnd } from "../lib/format";
import { orderStatus } from "../lib/labels";
import type { Customer, CustomerRow } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useQueryState } from "../lib/use-query-state";
import { SearchBox } from "./ProductsPage";

export function CustomersPage() {
  const query = useQueryState(["q"] as const);
  const { state, slow, reload } = useLoad(() => api.list<CustomerRow>(`/customers?${query.toQuery({ limit: 20 })}`), [query.toQuery()]);

  return (
    <>
      <PageHeader title="Khách hàng" desc="Khách được tạo tự động khi đặt hàng, nhận diện theo số điện thoại." />
      <div className="mb-4">
        <SearchBox label="Tìm theo tên hoặc số điện thoại" value={query.values.q} onSearch={(q) => query.set({ q })} />
      </div>
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được khách hàng" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.data.length === 0 && <EmptyState title="Không có khách khớp từ khoá." desc="Thử tìm bằng số điện thoại." />}
      {state.status === "ready" && state.data.data.length > 0 && (
        <>
          <DataTable head={<tr><th className={th}>Khách hàng</th><th className={`${th} text-right`}>Số đơn</th><th className={`${th} text-right`}>Đã mua</th><th className={th}>Đơn gần nhất</th><th className={th}>Nhận tin</th></tr>}>
            {state.data.data.map((customer) => (
              <tr key={customer.id} className="hover:bg-paper">
                <td className={td}>
                  <Link to={`/customers/${customer.id}`} className="font-medium hover:text-wood">{customer.name}</Link>
                  <span className="block text-[13px] text-ink-3">{customer.phone}</span>
                </td>
                <td className={tdMoney}>{customer._count.orders}</td>
                <td className={tdMoney}>{formatVnd(customer.spentVnd)}</td>
                <td className={`${td} whitespace-nowrap`}>{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}</td>
                <td className={td}>{customer.marketingConsent ? <Tag tone="ok">Đồng ý</Tag> : <Tag>Không</Tag>}</td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={query.page} totalPages={state.data.meta.totalPages} onPage={(page) => query.set({ page })} />
        </>
      )}
    </>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const { state, slow, reload } = useLoad(() => api.get<Customer>(`/customers/${id}`), [id]);
  if (state.status === "error") return <ErrorState title="Chưa tải được khách hàng" desc={state.error} onRetry={reload} />;
  if (state.status === "loading") return <Skeleton className={`h-64 ${slow ? "" : "invisible"}`} />;
  const customer = state.data;

  return (
    <>
      <PageHeader title={customer.name} back={{ to: "/customers", label: "Danh sách khách hàng" }} />
      <div className="grid gap-6 xl:grid-cols-12 [&>*]:min-w-0">
        <div className="xl:col-span-4">
          <Panel title="Liên hệ">
            <dl className="grid gap-y-3 text-sm">
              <div><dt className="text-ink-3">Điện thoại</dt><dd><a href={`tel:${customer.phone}`} className="hover:text-wood">{customer.phone}</a></dd></div>
              {customer.email && <div><dt className="text-ink-3">Email</dt><dd>{customer.email}</dd></div>}
              {customer.address && <div><dt className="text-ink-3">Địa chỉ gần nhất</dt><dd>{customer.address}</dd></div>}
              <div><dt className="text-ink-3">Nhận tin tiếp thị</dt><dd>{customer.marketingConsent ? "Đã đồng ý" : "Chưa đồng ý, không gửi tin"}</dd></div>
              <div><dt className="text-ink-3">Lần đầu đặt</dt><dd>{formatDate(customer.createdAt)}</dd></div>
            </dl>
          </Panel>
        </div>
        <div className="xl:col-span-8">
          <h2 className="mb-3 font-serif text-xl font-semibold">Đơn hàng ({customer.orders.length})</h2>
          <DataTable head={<tr><th className={th}>Mã đơn</th><th className={th}>Ngày đặt</th><th className={`${th} text-right`}>Tổng tiền</th><th className={th}>Trạng thái</th></tr>}>
            {customer.orders.map((order) => (
              <tr key={order.id} className="hover:bg-paper">
                <td className={td}><Link to={`/orders/${order.id}`} className="font-medium hover:text-wood">{order.code}</Link></td>
                <td className={`${td} whitespace-nowrap`}>{formatDateTime(order.createdAt)}</td>
                <td className={tdMoney}>{formatVnd(order.totalVnd)}</td>
                <td className={td}><Tag tone={orderStatus[order.status].tone}>{orderStatus[order.status].label}</Tag></td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>
    </>
  );
}
