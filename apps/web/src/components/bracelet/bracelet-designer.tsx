"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Bead, BraceletRules } from "@/lib/api";
import { cm } from "@/lib/bracelet";
import { launchDateLabel } from "@/lib/launch";
import { formatVnd } from "@/lib/site";
import { CloseIcon, HandIcon, HelpIcon, ResetIcon, SpinIcon, UndoIcon } from "../icons";
import { useLaunch } from "../launch/launch-clock";
import { Button, buttonClass } from "../ui/button";
import { Tag } from "../ui/tag";
import { BeadPicker } from "./bead-picker";
import { BraceletOptions } from "./bracelet-options";
import { BraceletSetup, SetupBar } from "./bracelet-setup";
import { BraceletSummary, EditingNotice, FitStatus, WristSize } from "./bracelet-summary";
import type { SceneHandle } from "./bracelet-scene";
import { type BraceletSetupValues, useBracelet } from "./use-bracelet";

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
const action =
  "inline-flex size-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface/90 text-ink transition-colors duration-(--d-fast) hover:border-wood disabled:opacity-50 aria-pressed:border-wood aria-pressed:text-wood lg:size-auto lg:min-h-11 lg:bg-transparent lg:px-3 lg:text-sm lg:whitespace-nowrap";

export function BraceletDesigner({
  rules,
  beads,
  salesOpen: initialOpen,
  preorder,
}: {
  rules: BraceletRules;
  beads: Bead[];
  // Server tính lúc dựng trang; trước ngày mở bán chỉ cho thử thiết kế, chưa thêm vào giỏ
  salesOpen: boolean;
  // Shop bật nhận đặt chờ ở CMS: trước ngày mở bán thì có nút "Đặt chờ" thay nút lưu vào giỏ
  preorder: boolean;
}) {
  const state = useBracelet(rules, beads);
  const { open: salesOpen } = useLaunch(initialOpen);
  const {
    ring,
    sceneItems,
    selected,
    setSelected,
    ringBeads,
    lengthMm,
    mainBead,
    totalVnd,
  } = state;

  // Điện thoại: thiết kế trong sheet toàn màn hình trượt từ đáy lên. Máy tính: ba cột ngay trong trang
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [spinning, setSpinning] = useState(false);
  // Xem vòng đeo trên bàn tay mẫu, phóng theo cỡ cổ tay khách nhập
  const [onHand, setOnHand] = useState(false);
  // Hướng dẫn trên điện thoại: chỉ hiện khi bấm nút dấu hỏi
  const [help, setHelp] = useState(false);
  const helpButton = useRef<HTMLButtonElement>(null);
  const closeHelp = () => {
    setHelp(false);
    helpButton.current?.focus();
  };
  // Chưa qua form khởi tạo thì chỉ hiện form
  const [configured, setConfigured] = useState(false);
  const configuredRef = useRef(false);
  configuredRef.current = configured;
  // Có bản nháp hoặc đang sửa vòng trong giỏ thì vào thẳng thiết kế
  useEffect(() => {
    if (state.restored) setConfigured(true);
  }, [state.restored]);
  const wristLabel = `${state.wristCm.toLocaleString("vi-VN")} cm`;
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
    // Chưa khởi tạo vòng mà URL có sẵn #thiet-ke thì bỏ hash, không mở sheet
    const sync = () => {
      const hash = window.location.hash === SHEET_HASH;
      if (hash && !configuredRef.current) window.history.replaceState(null, "", window.location.pathname + window.location.search);
      setOpen(hash && configuredRef.current);
    };
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

  function startDesign(values: BraceletSetupValues) {
    state.setup(values);
    setConfigured(true);
    setOnHand(false);
    // Điện thoại vào thẳng sheet thiết kế; máy tính hiện ba cột ngay trong trang
    if (!window.matchMedia(desktop).matches) openSheet();
  }

  function restart() {
    if (window.matchMedia(desktop).matches) {
      const bar = document.getElementById("cai-dat-vong");
      bar?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      bar?.focus({ preventScroll: true });
      return;
    }
    if (window.location.hash === SHEET_HASH) window.history.back();
    setOpen(false);
    setHelp(false);
    setSelected(null);
    setConfigured(false);
  }

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
      {/* Bước đầu: form khởi tạo vòng theo bước, xong mới vào thiết kế (cả điện thoại và máy tính) */}
      {!configured && (
        <div className="lg:hidden">
          <BraceletSetup state={state} onDone={startDesign} />
        </div>
      )}
      <EditingNotice state={state} />
      <div className="hidden lg:block">
        <SetupBar state={state} />
      </div>

      {/* Điện thoại sau khi khởi tạo: tóm tắt vòng, mở lại sheet thiết kế hoặc cài đặt lại */}
      {configured && (
        <div className="flex flex-col gap-3 lg:hidden">
          <p className="text-ink-2">
            {state.wraps > 1 ? `Chuỗi ${ring.length} hạt quấn ${state.wraps} vòng` : `Vòng ${ring.length} hạt`}
            {mainBead ? `, ${mainBead.material} ${mainBead.sizeMm} mm` : ""}, cổ tay {wristLabel}.
          </p>
          <button ref={opener} type="button" onClick={openSheet} aria-expanded={open} className={buttonClass({ size: "lg", block: true })}>
            Tiếp tục thiết kế
          </button>
          <Button size="lg" variant="outline" block onClick={restart}>
            Cài đặt lại vòng
          </Button>
        </div>
      )}
      <div
        inert={!isDesktop && !open}
        onKeyDown={(e) => e.key === "Escape" && !isDesktop && open && close()}
        className={`fixed inset-0 z-(--z-modal) flex flex-col bg-paper pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] transition-transform motion-reduce:transition-none lg:static lg:z-auto lg:grid lg:translate-y-0 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-6 lg:bg-transparent lg:p-0 lg:transition-none ${
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
          {salesOpen || preorder ? (
            <Button onClick={state.addToCart} className="rounded-full">
              {state.editing ? "Cập nhật" : "Lưu vào giỏ"}
            </Button>
          ) : (
            <Tag tone="wood">Mở bán {launchDateLabel}</Tag>
          )}
        </div>
        <div className="flex flex-col gap-2 px-(--page-gutter) pt-3 lg:hidden">
          <WristSize state={state} compact />
          <FitStatus state={state} className="text-xs" />
        </div>

        {/* Kho hạt: đáy sheet trên điện thoại, cột trái trên máy tính */}
        <div className="order-last rounded-t-2xl border-t border-line bg-surface px-(--page-gutter) pt-4 pb-3 lg:order-none lg:col-span-4 lg:col-start-1 lg:row-start-1 lg:self-start lg:rounded-xl lg:border lg:p-5">
          <BeadPicker
            state={state}
            onBeadPointer={onBeadPointer}
            options={<BraceletOptions state={state} />}
          />
        </div>

        {/* Vòng 3D ở giữa */}
        <div className="relative flex min-h-0 flex-1 flex-col gap-4 lg:sticky lg:top-24 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div
            tabIndex={0}
            onKeyDown={onSceneKey}
            aria-describedby="huong-dan-vong"
            className="relative min-h-0 flex-1 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wood lg:aspect-4/3 lg:max-h-[72vh] lg:w-full lg:flex-none lg:rounded-xl lg:border lg:border-line lg:bg-paper-2"
          >
            <BraceletScene
              ref={scene}
              items={sceneItems}
              selected={selected}
              onSelect={setSelected}
              onMove={state.move}
              onRemove={state.removeAt}
              label={`${state.wraps > 1 ? `Chuỗi ${ring.length} hạt quấn ${state.wraps} vòng` : `Vòng ${ring.length} hạt`}, dài ${cm(lengthMm)} cm${onHand ? `, đeo trên bàn tay mẫu cổ tay ${wristLabel}` : ""}`}
              wraps={state.wraps}
              accent={state.accent}
              onHand={onHand}
              wristCm={state.wristCm}
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
                  {state.wraps > 1 ? ` · ≈ ${state.turns.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} vòng` : ""}
                </dd>
              </div>
            </dl>

            {/* Tay mẫu phóng theo số đo cổ tay khách nhập, ghi rõ cỡ để khách không nhầm là tay thật */}
            {onHand && !selectedBead && (
              <p aria-hidden className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-sm shadow-e1 tabular-nums">
                Tay mẫu: cổ tay <span className="font-semibold">{wristLabel}</span>
              </p>
            )}

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
          <div className="absolute top-14 left-1/2 flex -translate-x-1/2 gap-3 lg:static lg:translate-x-0 lg:justify-center lg:gap-2">
            <button
              type="button"
              onClick={state.undo}
              disabled={!state.canUndo}
              className={action}
            >
              <UndoIcon />
              <span className="sr-only lg:not-sr-only lg:whitespace-nowrap">Hoàn tác</span>
            </button>
            <button
              type="button"
              aria-pressed={spinning}
              onClick={() => setSpinning(scene.current?.spin() ?? false)}
              className={action}
            >
              <SpinIcon />
              <span className="sr-only lg:not-sr-only lg:whitespace-nowrap">Xoay vòng</span>
            </button>
            <button
              type="button"
              aria-pressed={onHand}
              onClick={() => {
                setOnHand(!onHand);
                setSelected(null);
              }}
              className={action}
            >
              <HandIcon />
              <span className="sr-only lg:not-sr-only lg:whitespace-nowrap">Đeo thử</span>
            </button>
            {/* Mở lại form khởi tạo, giá trị đang dùng điền sẵn */}
            <button type="button" onClick={restart} aria-label="Cài đặt lại vòng" className={action}>
              <ResetIcon />
              <span aria-hidden className="hidden lg:inline lg:whitespace-nowrap">Cài đặt lại</span>
            </button>
            {/* Điện thoại: hướng dẫn gấp vào nút, máy tính đã có đoạn hướng dẫn dưới vòng */}
            <button
              ref={helpButton}
              type="button"
              aria-expanded={help}
              aria-controls="huong-dan-vong-mobile"
              aria-label="Hướng dẫn thiết kế vòng"
              onClick={() => setHelp(!help)}
              className={`${action} aria-expanded:border-wood aria-expanded:text-wood lg:hidden`}
            >
              <HelpIcon />
            </button>
          </div>
          {help && (
            <div
              id="huong-dan-vong-mobile"
              role="region"
              aria-label="Hướng dẫn thiết kế vòng"
              onKeyDown={(e) => {
                if (e.key !== "Escape") return;
                e.stopPropagation();
                closeHelp();
              }}
              className="absolute inset-x-3 top-28 flex items-start gap-2 rounded-lg border border-line bg-surface p-4 text-sm text-ink-2 shadow-e2 lg:hidden"
            >
              <ul className="flex-1 list-disc space-y-1.5 pl-4">
                <li>Chạm hạt hoặc charm để thêm vào vòng, hoặc kéo thả vào đúng vị trí trên vòng.</li>
                <li>Bấm Đeo thử để xem vòng trên bàn tay theo cỡ cổ tay của bạn.</li>
                <li>Kéo hạt trên vòng ra xa để bỏ, kéo chỗ trống để xoay.</li>
              </ul>
              <button
                type="button"
                onClick={closeHelp}
                aria-label="Đóng hướng dẫn"
                className="-mt-2 -mr-2 inline-flex size-11 flex-none items-center justify-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>
          )}
          <p
            id="huong-dan-vong"
            className="sr-only lg:not-sr-only lg:text-center lg:text-sm lg:text-ink-3"
          >
            Kéo hạt hoặc charm thả vào vị trí trên vòng, hoặc bấm để thêm vào sau hạt đang chọn. Muốn đổi loại vòng, cỡ hạt hay cổ tay thì bấm Cài đặt lại. Bấm Đeo thử để xem vòng trên bàn tay theo cỡ cổ tay của bạn. Gắp hạt trên vòng kéo ra xa để bỏ, kéo chỗ trống để xoay.
            Bàn phím: mũi tên để chọn hạt, Shift + mũi tên để dời, Delete để
            xoá.
          </p>
        </div>

        {/* Cột phải trên máy tính: cỡ tay, tóm tắt, giá */}
        <div className="hidden lg:col-span-4 lg:col-start-1 lg:row-start-2 lg:block lg:self-start">
          <BraceletSummary state={state} salesOpen={salesOpen} preorder={preorder} />
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
