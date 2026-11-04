import { Link } from "react-router-dom";
import { DataTable, PageHeader, Pagination, td, tdMoney, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { EmptyState, ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { api } from "../lib/api";
import { formatDateTime, formatVnd } from "../lib/format";
import { movementType } from "../lib/inventory";
import { options } from "../lib/labels";
import { useLoad } from "../lib/use-load";
import { useQueryState } from "../lib/use-query-state";

type Movement = {
  id: string;
  type: keyof typeof movementType;
  quantity: number;
  unitCostVnd: number;
  note: string | null;
  createdAt: string;
  material: { name: string; unit: string } | null;
  product: { name: string } | null;
  batch: { id: string; name: string } | null;
};

// Sổ kho: mọi lần tăng, giảm nguyên liệu và thành phẩm, mới nhất trước
export function MovementsPage() {
  const query = useQueryState(["type"] as const);
  const { state, slow, reload } = useLoad(() => api.list<Movement>(`/movements?${query.toQuery({ limit: 30 })}`), [query.toQuery()]);

  return (
    <>
      <PageHeader title="Sổ kho" desc="Ghi lại mọi lần nhập, hao hụt, đóng gói và điều chỉnh. Số dương là tăng, số âm là giảm." />
      <div className="mb-4 sm:w-60">
        <Select ariaLabel="Lọc theo loại" value={query.values.type} onChange={(type) => query.set({ type })} options={[{ value: "", label: "Mọi loại" }, ...options(movementType)]} />
      </div>
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được sổ kho" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.data.length === 0 && <EmptyState title="Sổ kho chưa có dòng nào." desc="Nhập kho một đợt nhập hàng để bắt đầu." />}
      {state.status === "ready" && state.data.data.length > 0 && (
        <>
          <DataTable head={<tr><th className={th}>Thời gian</th><th className={th}>Loại</th><th className={th}>Hàng</th><th className={`${th} text-right`}>Số lượng</th><th className={`${th} text-right`}>Đơn giá vốn</th><th className={th}>Ghi chú</th></tr>}>
            {state.data.data.map((m) => (
              <tr key={m.id}>
                <td className={`${td} whitespace-nowrap`}>{formatDateTime(m.createdAt)}</td>
                <td className={td}><Tag tone={movementType[m.type].tone}>{movementType[m.type].label}</Tag></td>
                <td className={td}>{m.material?.name ?? m.product?.name ?? "Đã xoá"}{m.product && <span className="block text-[13px] text-ink-3">Thành phẩm</span>}</td>
                <td className={`${tdMoney} ${m.quantity < 0 ? "text-err" : "text-ok"}`}>{m.quantity > 0 ? "+" : ""}{m.quantity.toLocaleString("vi-VN")} {m.material?.unit ?? ""}</td>
                <td className={tdMoney}>{formatVnd(m.unitCostVnd)}</td>
                <td className={td}>{m.batch ? <Link to={`/business/${m.batch.id}`} className="hover:text-wood">{m.note}</Link> : m.note}</td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={query.page} totalPages={state.data.meta.totalPages} onPage={(page) => query.set({ page })} />
        </>
      )}
    </>
  );
}
