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

export function BeadPicker({ state, onBeadPointer, options }: Props) {
  const { beads, mainBead, counts, insert } = state;
  const [tab, setTab] = useState<BeadTab | "options">("tram");

  // Cỡ hạt và loại trầm chính đã chọn ở form khởi tạo. Ở đây chỉ thêm từng hạt: chạm thì thêm một hạt, kéo thì thả vào chỗ muốn.
  // Không có thao tác dựng lại cả vòng từ một hạt; muốn đổi thì bấm "Cài đặt lại"
  const tram = beads.filter((bead) => beadTab(bead) === "tram");
  const main = mainBead && beadTab(mainBead) === "tram" ? mainBead : tram[0];
  const shown = tab === "tram" ? tram.filter((bead) => bead.sizeMm === main?.sizeMm) : beads.filter((bead) => tab !== "options" && beadTab(bead) === tab);

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
          <div className="flex flex-col gap-2">
            <p className="hidden text-xs tracking-widest text-ink-3 uppercase lg:block">{tab === "tram" ? `Hạt ${main?.sizeMm ?? ""} mm · kéo hạt vào vòng` : "Kéo hạt vào vòng"}</p>
            <ul
              className={
                tab === "tram"
                  ? "grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-4"
                  : "-mx-(--page-gutter) flex snap-x scroll-px-(--page-gutter) gap-2 overflow-x-auto px-(--page-gutter) [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-1 lg:gap-4 lg:overflow-visible lg:px-0"
              }
            >
              {shown.map((bead) => {
                const onTap = () => insert(bead.slug);
                return (
                  <li key={bead.slug} className={tab === "tram" ? "min-w-0" : "w-28 flex-none snap-start lg:w-auto"}>
                    {/* Hạt đứng riêng như hạt thật có bóng đổ, nhãn mô tả treo bên cạnh. Máy tính: hạt ở mép phải, sát khung vòng,
                        để thấy rõ là kéo hạt sang vòng. Con trỏ hình bàn tay báo kéo được */}
                    <button
                      type="button"
                      onPointerDown={(e) => onBeadPointer(bead, e, onTap)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onTap())}
                      onContextMenu={(e) => e.preventDefault()}
                      disabled={bead.stock === 0}
                      className="group flex h-full w-full cursor-grab touch-pan-x flex-col items-center gap-2 rounded-lg border border-line bg-surface p-2.5 text-center select-none [-webkit-touch-callout:none] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-wood aria-pressed:bg-wood-soft lg:touch-none lg:flex-row-reverse lg:gap-0 lg:border-0 lg:bg-transparent lg:p-0 lg:text-left lg:aria-pressed:bg-transparent"
                    >
                      <span className="relative flex size-11 flex-none items-center justify-center lg:size-16">
                        {/* Bóng đổ mềm dưới hạt, hạt nhấc lên khi rê chuột thì bóng loang ra */}
                        <span
                          aria-hidden
                          className="absolute -bottom-1 left-1/2 h-2 w-4/5 -translate-x-1/2 rounded-full bg-ink opacity-25 blur-sm transition-all duration-(--d-base) group-hover:w-full group-hover:opacity-15 motion-reduce:transition-none"
                        />
                        {bead.texture?.thumb ? (
                          // Ảnh chụp chính hạt 3D lúc lưu ảnh vân ở CMS; chưa có thì hiện chấm màu
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/bead-textures/${bead.texture.id}/thumb?v=${bead.texture.version}`}
                            alt=""
                            width={64}
                            height={64}
                            loading="lazy"
                            decoding="async"
                            draggable={false}
                            className="relative size-full transition-transform duration-(--d-base) ease-(--ease-out) group-hover:-translate-y-1 motion-reduce:transition-none"
                          />
                        ) : (
                          <span
                            aria-hidden
                            className="relative size-4/5 rounded-full transition-transform duration-(--d-base) ease-(--ease-out) group-hover:-translate-y-1 motion-reduce:transition-none"
                            style={{ background: bead.color }}
                          />
                        )}
                      </span>
                      {/* Dây nối từ nhãn sang hạt */}
                      <span aria-hidden className="hidden h-px w-4 flex-none bg-line-strong group-aria-pressed:bg-wood lg:block" />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5 lg:rounded-lg lg:border lg:border-line lg:bg-surface lg:px-3 lg:py-2 lg:shadow-e1 lg:transition-colors lg:duration-(--d-fast) lg:group-hover:border-wood lg:group-aria-pressed:border-wood lg:group-aria-pressed:bg-wood-soft">
                        <span className="line-clamp-2 text-sm leading-tight font-medium">{tab === "tram" ? bead.material : beadTitle(bead)}</span>
                        {bead.note && <span className="hidden text-xs text-ink-3 lg:line-clamp-2">{bead.note}</span>}
                        <span className="text-xs text-wood tabular-nums lg:text-sm">
                          {bead.stock === 0 ? "Hết hàng" : formatVnd(bead.priceVnd)}
                          <span className="hidden text-ink-3 lg:inline"> / hạt</span>
                        </span>
                        {counts.get(bead.slug) ? <span className="hidden text-xs text-ink-3 lg:block">Đang dùng {counts.get(bead.slug)} hạt</span> : null}
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
