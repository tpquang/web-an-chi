import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sessionToken } from "./session";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
// Mã bí mật nhận diện trình duyệt khi chat, httpOnly nên JS của trang không đọc được.
// Cờ đi kèm chỉ cho khung chat biết đã có cuộc trò chuyện để tải lại khi mở trang
const KEY_COOKIE = "anchi-chat";
export const CHAT_FLAG_COOKIE = "anchi-chat-on";
const MAX_AGE = 60 * 60 * 24 * 180;

async function visitorKey(create: boolean) {
  const store = await cookies();
  const existing = store.get(KEY_COOKIE)?.value;
  if (existing || !create) return existing ?? null;
  const key = randomBytes(32).toString("base64url");
  const common = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: MAX_AGE };
  store.set(KEY_COOKIE, key, { ...common, httpOnly: true });
  store.set(CHAT_FLAG_COOKIE, "1", common);
  return key;
}

export function chatProxy(path: string, { method = "GET", create = false } = {}) {
  return async function handler(request: Request) {
    const key = await visitorKey(create);
    if (!key) return Response.json({ error: "Chưa có cuộc trò chuyện." }, { status: 404 });
    const token = await sessionToken();
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/v1/chat${path}`, {
        method,
        headers: { "content-type": "application/json", "x-visitor-key": key, ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: method === "GET" ? undefined : await request.text(),
        cache: "no-store",
        // Luồng sự kiện giữ mở lâu nên không đặt timeout; khi khách đóng trang, request bị huỷ theo
        signal: path === "/stream" ? request.signal : AbortSignal.timeout(8000),
      });
    } catch {
      return Response.json({ error: "Không kết nối được hệ thống chat. Bạn thử lại sau ít phút." }, { status: 503 });
    }
    const type = res.headers.get("content-type") ?? "application/json";
    return new Response(res.body, { status: res.status, headers: { "content-type": type, "cache-control": "no-cache, no-transform" } });
  };
}
