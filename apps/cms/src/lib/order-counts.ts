import { useEffect, useSyncExternalStore } from "react";
import { api } from "./api";
import { subscribeInbox } from "./inbox-stream";
import type { OrderCounts } from "./types";

// Số đơn mỗi tab (cần xử lý, chờ thanh toán...), dùng chung cho danh sách đơn, menu và tổng quan.
// Tải lại khi có đơn mới hoặc khách huỷ (SSE), khi thao tác trên đơn (refreshOrderCounts) và mỗi phút
let counts: OrderCounts | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

export async function refreshOrderCounts() {
  try {
    counts = await api.get<OrderCounts>("/orders/counts");
    listeners.forEach((listener) => listener());
  } catch {}
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    refreshOrderCounts();
    timer = setInterval(refreshOrderCounts, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) clearInterval(timer);
  };
}

export function useOrderCounts() {
  useEffect(() => subscribeInbox((event) => event.type === "order" && refreshOrderCounts()), []);
  return useSyncExternalStore(subscribe, () => counts);
}

// Tag cảnh báo trên từng dòng đơn
export function orderFlags(order: { status: string; createdAt: string; updatedAt: string; paymentDueAt: string | null; refundVnd: number; refundedAt: string | null }, now = Date.now()) {
  const flags: { label: string; tone: "warn" | "err" | "info" }[] = [];
  const hours = (iso: string) => (now - Date.parse(iso)) / 3_600_000;
  if (order.status === "PENDING" && !order.paymentDueAt && hours(order.createdAt) > 24) flags.push({ label: "Quá 24 giờ chưa xác nhận", tone: "warn" });
  if (order.paymentDueAt && (order.status === "PENDING" || order.status === "PREORDER")) {
    const left = -hours(order.paymentDueAt);
    flags.push({ label: left > 0 ? `Chờ chuyển khoản, còn ${left >= 1 ? `${Math.round(left)} giờ` : `${Math.max(1, Math.round(left * 60))} phút`}` : "Quá hạn chuyển khoản", tone: left < 2 ? "warn" : "info" });
  }
  if (order.refundVnd > 0 && !order.refundedAt) flags.push({ label: "Cần hoàn tiền", tone: "err" });
  if (order.status === "SHIPPING" && hours(order.updatedAt) > 24 * 7) flags.push({ label: "Giao quá 7 ngày", tone: "warn" });
  return flags;
}
