import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "../icons";
import { Button } from "./Button";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  // Đang gửi thì không đóng bằng Esc hay bấm nền
  locked?: boolean;
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, footer, wide, locked }: ModalProps) {
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus vào khung, không vào ô đầu tiên để bàn phím mobile không bật lên che nội dung
    box.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape" && !locked) {
      event.stopPropagation();
      onClose();
    }
    if (event.key !== "Tab" || !box.current) return;
    const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-(--z-modal) flex items-end justify-center md:items-center md:p-6" onKeyDown={onKeyDown}>
      <div aria-hidden className="absolute inset-0 bg-(--scrim)" onClick={() => !locked && onClose()} />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[90dvh] w-full flex-col rounded-t-3xl bg-surface shadow-e4 focus:outline-none md:rounded-3xl ${wide ? "md:max-w-3xl" : "md:max-w-lg"}`}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-0 md:p-6 md:pb-0">
          <h2 id={titleId} className="font-serif text-2xl leading-tight font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={locked}
            aria-label="Đóng"
            className="-mt-2 -mr-2 inline-flex size-11 flex-none items-center justify-center rounded-sm text-ink-3 hover:text-ink disabled:opacity-40"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto p-5 md:p-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end md:px-6 md:pb-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ---- confirmDialog: gọi được ở bất kỳ đâu, trả Promise<boolean>

type ConfirmOptions = { title: string; desc?: ReactNode; confirmLabel: string; cancelLabel?: string; danger?: boolean };
type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

let push: ((pending: Pending) => void) | null = null;

export function confirmDialog(options: ConfirmOptions) {
  return new Promise<boolean>((resolve) => {
    if (!push) return resolve(false);
    push({ ...options, resolve });
  });
}

export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);
  useEffect(() => {
    push = setPending;
    return () => {
      push = null;
    };
  }, []);

  function finish(ok: boolean) {
    pending?.resolve(ok);
    setPending(null);
  }

  return (
    <Modal
      open={Boolean(pending)}
      onClose={() => finish(false)}
      title={pending?.title ?? ""}
      footer={
        <>
          <Button variant="secondary" onClick={() => finish(false)}>
            {pending?.cancelLabel ?? "Giữ lại"}
          </Button>
          <Button variant={pending?.danger ? "danger" : "primary"} onClick={() => finish(true)}>
            {pending?.confirmLabel}
          </Button>
        </>
      }
    >
      {pending?.desc && <div className="text-ink-2">{pending.desc}</div>}
    </Modal>
  );
}
