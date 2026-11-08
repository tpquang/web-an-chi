import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AdjustModal } from "../components/business/AdjustModal";
import { ModelModal } from "../components/business/ModelModal";
import { PlusIcon } from "../components/icons";
import { Button } from "../components/ui/Button";
import { Field, Input, NumberInput, Textarea } from "../components/ui/Field";
import { confirmDialog, Modal } from "../components/ui/Modal";
import { DataTable, PageHeader, td, tdMoney, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { EmptyState, ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { formatVnd } from "../lib/format";
import type { MaterialKind } from "../lib/batch";
import { materialGroup, type MaterialGroup } from "../lib/labels";
import { formatQty, loadMaterials, materialKinds, type MaterialRow } from "../lib/inventory";
import { loadTextureRows, textureUrl, UploadModal, type TextureRow } from "./BeadTexturesPage";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Values = { name: string; group: MaterialGroup; markupPct: number | null; kind: MaterialKind; unit: string; unitsPerKg: number | null; beadMaterial: string | null; note: string };

const kindLabel = (kind: MaterialKind) => materialKinds.find((k) => k.value === kind)?.label ?? kind;

export function MaterialsPage() {
  const { state, slow, reload } = useLoad(loadMaterials, []);
  const [editing, setEditing] = useState<{ id: string | null; values: Values } | null>(null);
  const [adjusting, setAdjusting] = useState<MaterialRow | null>(null);
  const [modeling, setModeling] = useState<MaterialRow | null>(null);
  const [texturing, setTexturing] = useState<TextureRow | null>(null);
  // Loại trầm lấy từ kho hạt của trang thiết kế vòng, kèm ảnh vân đang có
  const textures = useLoad(loadTextureRows, []);
  const textureRows = textures.state.status === "ready" ? textures.state.data.filter((t) => t.finish !== "metal") : [];
  const { submitting, errors, setErrors, run } = useSubmit();
  const total = state.status === "ready" ? state.data.reduce((s, m) => s + m.stock * m.avgCostVnd, 0) : 0;

  function open(m?: MaterialRow) {
    setErrors({});
    setEditing({
      id: m?.id ?? null,
      values: m
        ? { name: m.name, group: m.group, markupPct: m.markupPct, kind: m.kind, unit: m.unit, unitsPerKg: m.unitsPerKg, beadMaterial: m.beadMaterial, note: m.note ?? "" }
        : { name: "", group: "PACKAGING", markupPct: null, kind: "GENERAL", unit: "cái", unitsPerKg: null, beadMaterial: null, note: "" },
    });
  }

  // Đổi loại thì đổi luôn đơn vị mặc định; hạt trầm và charm nhập theo số lượng nên bỏ quy đổi kg
  function setKind(kind: MaterialKind) {
    setEditing((prev) => {
      if (!prev) return prev;
      const defaults = materialKinds.map((k) => k.unit as string);
      const unit = !prev.values.unit || defaults.includes(prev.values.unit) ? materialKinds.find((k) => k.value === kind)!.unit : prev.values.unit;
      return { ...prev, values: { ...prev.values, kind, unit, unitsPerKg: kind === "GENERAL" ? prev.values.unitsPerKg : null } };
    });
  }

  // Hộp ảnh vân dùng chung với trang Vân vật liệu hạt, loại trầm mới chưa có hạt thì dựng dòng tạm
  function openTexture(m: MaterialRow) {
    if (!m.beadMaterial) return;
    setTexturing(textureRows.find((t) => t.material === m.beadMaterial) ?? { material: m.beadMaterial, finish: "wood", beads: 0, minMm: 8, maxMm: 8, texture: m.texture });
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
        desc={<>Hàng nhập về: hạt trầm, charm để xâu vòng, nụ, hộp, túi, thiệp để đóng gói. Tồn kho tăng khi nhập kho một <Link to="/business" className="text-wood underline-offset-4 hover:underline">đợt nhập</Link>, giảm khi <Link to="/packing" className="text-wood underline-offset-4 hover:underline">đóng gói</Link> hoặc ghi hao hụt.</>}
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
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
                    <Tag tone={materialGroup[m.group].tone}>{materialGroup[m.group].label}</Tag>
                    {m.kind !== "GENERAL" && <Tag tone="wood">{kindLabel(m.kind)}</Tag>}
                    {m.markupPct !== null && <span>lãi {m.markupPct}%</span>}
                    {m.kind === "BEAD" && <span>{m.beadMaterial}</span>}
                    {m.unitsPerKg ? `${m.unitsPerKg} ${m.unit} mỗi kg · ` : ""}dùng trong {m._count.components} công thức
                  </span>
                </td>
                <td className={`${tdMoney} ${m.stock === 0 ? "text-ink-3" : ""}`}>{formatQty(m.stock, m.unit)}</td>
                <td className={tdMoney}>{formatVnd(m.avgCostVnd)}</td>
                <td className={tdMoney}>{formatVnd(m.stock * m.avgCostVnd)}</td>
                <td className={`${td} text-right whitespace-nowrap`}>
                  {m.kind === "BEAD" && (
                    <Button variant="secondary" size="sm" className="mr-4" onClick={() => openTexture(m)}>
                      {m.texture && <img src={textureUrl(m.texture)} alt="" width={20} height={20} className="size-5 rounded-full object-cover" />}
                      {m.texture ? "Ảnh vân" : "Tải ảnh vân"}
                    </Button>
                  )}
                  {m.kind === "CHARM" && (
                    <Button variant="secondary" size="sm" className="mr-4" onClick={() => setModeling(m)}>
                      {m.model ? "File 3D" : "Tải file 3D"}
                    </Button>
                  )}
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
            <div role="group" aria-labelledby="loai-nguyen-lieu" className="flex flex-col gap-2">
              <span id="loai-nguyen-lieu" className="text-sm font-medium">Loại</span>
              <div className="flex gap-1 rounded-lg bg-paper-2 p-1">
                {materialKinds.map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    aria-pressed={v.kind === k.value}
                    onClick={() => setKind(k.value)}
                    disabled={submitting}
                    className="min-h-11 flex-1 rounded-md px-2 text-sm font-medium text-ink-2 transition-colors duration-(--d-fast) hover:text-ink aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:shadow-e1"
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Tên nguyên liệu" error={errors.name}>
              <Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder={v.kind === "BEAD" ? "VD: Hạt trầm tốc 8mm" : v.kind === "CHARM" ? "VD: Hoa sen bạc 925" : "VD: Nụ trầm thô"} disabled={submitting} />
            </Field>
            {v.kind === "BEAD" && (
              <Field label="Loại trầm" hint="Hạt cùng loại trầm dùng chung một ảnh vân, cỡ nào cũng vậy." error={errors.beadMaterial}>
                <Select
                  value={v.beadMaterial}
                  onChange={(x) => set("beadMaterial", x)}
                  options={textureRows.map((t) => ({ value: t.material, label: t.texture ? `${t.material} · có ảnh vân` : t.material }))}
                  placeholder={textures.state.status === "loading" ? "Đang tải…" : "Chọn loại trầm"}
                  disabled={submitting}
                  aria-invalid={Boolean(errors.beadMaterial)}
                />
              </Field>
            )}
            {v.kind === "BEAD" && v.beadMaterial && (() => {
              // Ảnh vân dùng chung theo loại trầm: loại đã có ảnh thì hạt mới tự dùng ảnh đó, không cần tải lại
              const shared = textureRows.find((t) => t.material === v.beadMaterial)?.texture;
              return shared ? (
                <p className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-sm" role="status">
                  <img src={textureUrl(shared)} alt="" width={28} height={28} className="size-7 rounded-full object-cover" />
                  Loại {v.beadMaterial} đã có ảnh vân, hạt này dùng chung luôn, không cần tải lại.
                </p>
              ) : (
                <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm" role="status">Loại {v.beadMaterial} chưa có ảnh vân. Sau khi lưu, bấm Tải ảnh vân trong danh sách.</p>
              );
            })()}
            {v.kind === "GENERAL" && (
              <Field label="Nhóm hàng" hint="Để chia nhóm khi nhập hàng.">
                <Select value={v.group} onChange={(x) => set("group", x as MaterialGroup)} options={(Object.keys(materialGroup) as MaterialGroup[]).filter((g) => g !== "BEAD").map((g) => ({ value: g, label: materialGroup[g].label }))} disabled={submitting} />
              </Field>
            )}
            {v.kind !== "GENERAL" && (
              <Field label="Lãi trên giá vốn (%)" optional hint="Có thì giá bán tự cập nhật mỗi lần nhập kho, ví dụ 50. Để trống thì giá sửa tay ở trang hạt.">
                <NumberInput value={v.markupPct} onChange={(x) => set("markupPct", x ?? null)} decimals={0} disabled={submitting} />
              </Field>
            )}
            {v.kind === "CHARM" && <p className="text-sm text-ink-3">Sau khi lưu, bấm Tải file 3D trong danh sách để gắn mô hình .glb cho charm.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Đơn vị gốc" hint={v.kind === "GENERAL" ? "Tồn kho và công thức tính theo đơn vị này." : "Nhập kho theo số lượng, không quy đổi kg."} error={errors.unit}>
                <Input value={v.unit} onChange={(e) => set("unit", e.target.value)} placeholder="VD: viên, cái" disabled={submitting} />
              </Field>
              {v.kind === "GENERAL" && (
                <Field label="Số đơn vị mỗi kg" optional hint="Điền nếu nhập theo kg, ví dụ 800 viên.">
                  <NumberInput value={v.unitsPerKg} onChange={(x) => set("unitsPerKg", x == null ? null : Math.round(x))} decimals={0} disabled={submitting} />
                </Field>
              )}
            </div>
            <Field label="Ghi chú" optional><Textarea value={v.note} onChange={(e) => set("note", e.target.value)} disabled={submitting} /></Field>
          </form>
        )}
      </Modal>
      {modeling && <ModelModal row={modeling} onClose={() => setModeling(null)} onSaved={() => (setModeling(null), reload())} />}
      {texturing && <UploadModal row={texturing} onClose={() => setTexturing(null)} onSaved={() => (setTexturing(null), reload(), textures.reload())} />}
      <AdjustModal
        target={adjusting && { kind: "materials", id: adjusting.id, name: adjusting.name, unit: adjusting.unit, stock: adjusting.stock }}
        onClose={() => setAdjusting(null)}
        onDone={reload}
      />
    </>
  );
}
