import type { LineInput, Material, MaterialCost, WriteOffInput } from "../../lib/batch";
import { formatVnd } from "../../lib/format";
import { formatQty, writeOffReasons } from "../../lib/inventory";
import { PlusIcon, TrashIcon } from "../icons";
import { Button, IconButton } from "../ui/Button";
import { Field, Input, MoneyInput, NumberInput } from "../ui/Field";
import { Select } from "../ui/Select";

type Common = { materials: Material[]; errors: Record<string, string>; disabled?: boolean };

const materialOptions = (materials: Material[]) => materials.map((m) => ({ value: m.id, label: `${m.name} (${m.unit})` }));

// Dòng nguyên liệu nhập. Nguyên liệu có quy đổi kg thì nhập kg và giá mỗi kg, số đơn vị và thành tiền tự tính
export function BatchLines({ lines, costs, onChange, materials, errors, disabled }: Common & { lines: LineInput[]; costs: MaterialCost[]; onChange: (lines: LineInput[]) => void }) {
  const set = (i: number, patch: Partial<LineInput>) => onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const byId = new Map(materials.map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-4">
      {lines.map((line, i) => {
        const m = byId.get(line.materialId);
        const byKg = Boolean(m?.unitsPerKg);
        const cost = costs.find((c) => c.materialId === line.materialId);
        const err = (k: string) => errors[`lines.${i}.${k}`];
        const setKg = (kg: number | null, price = line.pricePerKgVnd) =>
          set(i, { inputKg: kg, pricePerKgVnd: price, quantity: kg != null && m?.unitsPerKg ? Math.round(kg * m.unitsPerKg) : null, totalCostVnd: kg != null && price != null ? Math.round(kg * price) : line.totalCostVnd });
        return (
          <div key={i} role="group" aria-label={`Dòng nhập ${i + 1}`} className="rounded-lg border border-line p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_44px]">
              <Field label="Nguyên liệu" error={err("materialId")}>
                <Select value={line.materialId || null} placeholder="Chọn nguyên liệu" options={materialOptions(materials)} onChange={(v) => set(i, { materialId: v, inputKg: null, pricePerKgVnd: null })} searchable disabled={disabled} />
              </Field>
              <div className="flex items-end"><IconButton label={`Bỏ dòng ${i + 1}`} onClick={() => onChange(lines.filter((_, j) => j !== i))} disabled={disabled}><TrashIcon size={18} /></IconButton></div>
            </div>
            {m && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {byKg && <Field label="Số kg"><NumberInput value={line.inputKg} onChange={(v) => setKg(v)} suffix="kg" disabled={disabled} /></Field>}
                {byKg && <Field label="Giá mỗi kg"><MoneyInput value={line.pricePerKgVnd} onChange={(v) => setKg(line.inputKg, v)} disabled={disabled} /></Field>}
                <Field label={`Số lượng (${m.unit})`} hint={byKg ? `${m.unitsPerKg} ${m.unit} mỗi kg` : undefined} error={err("quantity")}>
                  <NumberInput value={line.quantity} onChange={(v) => set(i, { quantity: v == null ? null : Math.round(v), inputKg: null })} decimals={0} disabled={disabled} />
                </Field>
                <Field label="Thành tiền" error={err("totalCostVnd")}><MoneyInput value={line.totalCostVnd} onChange={(v) => set(i, { totalCostVnd: v, pricePerKgVnd: null })} disabled={disabled} /></Field>
              </div>
            )}
            {cost && cost.received > 0 && (
              <p className="mt-3 text-sm text-ink-2">
                Vào kho {formatQty(cost.received, m?.unit ?? "")}{cost.writeOff ? ` (đã trừ ${cost.writeOff} hao hụt)` : ""}, giá vốn {formatVnd(cost.unitCostVnd)} mỗi {m?.unit} gồm chi phí phát sinh.
              </p>
            )}
          </div>
        );
      })}
      <div><Button variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...lines, { materialId: "", quantity: null, totalCostVnd: null, inputKg: null, pricePerKgVnd: null }])}><PlusIcon size={16} /> Thêm nguyên liệu nhập</Button></div>
    </div>
  );
}

// Hao hụt khi nhận hàng: không vào kho, chi phí dồn vào phần còn lại
export function BatchWriteOffs({ writeOffs, lines, onChange, materials, errors, disabled }: Common & { writeOffs: WriteOffInput[]; lines: LineInput[]; onChange: (w: WriteOffInput[]) => void }) {
  const inBatch = materials.filter((m) => lines.some((l) => l.materialId === m.id));
  const set = (i: number, patch: Partial<WriteOffInput>) => onChange(writeOffs.map((w, j) => (j === i ? { ...w, ...patch } : w)));
  return (
    <div className="flex flex-col gap-3">
      {writeOffs.map((w, i) => (
        <div key={i} role="group" aria-label={`Hao hụt ${i + 1}`} className="grid gap-2 sm:grid-cols-[1fr_140px_1fr_44px]">
          <Select ariaLabel={`Nguyên liệu hao hụt ${i + 1}`} value={w.materialId || null} placeholder="Nguyên liệu" options={materialOptions(inBatch)} onChange={(v) => set(i, { materialId: v })} disabled={disabled} aria-invalid={Boolean(errors[`writeOffs.${i}.materialId`])} />
          <NumberInput aria-label={`Số lượng hao hụt ${i + 1}`} value={w.quantity} onChange={(v) => set(i, { quantity: v == null ? null : Math.round(v) })} decimals={0} disabled={disabled} aria-invalid={Boolean(errors[`writeOffs.${i}.quantity`])} />
          <Input aria-label={`Lý do ${i + 1}`} value={w.reason} onChange={(e) => set(i, { reason: e.target.value })} list="wo-reasons" disabled={disabled} />
          <IconButton label={`Bỏ hao hụt ${i + 1}`} onClick={() => onChange(writeOffs.filter((_, j) => j !== i))} disabled={disabled}><TrashIcon size={18} /></IconButton>
          {(errors[`writeOffs.${i}.quantity`] || errors[`writeOffs.${i}.materialId`]) && (
            <p role="alert" className="text-sm text-err sm:col-span-4">{errors[`writeOffs.${i}.quantity`] ?? errors[`writeOffs.${i}.materialId`]}</p>
          )}
        </div>
      ))}
      <datalist id="wo-reasons">{writeOffReasons.map((r) => <option key={r} value={r} />)}</datalist>
      <div><Button variant="outline" size="sm" disabled={disabled || inBatch.length === 0} onClick={() => onChange([...writeOffs, { materialId: inBatch[0]?.id ?? "", quantity: null, reason: writeOffReasons[0] }])}><PlusIcon size={16} /> Thêm hao hụt</Button></div>
    </div>
  );
}
