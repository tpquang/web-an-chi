"use client";

import { beadTitle, cm } from "@/lib/bracelet";
import { launchDateLabel } from "@/lib/launch";
import { formatVnd } from "@/lib/site";
import { useState } from "react";
import { MinusIcon, PlusIcon, SlidersIcon } from "../icons";
import { Button } from "../ui/button";
import { PreorderButton } from "../preorder/preorder-button";
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
  const { lines, rules, totalVnd, problem, addToCart, gift, note } = state;
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
        <p role="status" className={`text-sm ${problem ? "text-err" : "text-ok"}`}>
          {problem ?? "Vòng đã vừa cỡ tay."}
        </p>
        {salesOpen ? (
          <Button size="lg" block onClick={addToCart}>
            Lưu vòng vào giỏ hàng
          </Button>
        ) : (
          preorder ? (
            <>
              <p className="text-sm text-ink-2">
                Shop giao hàng từ ngày {launchDateLabel}. Bạn đặt chờ vòng này ngay: để lại tên và số điện thoại, shop gọi lại chốt đơn, chưa cần thanh toán.
              </p>
              <PreorderButton item={state.preorderItem} label="Đặt chờ vòng này" block />
            </>
          ) : (
            <p className="rounded-2xl bg-wood-soft p-4 text-sm">
              <span className="block font-medium text-wood">Chờ ngày mở bán {launchDateLabel}</span>
              Vòng thiết kế đặt được từ ngày này. Thiết kế chưa được lưu lại, bạn ghi nhớ mẫu ưng ý để đặt khi shop mở bán.
            </p>
          )
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
