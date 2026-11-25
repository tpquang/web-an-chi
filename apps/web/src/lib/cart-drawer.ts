"use client";

import { useSyncExternalStore } from "react";

// Bảng giỏ hàng trượt từ phải: nút giỏ trên header mở, các nơi lưu hàng vào giỏ cũng mở để khách thấy ngay
let open = false;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((listener) => listener());
}

export const openCartDrawer = () => set(true);
export const closeCartDrawer = () => set(false);

// Mở khung chat từ trong giỏ: đóng giỏ trước để khung chat không nằm dưới bảng giỏ
export const CHAT_OPEN_EVENT = "anchi:open-chat";
export function openChatFromCart() {
  set(false);
  window.dispatchEvent(new Event(CHAT_OPEN_EVENT));
}

export function useCartDrawerOpen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => open,
    () => false,
  );
}
