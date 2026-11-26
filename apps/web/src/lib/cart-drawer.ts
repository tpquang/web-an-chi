"use client";

import { useSyncExternalStore } from "react";

// Bảng giỏ hàng trượt từ phải. Mọi nút giỏ (header, tab cạnh phải, menu điện thoại) và mọi nơi thêm hàng vào giỏ đều mở bảng này.
// "closing": bảng đang trượt ra, vẫn còn trong DOM tới khi hết animation rồi mới gỡ (finishCartDrawer)
type Phase = "closed" | "open" | "closing";
let phase: Phase = "closed";
const listeners = new Set<() => void>();

function set(next: Phase) {
  if (phase === next) return;
  phase = next;
  listeners.forEach((listener) => listener());
}

export const openCartDrawer = () => set("open");
export const closeCartDrawer = () => phase === "open" && set("closing");
export const finishCartDrawer = () => phase === "closing" && set("closed");

// Mở khung chat từ trong giỏ: đóng giỏ trước để khung chat không nằm dưới bảng giỏ
export const CHAT_OPEN_EVENT = "anchi:open-chat";
export function openChatFromCart() {
  closeCartDrawer();
  window.dispatchEvent(new Event(CHAT_OPEN_EVENT));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCartDrawerPhase() {
  return useSyncExternalStore(subscribe, () => phase, () => "closed" as Phase);
}

// Đang mở hẳn (không tính lúc trượt ra): cho aria-expanded của nút giỏ và vị trí nút chat
export function useCartDrawerOpen() {
  return useCartDrawerPhase() === "open";
}
