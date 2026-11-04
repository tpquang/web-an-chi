import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AdjustModal } from "../components/business/AdjustModal";
import { PlusIcon } from "../components/icons";
import { Button } from "../components/ui/Button";
import { Field, Input, NumberInput, Textarea } from "../components/ui/Field";
import { confirmDialog, Modal } from "../components/ui/Modal";
import { DataTable, PageHeader, td, tdMoney, th } from "../components/ui/Page";
import { EmptyState, ErrorState, TableSkeleton } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { formatVnd } from "../lib/format";
import { formatQty, loadMaterials, type MaterialRow } from "../lib/inventory";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Values = { name: string; unit: string; unitsPerKg: number | null; note: string };

export function MaterialsPage() {
  const { state, slow, reload } = useLoad(loadMaterials, []);
  const [editing, setEditing] = useState<{ id: string | null; values: Values } | null>(null);
  const [adjusting, setAdjusting] = useState<MaterialRow | null>(null);
  const { submitting, errors, setErrors, run } = useSubmit();
  const total = state.status === "ready" ? state.data.reduce((s, m) => s + m.stock * m.avgCostVnd, 0) : 0;

  function open(m?: MaterialRow) {
    setErrors({});
    setEditing({ id: m?.id ?? null, values: m ? { name: m.name, unit: m.unit, unitsPerKg: m.unitsPerKg, note: m.note ?? "" } : { name: "", unit: "viên", unitsPerKg: null, note: "" } });
  }
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setEditing((prev) => prev && { ...prev, values: { ...prev.values, [key]: value } });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    run(async () => {
      if (editing.id) await api.put(`/materials/${editing.id}`, editing.values);
      else await api.post("/materials", editing.values);
      showToast(editing.id ? "Đã lưu nguyên liệu." : "Đã thêm nguyên liệu.");
      setEditing(null);
      reload();
    }, "Chưa lưu được nguyên liệu");
  }

  async function handleDelete(m: MaterialRow) {
    if (!(await confirmDialog({ title: "Xoá nguyên liệu", desc: `Xoá "${m.name}"?`, confirmLabel: "Xoá nguyên liệu", danger: true }))) return;
    try {
      await api.delete(`/materials/${m.id}`);
      showToast("Đã xoá nguyên liệu.");
      reload();
    } catch (err) {
      showToast("Chưa xoá được", { type: "error", desc: errorMessage(err) });
    }
  }

  const v = editing?.values;
  return (
    <>
      <PageHeader
        title="Nguyên liệu thô"
        desc={<>Hàng nhập về để tự đóng gói: nụ, hộp, túi, thiệp. Tồn kho tăng khi nhập kho một <Link to="/business" className="text-wood underline-offset-4 hover:underline">đợt nhập</Link>, giảm khi <Link to="/packing" className="text-wood underline-offset-4 hover:underline">đóng gói</Link> hoặc ghi hao hụt.</>}
        actions={<Button onClick={() => open()}><PlusIcon size={18} /> Thêm nguyên liệu</Button>}
      />
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton rows={4} /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được nguyên liệu" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.length === 0 && (
        <EmptyState title="Chưa có nguyên liệu nào." desc="Thêm nụ trầm thô, hộp, thiệp... rồi khai báo công thức đóng gói ở trang sản phẩm." action={<Button onClick={() => open()}>Thêm nguyên liệu</Button>} />
      )}
      {state.status === "ready" && state.data.length > 0 && (
        <>
          <p className="mb-3 text-sm text-ink-2">Giá trị tồn kho nguyên liệu: <b className="tabular-nums">{formatVnd(total)}</b></p>
          <DataTable head={<tr><th className={th}>Nguyên liệu</th><th className={`${th} text-right`}>Tồn kho</th><th className={`${th} text-right`}>Giá vốn bình quân</th><th className={`${th} text-right`}>Giá trị tồn</th><th className={th}><span className="sr-only">Thao tác</span></th></tr>}>
            {state.data.map((m) => (
              <tr key={m.id}>
                <td className={td}>
                  <button type="button" onClick={() => open(m)} className="min-h-11 text-left font-medium hover:text-wood">{m.name}</button>
                  <span className="block text-[13px] text-ink-3">{m.unitsPerKg ? `${m.unitsPerKg} ${m.unit} mỗi kg · ` : ""}dùng trong {m._count.components} công thức</span>
                </td>
                <td className={`${tdMoney} ${m.stock === 0 ? "text-ink-3" : ""}`}>{formatQty(m.stock, m.unit)}</td>
                <td className={tdMoney}>{formatVnd(m.avgCostVnd)}</td>
                <td className={tdMoney}>{formatVnd(m.stock * m.avgCostVnd)}</td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  <Button variant="text" size="sm" onClick={() => setAdjusting(m)}>Hao hụt, kiểm kê</Button>
                  <Button variant="text" size="sm" className="ml-4 text-err" onClick={() => handleDelete(m)}>Xoá</Button>
                </td>
              </tr>
            ))}
          </DataTable>
        </>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        locked={submitting}
        title={editing?.id ? "Sửa nguyên liệu" : "Thêm nguyên liệu"}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)} disabled={submitting}>Huỷ</Button><Button type="submit" form="material-form" loading={submitting}>Lưu</Button></>}
      >
        {v && (
          <form id="material-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Field label="Tên nguyên liệu" error={errors.name}><Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: Nụ trầm thô" disabled={submitting} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Đơn vị gốc" hint="Tồn kho và công thức tính theo đơn vị này." error={errors.unit}><Input value={v.unit} onChange={(e) => set("unit", e.target.value)} placeholder="VD: viên, cái" disabled={submitting} /></Field>
              <Field label="Số đơn vị mỗi kg" optional hint="Điền nếu nhập theo kg, ví dụ 800 viên."><NumberInput value={v.unitsPerKg} onChange={(x) => set("unitsPerKg", x == null ? null : Math.round(x))} decimals={0} disabled={submitting} /></Field>
            </div>
            <Field label="Ghi chú" optional><Textarea value={v.note} onChange={(e) => set("note", e.target.value)} disabled={submitting} /></Field>
          </form>
        )}
      </Modal>
      <AdjustModal
        target={adjusting && { kind: "materials", id: adjusting.id, name: adjusting.name, unit: adjusting.unit, stock: adjusting.stock }}
        onClose={() => setAdjusting(null)}
        onDone={reload}
      />
    </>
  );
}
