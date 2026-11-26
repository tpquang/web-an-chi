"use client";

import { postJson } from "./client-api";
import { SESSION_EVENT } from "./use-signed-in";

export function announceSession() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export async function logout() {
  await postJson("/api/account/logout", {});
  announceSession();
}
