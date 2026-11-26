"use client";

import { beadTitle, cm } from "@/lib/bracelet";
import { formatVnd } from "@/lib/site";
import { useState } from "react";
import { MinusIcon, PlusIcon, SlidersIcon } from "../icons";
import { Button } from "../ui/button";
import { useLaunchLabel } from "../launch/launch-clock";
import { BraceletAccent, BraceletNotes, FitChoice } from "./bracelet-options";
import type { BraceletState } from "./use-bracelet";

const stepButton = "inline-flex size-11 flex-none items-center justify-center rounded-md border border-line-strong hover:border-wood disabled:opacity-50";

// Ô cổ tay: compact cho thanh trên của sheet điện thoại. Cột phải máy tính gọn hai dòng thông tin,
// bấm nút cài đặt mới mở phần chỉnh số đo
export function WristSize({ state, compact }: { state: BraceletState; compact?: boolean }) {
  const { rules, wristCm, setWristCm, targetMm, easeCm, mainBead } = state;
  const [open, setOpen] = useState(false);
  // Chuỗi 108 hạt quấn nhiều vòng: số hạt cố định, chỉ vòng đơn mới có cỡ khuyên dùng
  const mala = state.wraps > 1;
  const { min, max } = rules.wristCm;
  const value = `${wristCm.toLocaleString("vi-VN")} cm`;
  const stepper = (
    <div role="group" aria-label="Chu vi cổ tay" className="flex flex-1 items-center gap-2">
      <button type="button" aria-label="Giảm 0,5 cm" onClick={() => setWristCm(wristCm - 0.5)} disabled={wristCm <= min} className={stepButton}>
        <MinusIcon />
      </button>
      <output aria-live="polite" className="flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-md border border-line bg-surface text-lg tabular-nums">
        {value}
      </output>
      <button type="button" aria-label="Tăng 0,5 cm" onClick={() => setWristCm(wristCm + 0.5)} disabled={wristCm >= max} className={stepButton}>
        <PlusIcon />
      </button>
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-paper-2 p-2 pl-3">
        <span className="flex-none text-sm text-ink-2">Cổ tay</span>
        {stepper}
        {/* Chuỗi quấn nhiều vòng có số hạt cố định nên không có cỡ khuyên dùng */}
        {!mala && (
          <p className="flex-none text-right text-xs text-ink-3">
            Khuyên dùng
            <span className="block text-lg font-semibold text-wood tabular-nums">{cm(targetMm)} cm</span>
          </p>
        )}
      </div>
    );
  }

  const beads = mainBead ? `${Math.round(targetMm / mainBead.sizeMm)} hạt ${mainBead.sizeMm} mm` : null;

  return (
    <section aria-labelledby="co-tay" className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1 text-sm text-ink-2 tabular-nums" aria-live="polite">
          <h2 id="co-tay">
            Cổ tay <span className="font-semibold text-ink">{value}</span>
          </h2>
          {mala ? (
            <p className="mt-0.5">
              Chuỗi {rules.mala.beads} hạt{mainBead ? ` ${mainBead.sizeMm} mm` : ""}, quấn {state.wraps} vòng
            </p>
          ) : (
            <p className="mt-0.5">
              Khuyên dùng <span className="font-semibold text-wood">{cm(targetMm)} cm</span>
              {beads && ` (${beads})`}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="co-tay-chi-tiet"
          aria-label="Chỉnh số đo cổ tay"
          onClick={() => setOpen(!open)}
          className="inline-flex size-11 flex-none items-center justify-center rounded-full border border-line-strong text-ink-2 transition-colors duration-(--d-fast) hover:border-wood hover:text-wood aria-expanded:border-wood aria-expanded:bg-wood-soft aria-expanded:text-wood"
        >
          <SlidersIcon />
        </button>
      </div>
      {open && (
        <div id="co-tay-chi-tiet" className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
          <p className="text-sm text-ink-2">Chu vi cổ tay của bạn</p>
          {stepper}
          <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-2">
            <div className="h-full rounded-full bg-wood" style={{ width: `${((wristCm - min) / (max - min)) * 100}%` }} />
          </div>
          <p aria-hidden className="flex justify-between text-xs text-ink-3 tabular-nums">
            <span>{min} cm</span>
            <span>{max} cm</span>
          </p>
          <FitChoice state={state} />
          {!mala && <p className="text-sm text-ink-2">Cỡ khuyên dùng đã cộng {easeCm.toLocaleString("vi-VN")} cm cho thoáng tay.</p>}
          <p className="text-sm text-ink-3">Quấn thước dây sát cổ tay, ngay dưới xương cổ tay, đọc số chỗ hai đầu gặp nhau.</p>
        </div>
      )}
    </section>
  );
}

// Cột trái máy tính, dưới kho hạt: hạt chủ, cổ tay, rồi chốt vòng (tạm tính, nút lưu vào giỏ), ghi chú, chi tiết hạt
export function BraceletSummary({ state, salesOpen, preorder }: { state: BraceletState; salesOpen: boolean; preorder: boolean }) {
  const { lines, rules, totalVnd, addToCart, gift, note } = state;
  const launchDateLabel = useLaunchLabel();
  // Dòng tóm tắt dưới tiêu đề Ghi chú để khách thấy đã chọn gì mà không cần mở
  const noteSummary = [
    rules.cords.find((c) => c.id === state.cord)?.name,
    gift.box && "hộp quà",
    gift.wrap && "bọc quà",
    gift.card !== undefined && "thiệp",
    note.trim() && "có yêu cầu",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-6">
      <BraceletAccent state={state} />
      <WristSize state={state} />

      {/* Chốt vòng ngay dưới cổ tay: giá, tình trạng vừa tay, nút lưu vào giỏ (mở bảng giỏ hàng bên phải) */}
      <section aria-labelledby="chot-vong" className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
        <h2 id="chot-vong" className="sr-only">
          Lưu vòng
        </h2>
        <p className="flex items-baseline justify-between" aria-live="polite">
          <span className="font-medium">Tạm tính</span>
          <span className="font-serif text-[28px] leading-tight font-semibold text-wood tabular-nums">{formatVnd(totalVnd)}</span>
        </p>
        <FitStatus state={state} className="text-sm" />
        {salesOpen || preorder ? (
          <>
            <Button size="lg" block onClick={addToCart}>
              {state.editing ? "Cập nhật vòng trong giỏ" : "Lưu vòng vào giỏ hàng"}
            </Button>
            {!salesOpen && <p className="text-sm text-ink-2">Shop giao từ ngày {launchDateLabel}. Vòng đặt trước ngày này là đơn đặt chờ.</p>}
          </>
        ) : (
            <p className="rounded-2xl bg-wood-soft p-4 text-sm">
              <span className="block font-medium text-wood">Chờ ngày mở bán {launchDateLabel}</span>
              Vòng thiết kế đặt được từ ngày này. Thiết kế của bạn được lưu trên trình duyệt này để đặt khi shop mở bán.
            </p>
        )}
      </section>

      {/* Ghi chú cho shop: loại dây, hộp quà, bọc quà, thiệp, yêu cầu khác */}
      <details className="group rounded-xl border border-line bg-surface">
        <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 font-medium">
          <span>
            Ghi chú
            <span className="block text-sm font-normal text-ink-3">{noteSummary}</span>
          </span>
          <PlusIcon aria-hidden className="flex-none transition-transform duration-(--d-base) group-open:rotate-45" />
        </summary>
        <div className="px-4 pb-4">
          <BraceletNotes state={state} />
        </div>
      </details>

      <section aria-labelledby="thiet-ke" className="flex flex-col gap-3">
        <h2 id="thiet-ke" className="text-xs tracking-widest text-ink-3 uppercase">
          Thiết kế của bạn
        </h2>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm tabular-nums">
          {lines.map(({ bead, count, vnd }) => (
            <div key={bead.slug} className="contents">
              <dt className="text-ink-2">
                {count} {beadTitle(bead)} {bead.kind === "BEAD" ? `${bead.sizeMm} mm` : ""}
              </dt>
              <dd className="text-right">{formatVnd(vnd)}</dd>
            </div>
          ))}
          {state.accentCount > 0 && (
            <>
              <dt className="text-ink-2">Hạt chủ và tua ({state.accentCount} hạt)</dt>
              <dd className="text-right">{formatVnd(state.accentVnd)}</dd>
            </>
          )}
          {rules.feeVnd > 0 && (
            <>
              <dt className="text-ink-2">Công xâu vòng</dt>
              <dd className="text-right">{formatVnd(rules.feeVnd)}</dd>
            </>
          )}
        </dl>
      </section>
    </div>
  );
}

// Lỗi chặn lưu tô đỏ; lệch cỡ tay chỉ là gợi ý, vòng vẫn lưu được
export function FitStatus({ state, className }: { state: BraceletState; className: string }) {
  const { problem, hint } = state;
  return (
    <p role="status" className={`${className} ${problem ? "text-err" : hint ? "text-warn" : "text-ok"}`}>
      {problem ?? hint ?? "Vòng đã vừa cỡ tay."}
    </p>
  );
}

// Đang sửa một vòng trong giỏ: báo cho khách và cho thôi sửa
export function EditingNotice({ state }: { state: BraceletState }) {
  if (!state.editing) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-wood/40 bg-wood-soft px-4 py-2 text-sm">
      <p>Bạn đang sửa một vòng trong giỏ. Bấm cập nhật để lưu thay đổi.</p>
      <button type="button" onClick={state.stopEditing} className="min-h-11 font-medium text-wood underline-offset-4 hover:underline">
        Thôi sửa, lưu thành vòng mới
      </button>
    </div>
  );
}
