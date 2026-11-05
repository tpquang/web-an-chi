"use client";

import { type ReactNode, useState } from "react";
import type { Bead } from "@/lib/api";
import { type BeadTab, beadTab, beadTabs, beadTitle } from "@/lib/bracelet";
import { formatVnd } from "@/lib/site";
import type { BraceletState } from "./use-bracelet";

type Props = {
  state: BraceletState;
  // Chạm thì chạy onTap, kéo thì thả hạt vào vòng
  onBeadPointer(bead: Bead, event: React.PointerEvent, onTap: () => void): void;
  // Tab tuỳ chọn chỉ có trên điện thoại, máy tính để tuỳ chọn ở cột phải
  options: ReactNode;
};

const segment =
  "min-h-11 flex-1 rounded-md px-2 text-sm font-medium whitespace-nowrap text-ink-2 transition-colors duration-(--d-fast) hover:text-ink aria-pressed:bg-wood aria-pressed:text-on-wood";
const chip =
  "min-h-11 flex-1 rounded-md border border-line-strong text-sm tabular-nums transition-colors duration-(--d-fast) hover:border-wood aria-pressed:border-wood aria-pressed:bg-wood-soft aria-pressed:font-medium aria-pressed:text-wood";

export function BeadPicker({ state, onBeadPointer, options }: Props) {
  const { beads, mainBead, counts, insert, swapMain } = state;
  const [tab, setTab] = useState<BeadTab | "options">("tram");

  const tram = beads.filter((bead) => beadTab(bead) === "tram");
  const sizes = [...new Set(tram.map((bead) => bead.sizeMm))].sort((a, b) => a - b);
  const main = mainBead && beadTab(mainBead) === "tram" ? mainBead : tram[0];
  const shown = tab === "tram" ? tram.filter((bead) => bead.sizeMm === main?.sizeMm) : beads.filter((bead) => tab !== "options" && beadTab(bead) === tab);

  function pickSize(size: number) {
    const same = tram.find((bead) => bead.material === main?.material && bead.sizeMm === size) ?? tram.find((bead) => bead.sizeMm === size);
    if (same) swapMain(same.slug);
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:gap-6">
      {/* Điện thoại: loại hạt, rồi cỡ hạt, tab nằm dưới cùng trong tầm ngón cái. Máy tính: tab, cỡ hạt, loại hạt */}
      <div role="group" aria-label="Nhóm hạt" className="order-last flex gap-1 rounded-lg bg-paper-2 p-1 lg:order-first">
        {beadTabs.map((t) => (
          <button key={t.id} type="button" aria-pressed={tab === t.id} onClick={() => setTab(t.id)} className={segment}>
            {t.label}
          </button>
        ))}
        <button type="button" aria-pressed={tab === "options"} onClick={() => setTab("options")} className={`${segment} lg:hidden`}>
          Tuỳ chọn
        </button>
      </div>

      {tab === "options" ? (
        <div className="max-h-[38dvh] overflow-y-auto lg:hidden">{options}</div>
      ) : (
        <>
          {tab === "tram" && sizes.length > 1 && (
            <div className="order-1 flex items-center gap-2 lg:order-none lg:flex-col lg:items-stretch">
              <p className="w-16 flex-none text-sm text-ink-3 lg:w-auto lg:text-xs lg:tracking-widest lg:uppercase">Cỡ hạt</p>
              <div role="group" aria-label="Cỡ hạt" className="flex flex-1 gap-2">
                {sizes.map((size) => (
                  <button key={size} type="button" aria-pressed={main?.sizeMm === size} onClick={() => pickSize(size)} className={chip}>
                    {size} mm
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="hidden text-xs tracking-widest text-ink-3 uppercase lg:block">{tab === "tram" ? "Loại trầm · kéo hạt vào vòng" : "Kéo hạt vào vòng"}</p>
            <ul
              className={
                tab === "tram"
                  ? "grid grid-cols-3 gap-2 lg:grid-cols-1"
                  : "-mx-(--page-gutter) flex snap-x scroll-px-(--page-gutter) gap-2 overflow-x-auto px-(--page-gutter) [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-1 lg:overflow-visible lg:px-0"
              }
            >
              {shown.map((bead) => {
                const pressed = tab === "tram" ? main?.slug === bead.slug : undefined;
                const onTap = () => (tab === "tram" ? swapMain(bead.slug) : insert(bead.slug));
                return (
                  <li key={bead.slug} className={tab === "tram" ? "min-w-0" : "w-28 flex-none snap-start lg:w-auto"}>
                    <button
                      type="button"
                      aria-pressed={pressed}
                      onPointerDown={(e) => onBeadPointer(bead, e, onTap)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onTap())}
                      onContextMenu={(e) => e.preventDefault()}
                      disabled={bead.stock === 0}
                      className="flex h-full w-full touch-pan-x flex-col items-center gap-1.5 rounded-lg border border-line bg-surface p-2.5 text-center transition-colors duration-(--d-fast) select-none [-webkit-touch-callout:none] hover:border-wood disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-wood aria-pressed:bg-wood-soft lg:touch-none lg:flex-row lg:gap-3 lg:p-3 lg:text-left"
                    >
                      <span aria-hidden className="size-9 flex-none rounded-full shadow-e1 lg:size-11" style={{ background: bead.color }} />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="line-clamp-2 text-sm leading-tight font-medium">{tab === "tram" ? bead.material : beadTitle(bead)}</span>
                        {bead.note && <span className="hidden text-xs text-ink-3 lg:line-clamp-2">{bead.note}</span>}
                        <span className="text-xs text-wood tabular-nums lg:text-sm">
                          {bead.stock === 0 ? "Hết hàng" : formatVnd(bead.priceVnd)}
                          <span className="hidden text-ink-3 lg:inline"> / hạt{counts.get(bead.slug) ? ` · dùng ${counts.get(bead.slug)}` : ""}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
