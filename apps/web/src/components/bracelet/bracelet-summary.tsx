"use client";

import { beadTitle, cm } from "@/lib/bracelet";
import { formatVnd } from "@/lib/site";
import { MinusIcon, PlusIcon } from "../icons";
import { Button } from "../ui/button";
import { BraceletOptions } from "./bracelet-options";
import type { BraceletState } from "./use-bracelet";

const stepButton = "inline-flex size-11 flex-none items-center justify-center rounded-md border border-line-strong hover:border-wood disabled:opacity-50";

// Ô cổ tay: compact cho thanh trên của sheet điện thoại, đầy đủ cho cột phải máy tính
export function WristSize({ state, compact }: { state: BraceletState; compact?: boolean }) {
  const { rules, wristCm, setWristCm, targetMm, easeCm, mainBead } = state;
  const { min, max } = rules.wristCm;
  const value = `${wristCm.toLocaleString("vi-VN", { minimumFractionDigits: compact ? 0 : 1 })} cm`;
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
        <p className="flex-none text-right text-xs text-ink-3">
          Khuyên dùng
          <span className="block text-lg font-semibold text-wood tabular-nums">{cm(targetMm)} cm</span>
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="co-tay" className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <h2 id="co-tay" className="font-serif text-2xl">
        Kích thước cổ tay
      </h2>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-ink-2">Chu vi cổ tay của bạn</p>
        {stepper}
        <div aria-hidden className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-2">
          <div className="h-full rounded-full bg-wood" style={{ width: `${((wristCm - min) / (max - min)) * 100}%` }} />
        </div>
        <p aria-hidden className="flex justify-between text-xs text-ink-3 tabular-nums">
          <span>{min} cm</span>
          <span>{max} cm</span>
        </p>
      </div>
      <div className="flex items-end justify-between gap-3 rounded-lg bg-paper-2 p-4">
        <p className="text-sm text-ink-2">
          Khuyên dùng (+{easeCm.toLocaleString("vi-VN")} cm cho thoáng)
          <span className="block text-[28px] font-semibold text-wood tabular-nums">{cm(targetMm)} cm</span>
        </p>
        {mainBead && (
          <p className="text-right text-sm text-ink-2 tabular-nums">
            ≈ {Math.round(targetMm / mainBead.sizeMm)} hạt
            <span className="block">loại {mainBead.sizeMm} mm</span>
          </p>
        )}
      </div>
      <p className="text-sm text-ink-3">Quấn thước dây sát cổ tay, ngay dưới xương cổ tay, đọc số chỗ hai đầu gặp nhau.</p>
    </section>
  );
}

export function BraceletSummary({ state }: { state: BraceletState }) {
  const { lines, rules, totalVnd, problem, addToCart } = state;

  return (
    <div className="flex flex-col gap-6">
      <WristSize state={state} />

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
          {rules.feeVnd > 0 && (
            <>
              <dt className="text-ink-2">Công xâu vòng</dt>
              <dd className="text-right">{formatVnd(rules.feeVnd)}</dd>
            </>
          )}
        </dl>
        <p className="flex items-baseline justify-between border-t border-line pt-3" aria-live="polite">
          <span className="text-lg font-medium">Tạm tính</span>
          <span className="font-serif text-[28px] text-wood lining-nums tabular-nums">{formatVnd(totalVnd)}</span>
        </p>
        <p role="status" className={`text-sm ${problem ? "text-err" : "text-ok"}`}>
          {problem ?? "Vòng đã vừa cỡ tay."}
        </p>
        <Button size="lg" block onClick={addToCart}>
          Thêm vào giỏ
        </Button>
      </section>

      <details className="group rounded-xl border border-line bg-surface">
        <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between px-5 font-medium">
          Kiểu đeo, dây và quà tặng
          <PlusIcon aria-hidden className="transition-transform duration-(--d-base) group-open:rotate-45" />
        </summary>
        <div className="px-5 pb-5">
          <BraceletOptions state={state} />
        </div>
      </details>
    </div>
  );
}
