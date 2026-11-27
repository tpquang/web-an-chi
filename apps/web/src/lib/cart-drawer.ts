"use client";

import { useSyncExternalStore } from "react";

// Bảng giỏ hàng trượt từ phải. Mọi nút giỏ (header, tab cạnh phải, menu điện thoại) và mọi nơi thêm hàng vào giỏ đều mở bảng này.
// "closing": bảng đang trượt ra, vẫn còn trong DOM tới khi hết animation rồi mới gỡ (finishCartDrawer)
type Phase = "closed" | "open" | "closing";
// Bảng có hai bước: "cart" danh sách hàng, "checkout" form đặt hàng ngay trong bảng (không còn trang thanh toán riêng)
export type DrawerView = "cart" | "checkout";
let phase: Phase = "closed";
let view: DrawerView = "cart";
const listeners = new Set<() => void>();

function set(next: Phase, nextView = view) {
  if (phase === next && view === nextView) return;
  phase = next;
  view = nextView;
  listeners.forEach((listener) => listener());
}

export const openCartDrawer = () => set("open", "cart");
// Mở thẳng bước đặt hàng (nút Thanh toán ở trang giỏ, quay về sau khi đăng nhập)
export const openCheckout = () => set("open", "checkout");
export const showDrawerView = (next: DrawerView) => phase === "open" && set("open", next);
export const closeCartDrawer = () => phase === "open" && set("closing");
// Đóng hẳn thì lần mở sau bắt đầu lại từ danh sách hàng
export const finishCartDrawer = () => phase === "closing" && set("closed", "cart");

// Link mở bước đặt hàng từ trang khác: CartLayer thấy ?dat-hang ở URL thì mở bảng rồi bỏ tham số
export const CHECKOUT_PARAM = "dat-hang";

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

export function useCartDrawerView() {
  return useSyncExternalStore(subscribe, () => view, () => "cart" as DrawerView);
}

// Đang mở hẳn (không tính lúc trượt ra): cho aria-expanded của nút giỏ và vị trí nút chat
export function useCartDrawerOpen() {
  return useCartDrawerPhase() === "open";
}
