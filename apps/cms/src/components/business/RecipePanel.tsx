import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { formatVnd } from "../../lib/format";
import { formatQty, loadMaterials } from "../../lib/inventory";
import { useLoad } from "../../lib/use-load";
import { useSubmit } from "../../lib/use-submit";
import { PlusIcon, TrashIcon } from "../icons";
import { Button, IconButton } from "../ui/Button";
import { NumberInput } from "../ui/Field";
import { Panel } from "../ui/Page";
import { Select } from "../ui/Select";
import { Skeleton } from "../ui/States";
import { showToast } from "../ui/Toast";

type Row = { materialId: string; quantity: number | null };

// Sản phẩm nhóm: một sản phẩm bán gồm bao nhiêu đơn vị của từng nguyên liệu thô. Lưu riêng với form sản phẩm
export function RecipePanel({ productId, priceVnd }: { productId: string; priceVnd: number }) {
  const materials = useLoad(loadMaterials, []);
  const saved = useLoad(() => api.get<Row[]>(`/products/${productId}/components`), [productId]);
  const [rows, setRows] = useState<Row[]>([]);
  const { submitting, run } = useSubmit();

  useEffect(() => {
    if (saved.state.status === "ready") setRows(saved.state.data.map((c) => ({ materialId: c.materialId, quantity: c.quantity })));
  }, [saved.state]);

  if (materials.state.status !== "ready" || saved.state.status !== "ready") {
    return <Panel title="Cấu thành sản phẩm"><Skeleton className="h-24" /></Panel>;
  }
  const list = materials.state.data;
  const byId = new Map(list.map((m) => [m.id, m]));
  const valid = rows.filter((r) => r.materialId && r.quantity);
  const cost = valid.reduce((s, r) => s + (r.quantity ?? 0) * (byId.get(r.materialId)?.avgCostVnd ?? 0), 0);
  const canPack = valid.length ? Math.min(...valid.map((r) => Math.floor((byId.get(r.materialId)?.stock ?? 0) / (r.quantity || 1)))) : 0;
  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  function save() {
    run(async () => {
      await api.put(`/products/${productId}/components`, { components: valid });
      showToast("Đã lưu cấu thành sản phẩm.");
      saved.reload();
    }, "Chưa lưu được cấu thành");
  }

  return (
    <Panel title="Cấu thành sản phẩm">
      <p className="mb-3 text-sm text-ink-2">
        Một sản phẩm bán gồm những nguyên liệu thô nào, mỗi thứ bao nhiêu. VD: 50 viên nụ, 1 hộp, 1 thiệp. Dùng khi <Link to="/packing" className="text-wood underline-offset-4 hover:underline">đóng gói</Link> và quy đổi đợt nhập.
      </p>
      {list.length === 0 ? (
        <p className="text-sm">Chưa có nguyên liệu. <Link to="/materials" className="font-medium text-wood underline-offset-4 hover:underline">Thêm nguyên liệu thô</Link> trước.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => {
            const m = byId.get(row.materialId);
            return (
              <div key={i} role="group" aria-label={`Thành phần ${i + 1}`} className="grid gap-2 sm:grid-cols-[1fr_160px_44px]">
                <Select
                  ariaLabel={`Nguyên liệu ${i + 1}`}
                  value={row.materialId || null}
                  placeholder="Chọn nguyên liệu"
                  options={list.map((x) => ({ value: x.id, label: x.name, disabled: x.id !== row.materialId && rows.some((r) => r.materialId === x.id) }))}
                  onChange={(v) => set(i, { materialId: v })}
                  searchable
                  disabled={submitting}
                />
                <NumberInput aria-label={`Số lượng ${i + 1}`} value={row.quantity} onChange={(v) => set(i, { quantity: v == null ? null : Math.round(v) })} decimals={0} suffix={m?.unit.slice(0, 4)} disabled={submitting} />
                <IconButton label={`Bỏ thành phần ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} disabled={submitting}><TrashIcon size={18} /></IconButton>
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRows([...rows, { materialId: "", quantity: 1 }])} disabled={submitting}><PlusIcon size={16} /> Thêm thành phần</Button>
            <Button size="sm" onClick={save} loading={submitting}>Lưu cấu thành</Button>
          </div>
          {valid.length > 0 && (
            <dl className="mt-2 grid gap-2 rounded-xl bg-paper-2 p-3 text-sm sm:grid-cols-3">
              <div><dt className="text-ink-3">Giá vốn theo kho</dt><dd className="font-medium tabular-nums">{formatVnd(cost)}</dd></div>
              <div><dt className="text-ink-3">Lãi gộp mỗi sản phẩm</dt><dd className={`font-medium tabular-nums ${priceVnd - cost < 0 ? "text-err" : "text-ok"}`}>{formatVnd(priceVnd - cost)}</dd></div>
              <div><dt className="text-ink-3">Đóng được từ kho</dt><dd className="font-medium tabular-nums">{formatQty(canPack, "sản phẩm")}</dd></div>
            </dl>
          )}
        </div>
      )}
    </Panel>
  );
}
