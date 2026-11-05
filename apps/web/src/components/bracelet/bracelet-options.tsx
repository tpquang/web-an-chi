"use client";

import { formatVnd } from "@/lib/site";
import { Checkbox, Field, Input, Textarea } from "../ui/field";
import type { BraceletState } from "./use-bracelet";

// Kiểu đeo, dây và dịch vụ thêm. Máy tính đặt ở cột phải, điện thoại ở tab Tuỳ chọn
export function BraceletOptions({ state }: { state: BraceletState }) {
  const { rules, fit, setFit, cord, setCord, extras, setExtras, needsEngraving } = state;
  const prices = rules.extras;
  const set = (patch: Partial<typeof extras>) => setExtras({ ...extras, ...patch });

  return (
    <div className="flex flex-col gap-5">
      <Choice label="Kiểu đeo" name="fit" value={fit} onChange={setFit} options={rules.fits.map((f) => ({ value: f.id, label: `${f.name} (+${f.easeCm.toLocaleString("vi-VN")} cm)` }))} />
      <Choice label="Loại dây" name="cord" value={cord} onChange={setCord} options={rules.cords.map((c) => ({ value: c.id, label: c.name }))} />
      <Field
        label={`${prices.engraving.name} (+${formatVnd(prices.engraving.priceVnd)})`}
        optional={!needsEngraving}
        hint={`Tối đa ${prices.engraving.maxLength} ký tự.${needsEngraving ? " Vòng có hạt chữ nên cần nhập." : ""}`}
      >
        <Input value={extras.engraving} onChange={(e) => set({ engraving: e.target.value })} maxLength={prices.engraving.maxLength} placeholder="VD: An Nhiên" />
      </Field>
      <Checkbox label={`${prices.giftBox.name} (+${formatVnd(prices.giftBox.priceVnd)})`} checked={extras.giftBox} onChange={(e) => set({ giftBox: e.target.checked })} />
      <Checkbox label={`${prices.card.name} (+${formatVnd(prices.card.priceVnd)})`} checked={extras.cardOn} onChange={(e) => set({ cardOn: e.target.checked })} />
      {extras.cardOn && (
        <Field label="Lời nhắn trên thiệp" hint={`Tối đa ${prices.card.maxLength} ký tự.`}>
          <Textarea value={extras.card} onChange={(e) => set({ card: e.target.value })} maxLength={prices.card.maxLength} placeholder="VD: Chúc mẹ luôn khoẻ" />
        </Field>
      )}
      <Checkbox
        label={`${prices.giftWrap.name} (${prices.giftWrap.priceVnd ? `+${formatVnd(prices.giftWrap.priceVnd)}` : "miễn phí"})`}
        checked={extras.giftWrap}
        onChange={(e) => set({ giftWrap: e.target.checked })}
      />
      <p className="text-sm text-ink-3">{rules.leadTime}. Phí giao hàng tính ở bước thanh toán.</p>
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
