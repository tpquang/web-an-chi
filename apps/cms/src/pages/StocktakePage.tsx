import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Field, NumberInput } from "../components/ui/Field";
import { DataTable, PageHeader, td, tdMoney, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatQty, loadMaterials } from "../lib/inventory";
import { materialGroup } from "../lib/labels";
import type { ProductRow } from "../lib/types";
import { useLoad } from "../lib/use-load";

// Kiểm kho: nhập số đếm thực tế, lưu thì ghi phần chênh vào sổ kho (cộng hoặc trừ) kèm lý do.
// Dùng cho hàng hoàn, đơn huỷ đã gửi đi, hao hụt, vật tư tiêu hao như hộp ship, dây đã dùng
const REASONS = ["Kiểm kho định kỳ", "Hàng hoàn về", "Đơn huỷ", "Hao hụt, hư hỏng", "Đã dùng vật tư (hộp ship, dây)", "Nhập bù"];

type Row = { kind: "materials" | "products"; id: string; name: string; group: string; unit: string; stock: number };

export function StocktakePage() {
  const { can } = useAuth();
  const editable = can("inventory", "edit");
  const data = useLoad(async () => {
    const [materials, products] = await Promise.all([loadMaterials(), api.list<ProductRow & { type: string }>("/products?limit=100")]);
    const rows: Row[] = [
      ...materials.map((m) => ({ kind: "materials" as const, id: m.id, name: m.name, group: materialGroup[m.group]?.label ?? m.group, unit: m.unit, stock: m.stock })),
      // Vòng xâu hạt không có tồn kho riêng, kiểm hạt là đủ
      ...products.data.filter((p) => p.type === "RETAIL").map((p) => ({ kind: "products" as const, id: p.id, name: p.name, group: "Thành phẩm", unit: "sp", stock: p.stock })),
    ];
    return rows;
  }, []);
  const [counted, setCounted] = useState<Record<string, number | null>>({});
  const [reason, setReason] = useState(REASONS[0]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);

  if (data.state.status === "error") return <ErrorState title="Chưa tải được kho" desc={data.state.error} onRetry={data.reload} />;
  const rows = data.state.status === "ready" ? data.state.data : [];
  const groups = [...new Set(rows.map((r) => r.group))];
  const shown = rows.filter((r) => !filter || r.group === filter);
  const key = (r: Row) => `${r.kind}:${r.id}`;
  const changes = rows.filter((r) => counted[key(r)] != null && counted[key(r)] !== r.stock);

  async function save() {
    if (saving || changes.length === 0) return;
    setSaving(true);
    let done = 0;
    try {
      for (const r of changes) {
        await api.post(`/${r.kind}/${r.id}/adjust`, { type: "ADJUST", quantity: (counted[key(r)] ?? r.stock) - r.stock, reason });
        done++;
      }
      showToast(`Đã cập nhật ${done} mặt hàng.`, { desc: "Phần chênh đã ghi vào sổ kho." });
      setCounted({});
      await data.reload();
    } catch (err) {
      showToast(`Đã lưu ${done}/${changes.length} mặt hàng`, { type: "error", desc: errorMessage(err) });
      await data.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Kiểm kho"
        desc="Đếm thực tế rồi nhập vào cột Số đếm. Chỉ dòng có số khác tồn kho mới được ghi. Cộng khi hàng hoàn về, trừ khi hao hụt hoặc đã dùng vật tư."
        actions={editable && <Button onClick={save} loading={saving} disabled={changes.length === 0}>Lưu {changes.length > 0 ? `${changes.length} thay đổi` : ""}</Button>}
      />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-48"><Select ariaLabel="Lọc nhóm" value={filter} onChange={setFilter} options={[{ value: "", label: "Mọi nhóm" }, ...groups.map((g) => ({ value: g, label: g }))]} /></div>
        <div className="w-72"><Field label="Lý do ghi sổ"><Select value={reason} onChange={setReason} options={REASONS.map((r) => ({ value: r, label: r }))} disabled={saving} /></Field></div>
      </div>
      {data.state.status === "loading" ? (
        <div className={data.slow ? "" : "invisible"}><TableSkeleton /></div>
      ) : (
        <DataTable head={<tr><th className={th}>Mặt hàng</th><th className={th}>Nhóm</th><th className={`${th} text-right`}>Tồn kho</th><th className={`${th} w-36`}>Số đếm</th><th className={`${th} text-right`}>Chênh</th></tr>}>
          {shown.map((r) => {
            const value = counted[key(r)] ?? null;
            const diff = value === null ? 0 : value - r.stock;
            return (
              <tr key={key(r)}>
                <td className={td}>{r.name}</td>
                <td className={td}><Tag>{r.group}</Tag></td>
                <td className={tdMoney}>{formatQty(r.stock, r.unit)}</td>
                <td className={td}>
                  <NumberInput aria-label={`Số đếm ${r.name}`} value={value} onChange={(v) => setCounted({ ...counted, [key(r)]: v == null ? null : Math.max(0, Math.round(v)) })} decimals={0} disabled={saving || !editable} />
                </td>
                <td className={`${tdMoney} ${diff > 0 ? "text-ok" : diff < 0 ? "text-err" : "text-ink-3"}`}>{diff === 0 ? "–" : `${diff > 0 ? "+" : ""}${formatQty(diff, r.unit)}`}</td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </>
  );
}
