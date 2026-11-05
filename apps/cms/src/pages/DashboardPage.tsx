import { Link } from "react-router-dom";
import { PageHeader, Panel } from "../components/ui/Page";
import { ErrorState, Skeleton, Tag } from "../components/ui/States";
import { api } from "../lib/api";
import { formatDateTime, formatVnd } from "../lib/format";
import { orderStatus, type OrderStatus } from "../lib/labels";
import { useLoad } from "../lib/use-load";

type Dashboard = {
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  revenue30dVnd: number;
  completed30d: number;
  customers: number;
  lowStock: { id: string; name: string; stock: number }[];
  recentOrders: { id: string; code: string; customerName: string; totalVnd: number; status: OrderStatus; createdAt: string }[];
};

function Stat({ label, value, to }: { label: string; value: string; to?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 font-serif text-[28px] leading-tight font-semibold lining-nums tabular-nums">{value}</p>
    </>
  );
  const cls = "block rounded-3xl border border-edge bg-surface p-5";
  return to ? (
    <Link to={to} className={`${cls} hover:border-wood`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function DashboardPage() {
  const { state, slow, reload } = useLoad(() => api.get<Dashboard>("/dashboard"), []);

  return (
    <>
      <PageHeader title="Tổng quan" />
      {state.status === "error" && <ErrorState title="Chưa tải được số liệu" desc={state.error} onRetry={reload} />}
      {state.status === "loading" && (
        <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ${slow ? "" : "invisible"}`}>
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-24" />
          ))}
        </div>
      )}
      {state.status === "ready" && (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Đơn chờ xác nhận" value={String(state.data.ordersByStatus.PENDING ?? 0)} to="/orders?status=PENDING" />
            <Stat label="Đơn đang giao" value={String(state.data.ordersByStatus.SHIPPING ?? 0)} to="/orders?status=SHIPPING" />
            <Stat label="Doanh thu đơn hoàn tất 30 ngày" value={formatVnd(state.data.revenue30dVnd)} />
            <Stat label="Khách hàng" value={String(state.data.customers)} to="/customers" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Đơn mới">
              <ul className="divide-y divide-line">
                {state.data.recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link to={`/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-wood">
                      <span>
                        <span className="font-medium">{order.code}</span> · {order.customerName}
                        <span className="block text-[13px] text-ink-3">{formatDateTime(order.createdAt)}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="tabular-nums">{formatVnd(order.totalVnd)}</span>
                        <Tag tone={orderStatus[order.status].tone}>{orderStatus[order.status].label}</Tag>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Sắp hết hàng">
              {state.data.lowStock.length === 0 ? (
                <p className="text-ink-2">Không có sản phẩm nào còn từ 3 trở xuống.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {state.data.lowStock.map((product) => (
                    <li key={product.id}>
                      <Link to={`/products/${product.id}`} className="flex items-center justify-between gap-2 py-3 hover:text-wood">
                        <span>{product.name}</span>
                        <Tag tone={product.stock === 0 ? "err" : "warn"}>{product.stock === 0 ? "Hết hàng" : `Còn ${product.stock}`}</Tag>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
