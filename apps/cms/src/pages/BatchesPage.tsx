import { Link } from "react-router-dom";
import { PlusIcon } from "../components/icons";
import { ButtonLink } from "../components/ui/Button";
import { DataTable, PageHeader, td, tdMoney, th } from "../components/ui/Page";
import { EmptyState, ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { api } from "../lib/api";
import { calcBatch, type BatchInput } from "../lib/batch";
import { loadMaterials, loadRecipes } from "../lib/inventory";
import { formatDate, formatVnd } from "../lib/format";
import { batchStatus } from "../lib/labels";
import { useLoad } from "../lib/use-load";

type Batch = BatchInput & { id: string; createdAt: string };

export function BatchesPage() {
  const { state, slow, reload } = useLoad(() => api.get<Batch[]>("/batches"), []);
  const materials = useLoad(loadMaterials, []);
  const recipes = useLoad(loadRecipes, []);
  const mats = materials.state.status === "ready" ? materials.state.data : [];
  const recs = recipes.state.status === "ready" ? recipes.state.data : [];
  const rows = state.status === "ready" ? state.data.map((b) => ({ batch: b, result: calcBatch(b, mats, recs, false) })) : [];
  const total = rows.reduce(
    (sum, { result }) => ({ capital: sum.capital + result.capitalNeededVnd, revenue: sum.revenue + result.revenueVnd, profit: sum.profit + result.profitVnd }),
    { capital: 0, revenue: 0, profit: 0 },
  );

  return (
    <>
      <PageHeader
        title="Đợt nhập hàng"
        desc="Nhập nguyên liệu thô, trừ hao hụt, quy đổi ra thành phẩm và tính lợi nhuận nếu bán hết. Chi phí vận hành ban đầu không tính ở đây."
        actions={<ButtonLink to="/business/new"><PlusIcon size={18} /> Thêm đợt nhập</ButtonLink>}
      />
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton rows={3} /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được đợt nhập" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && rows.length === 0 && (
        <EmptyState title="Chưa có đợt nhập nào." desc="Thêm đợt đầu tiên để tính số hộp, vốn cần và lợi nhuận." action={<ButtonLink to="/business/new">Thêm đợt nhập</ButtonLink>} />
      )}
      {rows.length > 0 && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[["Tổng vốn các đợt", total.capital], ["Doanh thu thành phẩm dự kiến", total.revenue], ["Lợi nhuận dự kiến", total.profit]].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-edge bg-surface p-5">
                <p className="text-sm text-ink-2">{label}</p>
                <p className={`mt-1 font-serif text-2xl font-semibold lining-nums tabular-nums ${label === "Lợi nhuận dự kiến" && (value as number) < 0 ? "text-err" : ""}`}>{formatVnd(value as number)}</p>
              </div>
            ))}
          </div>
          <DataTable head={<tr><th className={th}>Đợt</th><th className={th}>Trạng thái</th><th className={`${th} text-right`}>Vốn cần</th><th className={`${th} text-right`}>Doanh thu</th><th className={`${th} text-right`}>Lợi nhuận</th><th className={`${th} text-right`}>Biên</th></tr>}>
            {rows.map(({ batch, result }) => (
              <tr key={batch.id} className="hover:bg-paper">
                <td className={td}>
                  <Link to={`/business/${batch.id}`} className="font-medium hover:text-wood">{batch.name}</Link>
                  <span className="block text-[13px] text-ink-3">{[batch.supplier, batch.orderedAt ? formatDate(batch.orderedAt) : null, `${batch.lines.length} nguyên liệu`].filter(Boolean).join(" · ")}</span>
                </td>
                <td className={td}><Tag tone={batchStatus[batch.status].tone}>{batchStatus[batch.status].label}</Tag></td>
                <td className={tdMoney}>{formatVnd(result.capitalNeededVnd)}</td>
                <td className={tdMoney}>{formatVnd(result.revenueVnd)}</td>
                <td className={`${tdMoney} ${result.profitVnd < 0 ? "text-err" : "text-ok"}`}>{formatVnd(result.profitVnd)}</td>
                <td className={tdMoney}>{result.marginPct.toFixed(1).replace(".", ",")}%</td>
              </tr>
            ))}
          </DataTable>
        </>
      )}
    </>
  );
}
