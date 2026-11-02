import "server-only";
import { forward } from "./api";
import { endSession, sessionToken, startSession } from "./session";

type Options = { method?: string; session?: "start" | "use" };

const UNREACHABLE = "Không kết nối được hệ thống của shop. Bạn thử lại sau ít phút, giỏ hàng vẫn được giữ.";

// Trình duyệt không gọi thẳng API: route handler của web nhận rồi chuyển tiếp.
// session "use": gửi kèm token khách từ cookie. "start": API trả token thì cất vào cookie, không đưa token cho JS
export function routeProxy(path: string, { method = "POST", session = "use" }: Options = {}) {
  return async function handler(request: Request) {
    let body: unknown;
    if (method !== "GET") {
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Dữ liệu gửi lên chưa đúng" }, { status: 400 });
      }
    }
    let res: Response;
    try {
      res = await forward(path, { method, body, token: session === "use" ? await sessionToken() : null });
    } catch (error) {
      console.error(error);
      return Response.json({ error: UNREACHABLE }, { status: 503 });
    }
    if (session === "use" && res.status === 401) await endSession();
    if (session !== "start" || !res.ok) return res;
    const { data } = await res.json();
    await startSession(data.token, data.expiresAt);
    return Response.json({ data: { ok: true } });
  };
}
