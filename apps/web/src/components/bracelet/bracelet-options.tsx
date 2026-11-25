"use client";

import { Checkbox, Field, Textarea } from "../ui/field";
import type { BraceletState } from "./use-bracelet";

// Điện thoại: tab Tuỳ chọn gom hạt chủ, kiểu đeo và ghi chú. Máy tính: mỗi phần nằm đúng chỗ ở cột trái
export function BraceletOptions({ state }: { state: BraceletState }) {
  return (
    <div className="flex flex-col gap-5">
      <BraceletAccent state={state} />
      <FitChoice state={state} />
      <BraceletNotes state={state} />
    </div>
  );
}

// Chuỗi 108 hạt: hạt chủ và tua, mặc định có. Loại vòng (vòng đơn hay chuỗi) chọn ở phần cài đặt, không đổi giữa chừng
export function BraceletAccent({ state }: { state: BraceletState }) {
  const { rules, wraps } = state;
  if (wraps === 1) return null;
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-line-strong bg-surface p-3 text-sm has-checked:border-wood has-checked:bg-wood-soft has-focus-visible:outline-2 has-focus-visible:outline-wood">
      <input type="checkbox" checked={state.accent} onChange={(e) => state.setAccent(e.target.checked)} className="mt-0.5 accent-(--wood)" />
      <span>
        <span className="font-medium">Hạt chủ và tua</span>
        <span className="block text-ink-3">
          Một hạt lớn làm điểm nhấn, treo hai dây tua mỗi dây 3 hạt. Thêm {rules.mala.accentBeads} hạt {state.mainBead ? `${state.mainBead.sizeMm} mm ` : ""}cùng loại trầm.
        </span>
      </span>
    </label>
  );
}

// Kiểu đeo đổi cỡ khuyên dùng nên nằm cùng phần cổ tay. Chuỗi quấn nhiều vòng không có kiểu đeo
export function FitChoice({ state }: { state: BraceletState }) {
  const { rules, fit, setFit, wraps } = state;
  if (wraps > 1) return null;
  return (
    <Choice label="Kiểu đeo" name="fit" value={fit} onChange={setFit} options={rules.fits.map((f) => ({ value: f.id, label: `${f.name} (+${f.easeCm.toLocaleString("vi-VN")} cm)` }))} />
  );
}

// Ghi chú gửi shop: loại dây, hộp quà, bọc quà, thiệp kèm lời nhắn, yêu cầu khác
export function BraceletNotes({ state }: { state: BraceletState }) {
  const { rules, cord, setCord, gift, setGift, note, setNote } = state;
  const withCard = gift.card !== undefined;

  return (
    <div className="flex flex-col gap-4">
      <Choice label="Loại dây" name="cord" value={cord} onChange={setCord} options={rules.cords.map((c) => ({ value: c.id, label: c.name }))} />
      <fieldset className="flex flex-col">
        <legend className="mb-1 text-sm font-medium">Quà tặng</legend>
        <p className="text-sm text-ink-3">Shop báo phí hộp, giấy bọc (nếu có) khi gọi xác nhận đơn.</p>
        <Checkbox label="Đựng trong hộp quà" checked={!!gift.box} onChange={(e) => setGift({ ...gift, box: e.target.checked })} className="py-2" />
        <Checkbox label="Bọc giấy quà tặng" checked={!!gift.wrap} onChange={(e) => setGift({ ...gift, wrap: e.target.checked })} className="py-2" />
        <Checkbox
          label="Gửi kèm thiệp"
          checked={withCard}
          onChange={(e) => setGift({ ...gift, card: e.target.checked ? "" : undefined })}
          className="py-2"
        />
        {withCard && (
          <Field label="Lời nhắn trên thiệp" optional hint="Tối đa 200 chữ. Shop viết tay lên thiệp.">
            <Textarea value={gift.card} onChange={(e) => setGift({ ...gift, card: e.target.value })} maxLength={200} rows={3} placeholder="VD: Chúc mẹ luôn mạnh khoẻ, bình an." />
          </Field>
        )}
      </fieldset>
      <Field label="Yêu cầu khác" optional>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} placeholder="VD: Thắt nút dây lỏng hơn một chút." />
      </Field>
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
