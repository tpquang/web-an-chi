"use client";

import { useSyncExternalStore } from "react";

// Giỏ chỉ lưu slug và số lượng trong trình duyệt. Giá, tồn kho luôn hỏi lại API
export type CartItem = { slug: string; quantity: number };

const KEY = "anchi-cart";
const MAX_QUANTITY = 99;
const EMPTY: CartItem[] = [];

let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed)
      ? parsed.filter((item) => typeof item?.slug === "string" && Number.isInteger(item?.quantity) && item.quantity > 0)
      : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(items: CartItem[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Đồng bộ khi khách mở nhiều tab
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// Server và lần render đầu luôn thấy giỏ rỗng để HTML khớp nhau
export function useCart() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount() {
  return useCart().reduce((sum, item) => sum + item.quantity, 0);
}

export const cart = {
  add(slug: string, quantity: number, max = MAX_QUANTITY) {
    const items = read();
    const current = items.find((item) => item.slug === slug)?.quantity ?? 0;
    const next = Math.min(current + quantity, max, MAX_QUANTITY);
    write(
      current > 0
        ? items.map((item) => (item.slug === slug ? { slug, quantity: next } : item))
        : [...items, { slug, quantity: next }],
    );
    return next;
  },
  set(slug: string, quantity: number) {
    const items = read();
    write(items.map((item) => (item.slug === slug ? { ...item, quantity: Math.min(Math.max(1, quantity), MAX_QUANTITY) } : item)));
  },
  remove(slug: string) {
    write(read().filter((item) => item.slug !== slug));
  },
  clear() {
    write([]);
  },
};
