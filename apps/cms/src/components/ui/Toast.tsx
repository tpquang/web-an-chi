import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertIcon, CheckIcon, CloseIcon } from "../icons";

type Toast = { id: number; title: string; desc?: string; type: "success" | "error" };

let nextId = 1;
let items: Toast[] = [];
const listeners = new Set<(items: Toast[]) => void>();

function emit() {
  listeners.forEach((listener) => listener(items));
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function showToast(title: string, options: { desc?: string; type?: "success" | "error" } = {}) {
  const id = nextId++;
  items = [...items.slice(-2), { id, title, desc: options.desc, type: options.type ?? "success" }];
  emit();
  setTimeout(() => dismiss(id), options.type === "error" ? 8000 : 4000);
}

export function Toaster() {
  const [list, setList] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  return createPortal(
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-toast) flex flex-col items-center gap-2 p-4 md:items-end">
      {list.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-e3"
        >
          <span className={toast.type === "error" ? "text-err" : "text-ok"}>{toast.type === "error" ? <AlertIcon /> : <CheckIcon />}</span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{toast.title}</p>
            {toast.desc && <p className="mt-0.5 text-sm text-ink-2">{toast.desc}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Đóng thông báo"
            className="-m-2 inline-flex size-11 flex-none items-center justify-center rounded-full text-ink-3 hover:text-ink"
          >
            <CloseIcon size={18} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
