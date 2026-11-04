import type { BatchResult, PlanInput, Recipe } from "../../lib/batch";
import { formatVnd } from "../../lib/format";
import { formatQty } from "../../lib/inventory";
import { Button } from "../ui/Button";
import { Checkbox, NumberInput } from "../ui/Field";
import { DataTable, td, tdMoney, th } from "../ui/Page";

type Props = {
  recipes: Recipe[];
  plans: PlanInput[];
  result: BatchResult;
  includeStock: boolean;
  disabled?: boolean;
  onChange: (plans: PlanInput[]) => void;
  onIncludeStock: (value: boolean) => void;
  onFillMax: () => void;
};

// Quy đổi: đợt nhập này ra được bao nhiêu thành phẩm, dùng hết nguyên liệu nào, còn dư bao nhiêu
export function BatchPlan({ recipes, plans, result, includeStock, disabled, onChange, onIncludeStock, onFillMax }: Props) {
  const qtyOf = (id: string) => plans.find((p) => p.productId === id)?.quantity ?? 0;
  const setQty = (id: string, quantity: number) =>
    onChange(plans.some((p) => p.productId === id) ? plans.map((p) => (p.productId === id ? { ...p, quantity } : p)) : [...plans, { productId: id, quantity }]);
  // Giữ thứ tự ưu tiên theo plans; sản phẩm chưa có trong plans xếp sau
  const ordered = [...recipes].sort((a, b) => {
    const ia = plans.findIndex((p) => p.productId === a.id), ib = plans.findIndex((p) => p.productId === b.id);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });

  if (recipes.length === 0) {
    return <p className="text-sm text-ink-2">Chưa có sản phẩm nào khai báo cấu thành. Mở sản phẩm, thêm cấu thành (VD 50 nụ + 1 hộp) để quy đổi.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Checkbox label="Tính cả nguyên liệu đang có trong kho" checked={includeStock} onChange={(e) => onIncludeStock(e.target.checked)} disabled={disabled} />
        <Button variant="outline" size="sm" onClick={onFillMax} disabled={disabled}>Điền số tối đa</Button>
      </div>
      {result.plans.some((p) => p.quantity > p.max) && (
        <p role="alert" className="rounded-md bg-err-soft p-3 text-sm text-err">
          Số dự kiến đóng vượt số nguyên liệu có. Giảm số lượng, nhập thêm nguyên liệu còn thiếu, hoặc bật "Tính cả nguyên liệu đang có trong kho". Lợi nhuận bên cạnh đang tính theo số chưa đủ hàng.
        </p>
      )}
      <DataTable head={<tr><th className={th}>Thành phẩm</th><th className={`${th} text-right`}>Tối đa</th><th className={`${th} text-right`}>Dự kiến đóng</th><th className={`${th} text-right`}>Giá vốn</th><th className={`${th} text-right`}>Lãi mỗi cái</th><th className={`${th} text-right`}>Lãi</th></tr>}>
        {ordered.map((r) => {
          const p = result.plans.find((x) => x.productId === r.id);
          return (
            <tr key={r.id}>
              <td className={td}>
                <span className="font-medium">{r.name}</span>
                <span className="block text-[13px] text-ink-3">{r.components.map((c) => `${c.quantity} ${c.material.unit} ${c.material.name}`).join(" + ")} · bán {formatVnd(r.priceVnd)}</span>
              </td>
              <td className={tdMoney}>{p?.max ?? "–"}</td>
              <td className="w-32 p-2"><NumberInput aria-label={`Dự kiến đóng ${r.name}`} aria-invalid={p ? p.quantity > p.max : undefined} value={qtyOf(r.id)} onChange={(v) => setQty(r.id, Math.max(0, Math.round(v ?? 0)))} decimals={0} disabled={disabled} /></td>
              <td className={tdMoney}>{p ? formatVnd(p.unitCostVnd) : "–"}</td>
              <td className={`${tdMoney} ${p && p.profitPerUnitVnd < 0 ? "text-err" : "text-ok"}`}>{p ? formatVnd(p.profitPerUnitVnd) : "–"}</td>
              <td className={tdMoney}>{p ? formatVnd(p.profitVnd) : "–"}</td>
            </tr>
          );
        })}
      </DataTable>
      <p className="text-[13px] text-ink-3">"Tối đa" tính theo nguyên liệu còn lại sau các dòng phía trên. "Điền số tối đa" ưu tiên theo thứ tự đã có số. Lãi đã trừ phí bán.</p>

      {result.usage.length > 0 && (
        <DataTable head={<tr><th className={th}>Nguyên liệu</th><th className={`${th} text-right`}>Có</th><th className={`${th} text-right`}>Dùng</th><th className={`${th} text-right`}>Còn dư</th></tr>}>
          {result.usage.map((u) => (
            <tr key={u.materialId}>
              <td className={td}>{u.name}{u.fromStock && <span className="block text-[13px] text-ink-3">Lấy từ kho, không có trong đợt</span>}</td>
              <td className={tdMoney}>{formatQty(u.available, u.unit)}</td>
              <td className={tdMoney}>{formatQty(u.used, u.unit)}</td>
              <td className={`${tdMoney} ${u.left < 0 ? "text-err" : ""}`}>{formatQty(u.left, u.unit)}</td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
