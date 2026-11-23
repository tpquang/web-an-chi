"use client";

import type { BraceletState } from "./use-bracelet";

// Kiểu đeo và dây. Máy tính đặt ở cột phải, điện thoại ở tab Tuỳ chọn
// withStyle: điện thoại chọn loại vòng ở tab Tuỳ chọn; máy tính đã có ở đầu cột phải
export function BraceletOptions({ state, withStyle }: { state: BraceletState; withStyle?: boolean }) {
  const { rules, fit, setFit, cord, setCord } = state;

  return (
    <div className="flex flex-col gap-5">
      {withStyle && <BraceletStyle state={state} />}
      <Choice label="Kiểu đeo" name="fit" value={fit} onChange={setFit} options={rules.fits.map((f) => ({ value: f.id, label: `${f.name} (+${f.easeCm.toLocaleString("vi-VN")} cm)` }))} />
      <Choice label="Loại dây" name="cord" value={cord} onChange={setCord} options={rules.cords.map((c) => ({ value: c.id, label: c.name }))} />
      <p className="text-sm text-ink-3">{rules.leadTime}. Phí giao hàng tính ở bước thanh toán.</p>
    </div>
  );
}

// Loại vòng: vòng đơn một tầng hoặc chuỗi 108 hạt quấn 3, 4 vòng
export function BraceletStyle({ state }: { state: BraceletState }) {
  const { rules, wraps, setWraps } = state;
  const styles = [
    { value: "1", label: "Vòng đơn" },
    ...rules.mala.wraps.map((n) => ({ value: String(n), label: `${rules.mala.beads} hạt · quấn ${n} vòng` })),
  ];
  return (
    <div className="flex flex-col gap-3">
      <Choice label="Loại vòng" name="wraps" value={String(wraps)} onChange={(v) => setWraps(Number(v))} options={styles} />
      {wraps > 1 && (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-line-strong bg-surface p-3 text-sm has-checked:border-wood has-checked:bg-wood-soft has-focus-visible:outline-2 has-focus-visible:outline-wood">
          <input type="checkbox" checked={state.accent} onChange={(e) => state.setAccent(e.target.checked)} className="mt-0.5 accent-(--wood)" />
          <span>
            <span className="font-medium">Hạt chủ và tua</span>
            <span className="block text-ink-3">
              Một hạt lớn làm điểm nhấn, treo hai dây tua mỗi dây 3 hạt. Thêm {rules.mala.accentBeads} hạt {state.mainBead ? `${state.mainBead.sizeMm} mm ` : ""}cùng loại trầm.
            </span>
          </span>
        </label>
      )}
    </div>
  );
}

function Choice({ label, name, value, onChange, options }: { label: string; name: string; value: string; onChange(v: string): void; options: { value: string; label: string }[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-sm has-checked:border-wood has-checked:bg-wood-soft has-focus-visible:outline-2 has-focus-visible:outline-wood"
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="accent-(--wood)" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
