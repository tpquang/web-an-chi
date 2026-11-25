"use client";

import { useEffect, useRef, useState } from "react";
import type { Bead } from "@/lib/api";
import { beadTab, cm } from "@/lib/bracelet";
import { formatVnd } from "@/lib/site";
import { MinusIcon, PlusIcon } from "../icons";
import { Button } from "../ui/button";
import type { BraceletSetupValues, BraceletState } from "./use-bracelet";

const steps = ["Loại vòng", "Hạt trầm", "Cổ tay"] as const;

const option =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line-strong bg-surface p-3 text-left transition-colors duration-(--d-fast) hover:border-wood has-checked:border-wood has-checked:bg-wood-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-wood";
const stepButton = "inline-flex size-11 flex-none items-center justify-center rounded-md border border-line-strong hover:border-wood disabled:opacity-50";

// Form khởi tạo vòng theo bước: loại vòng, hạt trầm (cỡ rồi loại), cổ tay và kiểu đeo. Xong mới vào thiết kế.
// Giá trị mở sẵn theo vòng đang có, để "Cài đặt lại" chỉ cần sửa chỗ muốn đổi
export function BraceletSetup({ state, onDone }: { state: BraceletState; onDone(values: BraceletSetupValues): void }) {
  const { rules, beads } = state;
  const tram = beads.filter((bead) => bead.kind === "BEAD" && beadTab(bead) === "tram");
  const sizes = [...new Set(tram.map((bead) => bead.sizeMm))].sort((a, b) => a - b);
  const start = state.mainBead && tram.some((b) => b.slug === state.mainBead!.slug) ? state.mainBead : (tram.find((b) => b.stock > 0) ?? tram[0]);

  const [step, setStep] = useState(0);
  // Hướng trượt: tiến thì nội dung vào từ phải, lùi thì vào từ trái
  const [forward, setForward] = useState(true);
  const [wraps, setWraps] = useState(state.wraps);
  const [size, setSize] = useState(start?.sizeMm ?? sizes[0]);
  const [slug, setSlug] = useState(start?.slug ?? "");
  const [wrist, setWrist] = useState(state.wristCm);
  const [fitId, setFitId] = useState(state.fit);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // Đổi bước thì đưa focus về tiêu đề bước, để bàn phím và máy đọc màn hình đi tiếp từ đầu bước mới
  useEffect(() => {
    if (first.current) return void (first.current = false);
    heading.current?.focus();
  }, [step]);

  const ofSize = tram.filter((bead) => bead.sizeMm === size);
  const bead = tram.find((b) => b.slug === slug);
  const ease = rules.fits.find((f) => f.id === fitId)?.easeCm ?? 0;
  const targetMm = Math.round((wrist + ease) * 10);
  const { min, max } = rules.wristCm;

  function pickSize(next: number) {
    setSize(next);
    // Giữ loại trầm đang chọn nếu có cỡ này, không thì lấy loại đầu tiên còn hàng
    const current = tram.find((b) => b.slug === slug);
    const same = ofSizeOf(next).find((b) => b.material === current?.material) ?? ofSizeOf(next).find((b) => b.stock > 0) ?? ofSizeOf(next)[0];
    if (same) setSlug(same.slug);
  }
  const ofSizeOf = (s: number) => tram.filter((b) => b.sizeMm === s);

  function go(next: number) {
    setForward(next > step);
    setStep(next);
  }

  const canNext = step !== 1 || (!!bead && bead.stock > 0);

  return (
    <section aria-labelledby="khoi-tao-vong" className="rounded-3xl bg-surface p-5 md:p-8 lg:w-2/3">
      <h2 id="khoi-tao-vong" className="sr-only">
        Khởi tạo vòng
      </h2>
      <ol className="mb-6 flex gap-2">
        {steps.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined} className="flex flex-1 flex-col gap-2">
            <span aria-hidden className={`h-1 rounded-full transition-colors duration-(--d-page) ease-(--ease-out) ${i <= step ? "bg-wood" : "bg-paper-2"}`} />
            <span className={`text-xs ${i === step ? "font-semibold text-wood" : "text-ink-3"}`}>
              <span className="sr-only">Bước {i + 1}: </span>
              {label}
            </span>
          </li>
        ))}
      </ol>

      {/* Mỗi bước dựng lại theo key, trượt và hiện dần khi vào */}
      <div
        key={step}
        className={`flex flex-col gap-5 transition-[opacity,translate] duration-(--d-page) ease-(--ease-ios) motion-reduce:transition-none starting:opacity-0 ${forward ? "starting:translate-x-6" : "starting:-translate-x-6"}`}
      >
        {step === 0 && (
          <>
            <StepTitle ref={heading} n={1} title="Bạn muốn làm loại vòng nào?" />
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Loại vòng</legend>
              <label className={option}>
                <input type="radio" name="loai-vong" checked={wraps === 1} onChange={() => setWraps(1)} className="accent-(--wood)" />
                <span>
                  <span className="block font-medium">Vòng đơn</span>
                  <span className="block text-sm text-ink-3">Một vòng quanh cổ tay, số hạt theo cỡ tay của bạn.</span>
                </span>
              </label>
              {rules.mala.wraps.map((n) => (
                <label key={n} className={option}>
                  <input type="radio" name="loai-vong" checked={wraps === n} onChange={() => setWraps(n)} className="accent-(--wood)" />
                  <span>
                    <span className="block font-medium">
                      Chuỗi {rules.mala.beads} hạt quấn {n} vòng
                    </span>
                    <span className="block text-sm text-ink-3">Đủ {rules.mala.beads} hạt, quấn nhiều vòng quanh cổ tay.</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <StepTitle ref={heading} n={2} title="Chọn cỡ hạt và loại trầm" />
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Cỡ hạt</legend>
              <div className="flex gap-2">
                {sizes.map((s) => (
                  <label key={s} className={`${option} flex-1 justify-center tabular-nums`}>
                    <input type="radio" name="co-hat" checked={size === s} onChange={() => pickSize(s)} className="sr-only" />
                    {s} mm
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Loại trầm</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {ofSize.map((b) => (
                  <label key={b.slug} className={`${option} ${b.stock === 0 ? "cursor-not-allowed opacity-50" : ""}`}>
                    <input type="radio" name="loai-tram" checked={slug === b.slug} disabled={b.stock === 0} onChange={() => setSlug(b.slug)} className="sr-only" />
                    <BeadThumb bead={b} />
                    <span className="min-w-0">
                      <span className="block font-medium">{b.material}</span>
                      <span className="block text-sm text-wood tabular-nums">{b.stock === 0 ? "Hết hàng" : `${formatVnd(b.priceVnd)} / hạt`}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step === 2 && (
          <>
            <StepTitle ref={heading} n={3} title="Kích thước cổ tay" />
            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink-2">Chu vi cổ tay của bạn</p>
              <div role="group" aria-label="Chu vi cổ tay" className="flex max-w-80 items-center gap-2">
                <button type="button" aria-label="Giảm 0,5 cm" onClick={() => setWrist(Math.max(min, wrist - 0.5))} disabled={wrist <= min} className={stepButton}>
                  <MinusIcon />
                </button>
                <output aria-live="polite" className="flex min-h-11 flex-1 items-center justify-center rounded-md border border-line bg-paper text-lg tabular-nums">
                  {wrist.toLocaleString("vi-VN")} cm
                </output>
                <button type="button" aria-label="Tăng 0,5 cm" onClick={() => setWrist(Math.min(max, wrist + 0.5))} disabled={wrist >= max} className={stepButton}>
                  <PlusIcon />
                </button>
              </div>
              <p className="text-sm text-ink-3">Quấn thước dây sát cổ tay, ngay dưới xương cổ tay, đọc số chỗ hai đầu gặp nhau.</p>
            </div>
            {wraps === 1 && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-sm font-medium">Kiểu đeo</legend>
                <div className="flex flex-wrap gap-2">
                  {rules.fits.map((f) => (
                    <label key={f.id} className={option}>
                      <input type="radio" name="kieu-deo" checked={fitId === f.id} onChange={() => setFitId(f.id)} className="accent-(--wood)" />
                      {f.name} (+{f.easeCm.toLocaleString("vi-VN")} cm)
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {bead && (
              <p aria-live="polite" className="rounded-lg bg-paper-2 p-4 text-sm text-ink-2 tabular-nums">
                {wraps === 1 ? (
                  <>
                    Khuyên dùng <span className="font-semibold text-wood">{cm(targetMm)} cm</span>, khoảng {Math.round(targetMm / bead.sizeMm)} hạt {bead.sizeMm} mm.
                  </>
                ) : (
                  <>
                    Chuỗi {rules.mala.beads} hạt {bead.sizeMm} mm quấn được khoảng{" "}
                    {((rules.mala.beads * bead.sizeMm) / targetMm).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} vòng trên cổ tay này.
                  </>
                )}
              </p>
            )}
          </>
        )}
      </div>

      {/* Quay lại bên trái, nút tiến (Tiếp tục, Bắt đầu thiết kế) luôn ở mép phải, kể cả trên điện thoại */}
      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <Button size="lg" variant="outline" onClick={() => go(step - 1)}>
            Quay lại
          </Button>
        )}
        <span className="flex-1" />
        {step < steps.length - 1 ? (
          <Button size="lg" onClick={() => go(step + 1)} disabled={!canNext}>
            Tiếp tục
          </Button>
        ) : (
          <Button size="lg" onClick={() => bead && onDone({ wraps, slug, wrist, fitId })} disabled={!bead}>
            Bắt đầu thiết kế
          </Button>
        )}
      </div>
    </section>
  );
}

const segmentOption =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm whitespace-nowrap text-ink-2 transition-colors duration-(--d-fast) hover:text-ink has-checked:bg-wood has-checked:font-medium has-checked:text-on-wood has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-wood has-disabled:cursor-not-allowed has-disabled:opacity-50";

// Máy tính: cài đặt gọn một hàng nằm trên khu thiết kế. Chọn xong bấm "Dựng lại vòng" mới thay vòng,
// để khách không mất các hạt đã xếp chỉ vì lỡ bấm. Cổ tay chỉnh ở cột trái, đổi là tự thêm bớt hạt
export function SetupBar({ state }: { state: BraceletState }) {
  const { rules, beads } = state;
  const tram = beads.filter((bead) => bead.kind === "BEAD" && beadTab(bead) === "tram");
  const sizes = [...new Set(tram.map((bead) => bead.sizeMm))].sort((a, b) => a - b);
  const current = state.mainBead && tram.some((b) => b.slug === state.mainBead!.slug) ? state.mainBead : tram[0];

  const [wraps, setWraps] = useState(state.wraps);
  const [slug, setSlug] = useState(current?.slug ?? "");
  // Vòng đổi từ chỗ khác (hoàn tác, form điện thoại) thì hàng cài đặt theo vòng
  useEffect(() => {
    setWraps(state.wraps);
    if (current) setSlug(current.slug);
  }, [state.wraps, current?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const bead = tram.find((b) => b.slug === slug);
  const size = bead?.sizeMm ?? sizes[0];
  const ofSize = tram.filter((b) => b.sizeMm === size);
  const changed = wraps !== state.wraps || slug !== current?.slug;

  function pickSize(next: number) {
    const list = tram.filter((b) => b.sizeMm === next);
    const same = list.find((b) => b.material === bead?.material && b.stock > 0) ?? list.find((b) => b.stock > 0) ?? list[0];
    if (same) setSlug(same.slug);
  }

  return (
    <section id="cai-dat-vong" tabIndex={-1} aria-labelledby="cai-dat-vong-tieu-de" className="mb-6 rounded-3xl bg-surface p-4 focus:outline-none">
      <h2 id="cai-dat-vong-tieu-de" className="sr-only">
        Cài đặt vòng
      </h2>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <BarGroup label="Loại vòng">
          <label className={segmentOption}>
            <input type="radio" name="bar-loai-vong" checked={wraps === 1} onChange={() => setWraps(1)} className="sr-only" />
            Vòng đơn
          </label>
          {rules.mala.wraps.map((n) => (
            <label key={n} className={segmentOption}>
              <input type="radio" name="bar-loai-vong" checked={wraps === n} onChange={() => setWraps(n)} className="sr-only" />
              {rules.mala.beads} hạt · quấn {n} vòng
            </label>
          ))}
        </BarGroup>
        <BarGroup label="Cỡ hạt">
          {sizes.map((s) => (
            <label key={s} className={`${segmentOption} tabular-nums`}>
              <input type="radio" name="bar-co-hat" checked={size === s} onChange={() => pickSize(s)} className="sr-only" />
              {s} mm
            </label>
          ))}
        </BarGroup>
        <BarGroup label="Loại trầm">
          {ofSize.map((b) => (
            <label key={b.slug} className={segmentOption} title={b.stock === 0 ? "Hết hàng" : `${formatVnd(b.priceVnd)} / hạt`}>
              <input type="radio" name="bar-loai-tram" checked={slug === b.slug} disabled={b.stock === 0} onChange={() => setSlug(b.slug)} className="sr-only" />
              {b.material}
            </label>
          ))}
        </BarGroup>
        <div className="ml-auto flex items-center gap-3">
          {changed && <p className="text-sm text-ink-3">Các hạt đang xếp sẽ được thay.</p>}
          <Button variant="outline" disabled={!changed || !bead} onClick={() => bead && state.setup({ wraps, slug, wrist: state.wristCm, fitId: state.fit })}>
            Dựng lại vòng
          </Button>
        </div>
      </div>
    </section>
  );
}

function BarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-xs tracking-widest text-ink-3 uppercase">{label}</legend>
      <div className="flex flex-wrap gap-1 rounded-lg bg-paper-2 p-1">{children}</div>
    </fieldset>
  );
}

function StepTitle({ ref, n, title }: { ref: React.Ref<HTMLHeadingElement>; n: number; title: string }) {
  return (
    <h3 ref={ref} tabIndex={-1} className="font-serif text-[clamp(26px,3vw,32px)] leading-tight focus:outline-none">
      <span className="sr-only">Bước {n}. </span>
      {title}
    </h3>
  );
}

function BeadThumb({ bead }: { bead: Bead }) {
  return bead.texture?.thumb ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/bead-textures/${bead.texture.id}/thumb?v=${bead.texture.version}`} alt="" width={44} height={44} loading="lazy" decoding="async" className="size-11 flex-none" />
  ) : (
    <span aria-hidden className="size-9 flex-none rounded-full shadow-e1" style={{ background: bead.color }} />
  );
}
