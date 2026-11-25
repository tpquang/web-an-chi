"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "../icons";

type Props = { open: boolean; onClose(): void; title: string; children: ReactNode; wide?: boolean; hideClose?: boolean };

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modal theo anchi-ui-ux: portal vào body, khoá cuộn nền, Esc và bấm nền để đóng, giữ Tab trong khung, trả focus khi đóng.
// Focus vào khung chứ không vào ô nhập đầu tiên để bàn phím điện thoại không bật lên che nội dung.
// Điện thoại hiện dạng sheet từ đáy, máy tính hộp giữa màn hình. Chỉ render khi mở
export function Modal({ open, onClose, title, children, wide, hideClose }: Props) {
  return open ? createPortal(<Frame onClose={onClose} title={title} wide={wide} hideClose={hideClose}>{children}</Frame>, document.body) : null;
}

function Frame({ onClose, title, children, wide, hideClose }: Omit<Props, "open">) {
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    box.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close.current();
        return;
      }
      if (event.key !== "Tab" || !box.current) return;
      const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === box.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-(--z-modal) flex items-end justify-center md:items-center md:p-6">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-(--scrim) transition-opacity duration-(--d-base) ease-(--ease-out) motion-reduce:transition-none starting:opacity-0"
      />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-e4 transition-[opacity,translate] duration-(--d-modal) ease-(--ease-ios) focus:outline-none motion-reduce:transition-none starting:translate-y-6 starting:opacity-0 md:rounded-3xl md:pb-0 ${wide ? "md:max-w-2xl" : "md:max-w-md"}`}
      >
        <div className="flex flex-none items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
          <h2 id={titleId} className="font-serif text-2xl leading-tight">
            {title}
          </h2>
          {!hideClose && (
            <button type="button" onClick={onClose} aria-label="Đóng" className="-mt-2 -mr-2 inline-flex size-11 flex-none items-center justify-center rounded-full text-ink-2 hover:bg-paper-2">
              <CloseIcon />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-5 md:px-6 md:pb-6">{children}</div>
      </div>
    </div>
  );
}
