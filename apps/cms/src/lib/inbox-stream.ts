import { getToken } from "./api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type InboxEvent = { type: "message" | "conversation"; conversationId: string; data: { message?: unknown; conversation: unknown } };
type Listener = (event: InboxEvent) => void;

// Một kết nối Server-Sent Events dùng chung cho cả CMS. EventSource không gửi được header Authorization,
// nên đọc luồng bằng fetch. Rớt mạng thì nối lại sau 3 giây
const listeners = new Set<Listener>();
let controller: AbortController | null = null;

async function connect() {
  controller = new AbortController();
  const signal = controller.signal;
  while (!signal.aborted && listeners.size > 0) {
    try {
      const res = await fetch(`${API_URL}/api/v1/admin/inbox/stream`, { headers: { authorization: `Bearer ${getToken() ?? ""}` }, signal });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const data = part.split("\n").find((line) => line.startsWith("data: "));
          if (!data) continue;
          const event = JSON.parse(data.slice(6)) as InboxEvent;
          listeners.forEach((listener) => listener(event));
        }
      }
    } catch {
      if (signal.aborted) return;
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
}

export function subscribeInbox(listener: Listener) {
  listeners.add(listener);
  if (listeners.size === 1) connect();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) controller?.abort();
  };
}
