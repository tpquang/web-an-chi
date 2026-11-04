"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import type { Bead, BraceletRules } from "@/lib/api";
import { cart } from "@/lib/cart";
import { cartHref } from "@/lib/links";
import { formatVnd } from "@/lib/site";
import { MinusIcon, PlusIcon } from "../icons";
import { Button } from "../ui/button";
import { Checkbox, Field, Input, Textarea } from "../ui/field";
import { showToast } from "../ui/toast";
import type { SceneHandle, SceneItem } from "./bracelet-scene";

// three.js chỉ nạp ở trang này và sau khi có trình duyệt
const BraceletScene = dynamic(() => import("./bracelet-scene").then((m) => m.BraceletScene), {
  ssr: false,
  loading: () => <p className="flex size-full items-center justify-center text-sm text-ink-3">Đang dựng vòng 3D…</p>,
});

type Props = { rules: BraceletRules; beads: Bead[] };

// Vòng vừa khi chiều dài lệch không quá khoảng này so với cỡ cần
const FIT_TOLERANCE_MM = 5;

// Mỗi hạt trên vòng có key riêng để cảnh 3D biết hạt nào trượt đi đâu
type RingItem = { key: number; slug: string };
let nextKey = 0;
const ringItem = (slug: string): RingItem => ({ key: ++nextKey, slug });

// Ngón tay che mất chip nên trên cảm ứng chip nằm phía trên ngón tay
const chipTransform = (x: number, y: number, touch: boolean) => (touch ? `translate3d(${x - 40}px, ${y - 64}px, 0)` : `translate3d(${x + 12}px, ${y + 12}px, 0)`);

const cm = (mm: number) => (mm / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });

export function BraceletDesigner({ rules, beads }: Props) {
  const bySlug = useMemo(() => new Map(beads.map((bead) => [bead.slug, bead])), [beads]);
  const materials = useMemo(() => [...new Set(beads.map((bead) => bead.material))], [beads]);
  const firstBead = beads.find((bead) => bead.kind === "BEAD");

  const [ring, setRing] = useState<RingItem[]>(() => (firstBead ? Array.from({ length: 17 }, () => ringItem(firstBead.slug)) : []));
  const [selected, setSelected] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [wristCm, setWristCm] = useState(16);
  const [fit, setFit] = useState(rules.fits[1]?.id ?? rules.fits[0].id);
  const [cord, setCord] = useState(rules.cords[0].id);
  const [engraving, setEngraving] = useState("");
  const [giftBox, setGiftBox] = useState(false);
  const [cardOn, setCardOn] = useState(false);
  const [card, setCard] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  // Chip đi theo con trỏ khi kéo hạt từ kho; vào khung 3D thì chip mờ đi, nhường cho hạt 3D
  const [dragging, setDragging] = useState<{ bead: Bead; over: boolean } | null>(null);
  const chip = useRef<HTMLDivElement>(null);
  const chipAt = useRef({ x: 0, y: 0, touch: false });
  const scene = useRef<SceneHandle>(null);

  const sceneItems = useMemo<SceneItem[]>(
    () => ring.flatMap(({ key, slug }) => (bySlug.has(slug) ? [{ key, bead: bySlug.get(slug)! }] : [])),
    [ring, bySlug],
  );
  const ringBeads = useMemo(() => sceneItems.map((item) => item.bead), [sceneItems]);
  const lengthMm = ringBeads.reduce((sum, bead) => sum + bead.sizeMm, 0);
  const easeCm = rules.fits.find((f) => f.id === fit)?.easeCm ?? 1.5;
  const targetMm = Math.round((wristCm + easeCm) * 10);
  const diff = lengthMm - targetMm;
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const { slug } of ring) map.set(slug, (map.get(slug) ?? 0) + 1);
    return map;
  }, [ring]);

  const { extras } = rules;
  const beadsVnd = ringBeads.reduce((sum, bead) => sum + bead.priceVnd, 0);
  const extrasVnd =
    (engraving.trim() ? extras.engraving.priceVnd : 0) +
    (giftBox ? extras.giftBox.priceVnd : 0) +
    (cardOn && card.trim() ? extras.card.priceVnd : 0) +
    (giftWrap ? extras.giftWrap.priceVnd : 0);
  const totalVnd = beadsVnd + rules.feeVnd + extrasVnd;

  const needsEngraving = ringBeads.some((bead) => bead.slug.startsWith("hat-chu"));
  const outOfStock = [...counts].find(([slug, count]) => (bySlug.get(slug)?.stock ?? 0) < count);
  const problem =
    ring.length < rules.minBeads ? `Vòng cần ít nhất ${rules.minBeads} hạt.`
    : lengthMm > rules.maxLengthMm ? `Vòng dài tối đa ${cm(rules.maxLengthMm)} cm. Bạn bớt hạt hoặc chọn hạt nhỏ hơn.`
    : diff < -FIT_TOLERANCE_MM ? `Còn thiếu ${cm(-diff)} cm để vừa cổ tay ${wristCm.toLocaleString("vi-VN")} cm.`
    : diff > FIT_TOLERANCE_MM ? `Vòng đang dư ${cm(diff)} cm. Bạn bớt hạt hoặc đổi kiểu đeo.`
    : outOfStock ? `Shop chỉ còn ${bySlug.get(outOfStock[0])?.stock} hạt ${bySlug.get(outOfStock[0])?.name}.`
    : needsEngraving && !engraving.trim() ? "Vòng có hạt chữ, bạn nhập chữ cần khắc."
    : null;

  function insert(slug: string, at?: number) {
    if (ring.length >= rules.maxBeads) {
      showToast({ type: "error", title: "Đã đủ số hạt tối đa", desc: `Một vòng có tối đa ${rules.maxBeads} hạt.` });
      return;
    }
    const index = at ?? (selected !== null ? selected + 1 : ring.length);
    setRing((current) => [...current.slice(0, index), ringItem(slug), ...current.slice(index)]);
    setSelected(index);
  }

  function move(from: number, to: number) {
    setRing((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to > from ? to - 1 : to, 0, item);
      setSelected(to > from ? to - 1 : to);
      return next;
    });
  }

  function removeAt(index: number) {
    setRing((current) => current.filter((_, i) => i !== index));
    setSelected(ring.length > 1 ? Math.min(index, ring.length - 2) : null);
  }

  function replaceAt(index: number, slug: string) {
    setRing((current) => current.map((item, i) => (i === index ? { ...item, slug } : item)));
  }

  // Lấp đầy bằng hạt chính cho tới khi vừa cỡ tay, giữ nguyên các charm đã đặt
  function autoFill() {
    const main = ringBeads.filter((bead) => bead.kind === "BEAD").sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0))[0] ?? firstBead;
    if (!main) return;
    const next = [...ring];
    let length = lengthMm;
    while (length + main.sizeMm / 2 < targetMm && next.length < rules.maxBeads) {
      next.push(ringItem(main.slug));
      length += main.sizeMm;
    }
    while (length - main.sizeMm / 2 > targetMm) {
      const index = next.findLastIndex((item) => item.slug === main.slug);
      if (index === -1) break;
      next.splice(index, 1);
      length -= main.sizeMm;
    }
    setRing(next);
  }

  // Kéo hạt từ kho thả vào vòng; chạm không kéo thì thêm vào sau hạt đang chọn
  function startDrag(bead: Bead, event: React.PointerEvent) {
    if (bead.stock === 0 || event.button !== 0) return;
    const start = { x: event.clientX, y: event.clientY };
    let moved = false;
    let over = false;
    const onMove = (e: PointerEvent) => {
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
      chipAt.current = { x: e.clientX, y: e.clientY, touch: e.pointerType === "touch" };
      if (chip.current) chip.current.style.transform = chipTransform(e.clientX, e.clientY, e.pointerType === "touch");
      const inside = scene.current?.dragOver(bead, e.clientX, e.clientY, e.pointerType === "touch") ?? false;
      if (!moved || inside !== over) setDragging({ bead, over: inside });
      moved = true;
      over = inside;
    };
    const onUp = (e: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setDragging(null);
      // pointercancel khi chưa kéo nghĩa là trình duyệt đang cuộn dải hạt, không phải chạm để thêm
      if (!moved) return void (e.type === "pointerup" && insert(bead.slug));
      const at = e.type === "pointerup" ? scene.current?.drop(e.clientX, e.clientY, e.pointerType === "touch") : null;
      scene.current?.dragOver(null, 0, 0);
      if (at !== null && at !== undefined) insert(bead.slug, at);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function onSceneKey(event: React.KeyboardEvent) {
    if (!ring.length) return;
    const current = selected ?? 0;
    const last = ring.length - 1;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      const target = (current + step + ring.length) % ring.length;
      if (event.shiftKey && selected !== null) move(current, step > 0 ? Math.min(target + 1, ring.length) : target);
      else setSelected(target);
    } else if ((event.key === "Delete" || event.key === "Backspace") && selected !== null) {
      event.preventDefault();
      removeAt(Math.min(selected, last));
    } else if (event.key === "Escape") setSelected(null);
  }

  function addToCart() {
    if (problem) return;
    cart.addBracelet({
      beads: ring.map((item) => item.slug),
      cord,
      fit,
      wristCm,
      engraving: engraving.trim() || undefined,
      giftBox,
      card: cardOn ? card.trim() || undefined : undefined,
      giftWrap,
    });
    showToast({ title: "Đã thêm vòng vào giỏ", desc: "Bạn có thể đặt hàng hoặc thiết kế thêm vòng khác.", action: { href: cartHref, label: "Xem giỏ hàng" } });
  }

  const shown = filter === "all" ? beads : beads.filter((bead) => bead.material === filter);
  const selectedBead = selected !== null ? ringBeads[selected] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-x-6 lg:gap-y-8">
      {/* Điện thoại: vòng 3D và kho hạt cùng dính đầu màn hình để kéo thẳng hạt vào vòng. Máy tính: hai cột. */}
      <div className="sticky top-[calc(var(--header-h)+env(safe-area-inset-top))] z-(--z-sticky) -mx-(--page-gutter) flex flex-col gap-3 border-b border-line bg-paper px-(--page-gutter) pt-2 pb-3 lg:contents">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:col-span-7 lg:row-span-3 lg:self-start">
          <div
            tabIndex={0}
            onKeyDown={onSceneKey}
            aria-describedby="huong-dan-vong"
            className="relative h-[44svh] max-h-[calc(100vw-2*var(--page-gutter))] min-h-64 w-full overflow-hidden rounded-xl border border-line bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wood lg:aspect-square lg:h-auto lg:max-h-[70vh]"
          >
            <BraceletScene
              ref={scene}
              items={sceneItems}
              selected={selected}
              onSelect={setSelected}
              onMove={move}
              onRemove={removeAt}
              label={`Vòng ${ring.length} hạt, dài ${cm(lengthMm)} cm`}
            />
            <dl className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-2 text-sm">
              <div className="rounded-full bg-surface/90 px-3 py-1 shadow-e1">
                <dt className="sr-only">Số hạt</dt>
                <dd className="tabular-nums">{ring.length} hạt</dd>
              </div>
              <div className="rounded-full bg-surface/90 px-3 py-1 shadow-e1">
                <dt className="sr-only">Chiều dài</dt>
                <dd className="tabular-nums">{cm(lengthMm)} cm</dd>
              </div>
            </dl>

            {/* Thanh hạt đang chọn nổi ở đáy khung để khung không đổi cao khi chọn hạt */}
            {selectedBead && selected !== null && (
              <div className="absolute inset-x-2 bottom-2 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface/95 p-2 shadow-e2">
                <span className="size-5 flex-none rounded-full border border-line" style={{ background: selectedBead.color }} aria-hidden />
                <p className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-medium">Hạt {selected + 1}:</span> {selectedBead.name}
                </p>
                <select
                  aria-label="Đổi sang hạt khác"
                  value={selectedBead.slug}
                  onChange={(e) => replaceAt(selected, e.target.value)}
                  className="hidden min-h-11 max-w-44 rounded-md border border-line-strong bg-surface px-2 text-sm sm:block"
                >
                  {beads.map((bead) => (
                    <option key={bead.slug} value={bead.slug} disabled={bead.stock === 0}>
                      {bead.name}
                    </option>
                  ))}
                </select>
                <Button variant="secondary" size="sm" onClick={() => insert(selectedBead.slug, selected + 1)}>
                  Nhân đôi
                </Button>
                <Button variant="secondary" size="sm" onClick={() => removeAt(selected)}>
                  Xoá
                </Button>
              </div>
            )}
          </div>
        </div>

        <section aria-labelledby="kho-hat" className="flex min-w-0 flex-col gap-2 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:gap-4">
          <h2 id="kho-hat" className="sr-only font-serif text-2xl font-semibold lg:not-sr-only">
            1. Chọn hạt
          </h2>
          <div
            className="-mx-(--page-gutter) flex gap-2 overflow-x-auto px-(--page-gutter) [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0"
            role="group"
            aria-label="Lọc theo chất liệu"
          >
            {["all", ...materials].map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={filter === m}
                onClick={() => setFilter(m)}
                className="min-h-9 flex-none rounded-full border border-line-strong px-3 text-sm whitespace-nowrap transition-colors duration-(--d-fast) hover:border-wood aria-pressed:border-wood aria-pressed:bg-wood-soft aria-pressed:text-wood"
              >
                {m === "all" ? "Tất cả" : m}
              </button>
            ))}
          </div>
          {/* Điện thoại: vuốt ngang để xem thêm hạt, kéo hạt lên để thả vào vòng */}
          <ul className="-mx-(--page-gutter) flex snap-x gap-2 overflow-x-auto px-(--page-gutter) [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
            {shown.map((bead) => (
              <li key={bead.slug} className="w-28 flex-none snap-start lg:w-auto">
                <button
                  type="button"
                  onPointerDown={(e) => startDrag(bead, e)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), insert(bead.slug))}
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={bead.stock === 0}
                  title={bead.note ?? undefined}
                  className="flex h-full w-full touch-pan-x flex-col items-start gap-1.5 rounded-lg border border-line bg-surface p-2.5 text-left transition-colors duration-(--d-fast) select-none [-webkit-touch-callout:none] hover:border-wood disabled:cursor-not-allowed disabled:opacity-50 lg:touch-none lg:gap-2 lg:p-3"
                >
                  <span
                    aria-hidden
                    className="rounded-full shadow-e1"
                    style={{ background: bead.color, width: `${Math.max(14, bead.sizeMm * 2.4)}px`, height: `${Math.max(14, bead.sizeMm * 2.4)}px` }}
                  />
                  <span className="line-clamp-2 text-sm leading-tight font-medium">{bead.name}</span>
                  <span className="text-xs text-ink-3 tabular-nums">
                    {bead.stock === 0 ? "Hết hàng" : `${formatVnd(bead.priceVnd)} / hạt`}
                    {counts.get(bead.slug) ? ` · dùng ${counts.get(bead.slug)}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="flex flex-col gap-3 lg:col-span-5 lg:col-start-8 lg:row-start-2">
        <p id="huong-dan-vong" className="text-sm text-ink-3">
          <span className="lg:hidden">
            Kéo hạt từ kho lên vòng, hoặc chạm hạt để thêm sau hạt đang chọn. Giữ hạt trên vòng để gắp: thả vào khe khác để đổi chỗ, kéo ra xa vòng để bỏ. Vuốt chỗ
            trống để xoay, chụm hai ngón để phóng to.
          </span>
          <span className="hidden lg:inline">
            Kéo hạt từ kho thả vào vòng, hoặc bấm hạt để thêm sau hạt đang chọn. Gắp hạt trên vòng thả vào khe khác để đổi chỗ, kéo ra xa vòng để bỏ hạt. Kéo chỗ
            trống để xoay. Bàn phím: mũi tên để chọn, Shift + mũi tên để dời hạt, Delete để xoá.
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={autoFill} disabled={!ring.length && !firstBead}>
            Tự thêm hạt cho vừa tay
          </Button>
          <Button variant="text" size="sm" onClick={() => (setRing([]), setSelected(null))} disabled={!ring.length}>
            Xoá hết hạt
          </Button>
        </div>
      </div>

      {/* Cột phải: cỡ tay, dịch vụ, giá */}
      <div className="flex flex-col gap-8 lg:col-span-5 lg:col-start-8 lg:row-start-3">
        <section aria-labelledby="co-tay" className="flex flex-col gap-4">
          <h2 id="co-tay" className="font-serif text-2xl font-semibold">
            2. Cỡ tay và dây
          </h2>
          <Field label="Chu vi cổ tay" hint={`Đo sát cổ tay bằng thước dây, từ ${rules.wristCm.min} đến ${rules.wristCm.max} cm.`}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Giảm 0,5 cm"
                onClick={() => setWristCm((v) => Math.max(rules.wristCm.min, v - 0.5))}
                className="inline-flex size-11 items-center justify-center rounded-md border border-line-strong hover:border-wood"
              >
                <MinusIcon />
              </button>
              <Input
                type="number"
                inputMode="decimal"
                step={0.5}
                min={rules.wristCm.min}
                max={rules.wristCm.max}
                value={wristCm}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) setWristCm(Math.min(rules.wristCm.max, Math.max(rules.wristCm.min, v)));
                }}
                className="w-24 text-center tabular-nums"
                aria-label="Chu vi cổ tay, đơn vị cm"
              />
              <button
                type="button"
                aria-label="Tăng 0,5 cm"
                onClick={() => setWristCm((v) => Math.min(rules.wristCm.max, v + 0.5))}
                className="inline-flex size-11 items-center justify-center rounded-md border border-line-strong hover:border-wood"
              >
                <PlusIcon />
              </button>
              <span className="text-ink-2">cm</span>
            </div>
          </Field>
          <Choice label="Kiểu đeo" name="fit" value={fit} onChange={setFit} options={rules.fits.map((f) => ({ value: f.id, label: f.name, desc: `Vòng dài hơn cổ tay ${f.easeCm.toLocaleString("vi-VN")} cm` }))} />
          <Choice label="Loại dây" name="cord" value={cord} onChange={setCord} options={rules.cords.map((c) => ({ value: c.id, label: c.name }))} />
        </section>

        <section aria-labelledby="dich-vu" className="flex flex-col gap-4">
          <h2 id="dich-vu" className="font-serif text-2xl font-semibold">
            3. Dịch vụ thêm
          </h2>
          <Field
            label={`${extras.engraving.name} (+${formatVnd(extras.engraving.priceVnd)})`}
            optional={!needsEngraving}
            hint={`Tối đa ${extras.engraving.maxLength} ký tự.${needsEngraving ? " Vòng có hạt chữ nên cần nhập." : ""}`}
          >
            <Input value={engraving} onChange={(e) => setEngraving(e.target.value)} maxLength={extras.engraving.maxLength} placeholder="VD: An Nhiên" />
          </Field>
          <Checkbox label={`${extras.giftBox.name} (+${formatVnd(extras.giftBox.priceVnd)})`} checked={giftBox} onChange={(e) => setGiftBox(e.target.checked)} />
          <Checkbox label={`${extras.card.name} (+${formatVnd(extras.card.priceVnd)})`} checked={cardOn} onChange={(e) => setCardOn(e.target.checked)} />
          {cardOn && (
            <Field label="Lời nhắn trên thiệp" hint={`Tối đa ${extras.card.maxLength} ký tự.`}>
              <Textarea value={card} onChange={(e) => setCard(e.target.value)} maxLength={extras.card.maxLength} placeholder="VD: Chúc mẹ luôn khoẻ" />
            </Field>
          )}
          <Checkbox
            label={`${extras.giftWrap.name} (${extras.giftWrap.priceVnd ? `+${formatVnd(extras.giftWrap.priceVnd)}` : "miễn phí"})`}
            checked={giftWrap}
            onChange={(e) => setGiftWrap(e.target.checked)}
          />
        </section>

        <section aria-labelledby="tong" className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
          <h2 id="tong" className="font-serif text-2xl font-semibold">
            Tổng cộng
          </h2>
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm tabular-nums">
            <dt className="text-ink-2">{ring.length} hạt và charm</dt>
            <dd className="text-right">{formatVnd(beadsVnd)}</dd>
            {rules.feeVnd > 0 && (
              <>
                <dt className="text-ink-2">Công xâu vòng</dt>
                <dd className="text-right">{formatVnd(rules.feeVnd)}</dd>
              </>
            )}
            {extrasVnd > 0 && (
              <>
                <dt className="text-ink-2">Dịch vụ thêm</dt>
                <dd className="text-right">{formatVnd(extrasVnd)}</dd>
              </>
            )}
            <dt className="text-ink-2">Chiều dài vòng / cần</dt>
            <dd className="text-right">
              {cm(lengthMm)} / {cm(targetMm)} cm
            </dd>
          </dl>
          <p className="flex items-baseline justify-between border-t border-line pt-3">
            <span>Giá vòng</span>
            <span className="font-serif text-[28px] font-semibold lining-nums tabular-nums">{formatVnd(totalVnd)}</span>
          </p>
          <p role="status" className={`text-sm ${problem ? "text-err" : "text-ok"}`}>
            {problem ?? "Vòng đã vừa cỡ tay."}
          </p>
          <Button size="lg" block onClick={addToCart} disabled={problem !== null}>
            Thêm vào giỏ
          </Button>
          <p className="text-sm text-ink-3">{rules.leadTime}. Phí giao hàng tính ở bước thanh toán.</p>
        </section>
      </div>

      {dragging && (
        <div
          ref={chip}
          aria-hidden
          className={`pointer-events-none fixed top-0 left-0 z-(--z-popover) flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-sm shadow-e3 transition-opacity ${
            dragging.over ? "opacity-0 duration-(--d-fast) ease-(--ease-exit)" : "opacity-100 duration-(--d-base) ease-(--ease-out)"
          }`}
          style={{ transform: chipTransform(chipAt.current.x, chipAt.current.y, chipAt.current.touch) }}
        >
          <span className="size-4 rounded-full" style={{ background: dragging.bead.color }} />
          {dragging.bead.name}
        </div>
      )}
      {ring.length === 0 && (
        <p className="sr-only" role="status">
          Vòng đang trống.
        </p>
      )}
    </div>
  );
}

function Choice({ label, name, value, onChange, options }: { label: string; name: string; value: string; onChange(v: string): void; options: { value: string; label: string; desc?: string }[] }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            title={o.desc}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-line-strong bg-surface px-3 has-checked:border-wood has-checked:bg-wood-soft has-focus-visible:outline-2 has-focus-visible:outline-wood"
          >
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="accent-(--wood)" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
