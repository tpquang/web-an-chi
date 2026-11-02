"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertIcon, CheckIcon, CloseIcon } from "../icons";

type ToastInput = {
  title: string;
  desc?: string;
  type?: "success" | "error";
  action?: { href: string; label: string };
};
type ToastItem = ToastInput & { id: number };

let nextId = 1;
const listeners = new Set<(items: ToastItem[]) => void>();
let items: ToastItem[] = [];

function emit() {
  listeners.forEach((listener) => listener(items));
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function showToast(input: ToastInput) {
  const id = nextId++;
  // Tối đa 3 toast cùng lúc, cái cũ nhất tự đóng
  items = [...items.slice(-2), { ...input, id }];
  emit();
  setTimeout(() => dismiss(id), input.type === "error" ? 8000 : 5000);
}

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-toast) flex flex-col items-center gap-2 p-4 pb-[max(16px,env(safe-area-inset-bottom))] md:items-end"
    >
      {list.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === "error" ? "alert" : "status"}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-line bg-surface p-4 shadow-e3"
        >
          <span className={toast.type === "error" ? "text-err" : "text-ok"}>
            {toast.type === "error" ? <AlertIcon /> : <CheckIcon />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{toast.title}</p>
            {toast.desc && <p className="mt-0.5 text-sm text-ink-2">{toast.desc}</p>}
            {toast.action && (
              <Link
                href={toast.action.href}
                onClick={() => dismiss(toast.id)}
                className="mt-2 inline-flex min-h-11 items-center font-medium text-wood underline-offset-4 hover:underline"
              >
                {toast.action.label}
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Đóng thông báo"
            className="-m-2 inline-flex size-11 flex-none items-center justify-center rounded-md text-ink-3 hover:text-ink"
          >
            <CloseIcon size={18} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
