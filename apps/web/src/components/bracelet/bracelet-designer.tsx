"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Bead, BraceletRules } from "@/lib/api";
import { cm } from "@/lib/bracelet";
import { formatVnd } from "@/lib/site";
import { CloseIcon, ResetIcon, SpinIcon, UndoIcon } from "../icons";
import { Button, buttonClass } from "../ui/button";
import { BeadPicker } from "./bead-picker";
import { BraceletOptions } from "./bracelet-options";
import { BraceletSummary, WristSize } from "./bracelet-summary";
import type { SceneHandle } from "./bracelet-scene";
import { useBracelet } from "./use-bracelet";

// three.js chỉ nạp ở trang này và sau khi có trình duyệt
const BraceletScene = dynamic(
  () => import("./bracelet-scene").then((m) => m.BraceletScene),
  {
    ssr: false,
    loading: () => (
      <p className="flex size-full items-center justify-center text-sm text-ink-3">
        Đang dựng vòng 3D…
      </p>
    ),
  },
);

// Ngón tay che mất chip nên trên cảm ứng chip nằm phía trên ngón tay
const chipTransform = (x: number, y: number, touch: boolean) =>
  touch
    ? `translate3d(${x - 40}px, ${y - 64}px, 0)`
    : `translate3d(${x + 12}px, ${y + 12}px, 0)`;

const desktop = "(min-width: 960px)";
const SHEET_HASH = "#thiet-ke";
const intro = [
  "Chọn loại trầm và cỡ hạt, vòng tự đủ số hạt theo cổ tay.",
  "Kéo thêm charm bạc, vàng hoặc hạt đá vào đúng chỗ bạn muốn.",
  "Xem giá ngay, shop xâu vòng theo đúng thứ tự bạn đặt.",
];
const action =
  "inline-flex size-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface/90 text-ink transition-colors duration-(--d-fast) hover:border-wood disabled:opacity-50 aria-pressed:border-wood aria-pressed:text-wood lg:size-auto lg:min-h-11 lg:bg-transparent lg:px-5";

export function BraceletDesigner({
  rules,
  beads,
}: {
  rules: BraceletRules;
  beads: Bead[];
}) {
  const state = useBracelet(rules, beads);
  const {
    ring,
    sceneItems,
    selected,
    setSelected,
    ringBeads,
    lengthMm,
    mainBead,
    totalVnd,
    problem,
  } = state;

  // Điện thoại: thiết kế trong sheet toàn màn hình trượt từ đáy lên. Máy tính: ba cột ngay trong trang
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [spinning, setSpinning] = useState(false);
  // Chip đi theo con trỏ khi kéo hạt từ kho; vào khung 3D thì chip mờ đi, nhường cho hạt 3D
  const [dragging, setDragging] = useState<{
    bead: Bead;
    over: boolean;
  } | null>(null);
  const chip = useRef<HTMLDivElement>(null);
  const chipAt = useRef({ x: 0, y: 0, touch: false });
  const scene = useRef<SceneHandle>(null);

  const opener = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);

  // Sheet mở thì có #thiet-ke trên URL, để nút Back của điện thoại đóng sheet thay vì rời trang
  useEffect(() => {
    const sync = () => setOpen(window.location.hash === SHEET_HASH);
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  // Sheet che cả trang nên khoá cuộn trang phía sau, chỉ trên điện thoại khi sheet mở
  useEffect(() => {
    const mq = window.matchMedia(desktop);
    const lock = () => {
      setIsDesktop(mq.matches);
      document.documentElement.style.overflow =
        open && !mq.matches ? "hidden" : "";
    };
    lock();
    mq.addEventListener("change", lock);
    if (open && !mq.matches) closer.current?.focus();
    return () => {
      mq.removeEventListener("change", lock);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  function openSheet() {
    window.history.pushState(null, "", SHEET_HASH);
    setOpen(true);
  }

  function close() {
    if (window.location.hash === SHEET_HASH) window.history.back();
    setOpen(false);
    opener.current?.focus();
  }

  function onBeadPointer(
    bead: Bead,
    event: React.PointerEvent,
    onTap: () => void,
  ) {
    if (bead.stock === 0 || event.button !== 0) return;
    const start = { x: event.clientX, y: event.clientY };
    let moved = false;
    let over = false;
    const onMove = (e: PointerEvent) => {
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6)
        return;
      chipAt.current = {
        x: e.clientX,
        y: e.clientY,
        touch: e.pointerType === "touch",
      };
      if (chip.current)
        chip.current.style.transform = chipTransform(
          e.clientX,
          e.clientY,
          e.pointerType === "touch",
        );
      const inside =
        scene.current?.dragOver(
          bead,
          e.clientX,
          e.clientY,
          e.pointerType === "touch",
        ) ?? false;
      if (!moved || inside !== over) setDragging({ bead, over: inside });
      moved = true;
      over = inside;
    };
    const onUp = (e: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setDragging(null);
      // pointercancel khi chưa kéo nghĩa là trình duyệt đang cuộn dải hạt, không phải chạm
      if (!moved) return void (e.type === "pointerup" && onTap());
      const at =
        e.type === "pointerup"
          ? scene.current?.drop(e.clientX, e.clientY, e.pointerType === "touch")
          : null;
      scene.current?.dragOver(null, 0, 0);
      if (at !== null && at !== undefined) state.insert(bead.slug, at);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function onSceneKey(event: React.KeyboardEvent) {
    if (!ring.length) return;
    const current = selected ?? 0;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      const target = (current + step + ring.length) % ring.length;
      if (event.shiftKey && selected !== null)
        state.move(
          current,
          step > 0 ? Math.min(target + 1, ring.length) : target,
        );
      else setSelected(target);
    } else if (
      (event.key === "Delete" || event.key === "Backspace") &&
      selected !== null
    ) {
      event.preventDefault();
      state.removeAt(Math.min(selected, ring.length - 1));
    } else if (event.key === "Escape") setSelected(null);
  }

  const selectedBead = selected !== null ? ringBeads[selected] : null;

  return (
    <>
      {/* Điện thoại: trang giới thiệu ngắn, bấm nút mới mở sheet thiết kế */}
      <div className="flex flex-col gap-6 lg:hidden">
        <ol className="flex flex-col gap-3 text-ink-2">
          {intro.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span
                aria-hidden
                className="inline-flex size-7 flex-none items-center justify-center rounded-full bg-wood-soft text-sm font-semibold text-wood"
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <button ref={opener} type="button" onClick={openSheet} aria-expanded={open} className={buttonClass({ size: "lg", block: true })}>
          Bắt đầu thiết kế vòng
        </button>
      </div>
      <div
        inert={!isDesktop && !open}
        onKeyDown={(e) => e.key === "Escape" && !isDesktop && open && close()}
        className={`fixed inset-0 z-(--z-modal) flex flex-col bg-paper pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-transform motion-reduce:transition-none lg:static lg:z-auto lg:grid lg:translate-y-0 lg:grid-cols-12 lg:gap-6 lg:bg-transparent lg:p-0 lg:transition-none ${
          open
            ? "translate-y-0 duration-(--d-sheet) ease-(--ease-ios)"
            : "translate-y-full duration-(--d-slow) ease-(--ease-exit)"
        }`}
      >
        {/* Thanh trên của sheet điện thoại: đóng, giá, thêm vào giỏ */}
        <div className="flex items-center gap-3 border-b border-line px-(--page-gutter) py-2 lg:hidden">
          <button
            ref={closer}
            type="button"
            onClick={close}
            aria-label="Đóng thiết kế vòng"
            className="-ml-2 inline-flex size-11 items-center justify-center rounded-md"
          >
            <CloseIcon size={24} />
          </button>
          <p
            className="ml-auto text-right text-xs text-ink-3"
            aria-live="polite"
          >
            Tạm tính
            <span className="block font-serif text-lg font-semibold text-wood tabular-nums">
              {formatVnd(totalVnd)}
            </span>
          </p>
          <Button onClick={state.addToCart} className="rounded-full">
            Thêm vào giỏ
          </Button>
        </div>
        <div className="flex flex-col gap-2 px-(--page-gutter) pt-3 lg:hidden">
          <WristSize state={state} compact />
          <p
            role="status"
            className={`text-xs ${problem ? "text-err" : "text-ok"}`}
          >
            {problem ?? "Vòng đã vừa cỡ tay."}
          </p>
        </div>

        {/* Kho hạt: đáy sheet trên điện thoại, cột trái trên máy tính */}
        <div className="order-last rounded-t-2xl border-t border-line bg-surface px-(--page-gutter) pt-4 pb-3 lg:order-none lg:col-span-3 lg:self-start lg:rounded-xl lg:border lg:p-5">
          <BeadPicker
            state={state}
            onBeadPointer={onBeadPointer}
            options={<BraceletOptions state={state} />}
          />
        </div>

        {/* Vòng 3D ở giữa */}
        <div className="relative flex min-h-0 flex-1 flex-col gap-4 lg:col-span-5 lg:self-start">
          <div
            tabIndex={0}
            onKeyDown={onSceneKey}
            aria-describedby="huong-dan-vong"
            className="relative min-h-0 flex-1 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wood lg:aspect-square lg:max-h-[70vh] lg:w-full lg:flex-none lg:rounded-xl lg:border lg:border-line lg:bg-paper-2"
          >
            <BraceletScene
              ref={scene}
              items={sceneItems}
              selected={selected}
              onSelect={setSelected}
              onMove={state.move}
              onRemove={state.removeAt}
              label={`Vòng ${ring.length} hạt, dài ${cm(lengthMm)} cm`}
            />
            {/* Số hạt góc trái, cỡ hạt và chiều dài góc phải, để giữa vòng trống cho hạt */}
            <dl className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 text-sm tabular-nums">
              <div className="rounded-full bg-surface/90 px-3 py-1 shadow-e1">
                <dt className="sr-only">Số hạt</dt>
                <dd>
                  <span className="font-semibold text-wood">{ring.length}</span>{" "}
                  hạt
                </dd>
              </div>
              <div className="rounded-full bg-surface/90 px-3 py-1 shadow-e1">
                <dt className="sr-only">Cỡ hạt và chiều dài</dt>
                <dd>
                  {mainBead ? `${mainBead.sizeMm} mm · ` : ""}
                  {cm(lengthMm)} cm
                </dd>
              </div>
            </dl>

            {/* Thanh hạt đang chọn nổi ở đáy khung để khung không đổi cao khi chọn hạt */}
            {selectedBead && selected !== null && (
              <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-lg border border-line bg-surface/95 p-2 shadow-e2">
                <span
                  className="size-5 flex-none rounded-full border border-line"
                  style={{ background: selectedBead.color }}
                  aria-hidden
                />
                <p className="min-w-0 flex-1 truncate text-sm">
                  <span className="font-medium">Hạt {selected + 1}:</span>{" "}
                  {selectedBead.name}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => state.insert(selectedBead.slug, selected + 1)}
                >
                  Nhân đôi
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => state.removeAt(selected)}
                >
                  Xoá
                </Button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  aria-label="Bỏ chọn hạt"
                  className="-my-1 -mr-1 inline-flex size-11 flex-none items-center justify-center rounded-md text-ink-3 hover:bg-paper-2 hover:text-ink"
                >
                  <CloseIcon />
                </button>
              </div>
            )}
          </div>

          {/* Điện thoại: hàng nút tròn ở trên khung, ngay dưới hai nhãn số hạt. Máy tính: hàng nút có chữ dưới vòng */}
          <div className="absolute top-14 left-1/2 flex -translate-x-1/2 gap-3 lg:static lg:translate-x-0 lg:justify-center lg:gap-3">
            <button
              type="button"
              onClick={state.undo}
              disabled={!state.canUndo}
              className={action}
            >
              <UndoIcon />
              <span className="sr-only lg:not-sr-only">Hoàn tác</span>
            </button>
            <button
              type="button"
              aria-pressed={spinning}
              onClick={() => setSpinning(scene.current?.spin() ?? false)}
              className={action}
            >
              <SpinIcon />
              <span className="sr-only lg:not-sr-only">Xoay vòng</span>
            </button>
            <button type="button" onClick={state.reset} className={action}>
              <ResetIcon />
              <span className="sr-only lg:not-sr-only">Làm mới</span>
            </button>
          </div>
          <p
            id="huong-dan-vong"
            className="sr-only lg:not-sr-only lg:text-center lg:text-sm lg:text-ink-3"
          >
            Chọn loại trầm để đổi cả vòng, kéo hạt hoặc charm thả vào vị trí
            trên vòng. Gắp hạt trên vòng kéo ra xa để bỏ, kéo chỗ trống để xoay.
            Bàn phím: mũi tên để chọn hạt, Shift + mũi tên để dời, Delete để
            xoá.
          </p>
        </div>

        {/* Cột phải trên máy tính: cỡ tay, tóm tắt, giá */}
        <div className="hidden lg:col-span-4 lg:block lg:self-start">
          <BraceletSummary state={state} />
        </div>

        {dragging && (
          <div
            ref={chip}
            aria-hidden
            className={`pointer-events-none fixed top-0 left-0 z-(--z-popover) flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-sm shadow-e3 transition-opacity ${
              dragging.over
                ? "opacity-0 duration-(--d-fast) ease-(--ease-exit)"
                : "opacity-100 duration-(--d-base) ease-(--ease-out)"
            }`}
            style={{
              transform: chipTransform(
                chipAt.current.x,
                chipAt.current.y,
                chipAt.current.touch,
              ),
            }}
          >
            <span
              className="size-4 rounded-full"
              style={{ background: dragging.bead.color }}
            />
            {dragging.bead.name}
          </div>
        )}
      </div>
    </>
  );
}
