"use client";

import { postJson } from "./client-api";
import { SESSION_EVENT } from "./use-signed-in";

// Chỉ nhận đường dẫn nội bộ để ?tiep= không dẫn khách sang trang khác
export function safeNext(next: string | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export function announceSession() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export async function logout() {
  await postJson("/api/account/logout", {});
  announceSession();
}
