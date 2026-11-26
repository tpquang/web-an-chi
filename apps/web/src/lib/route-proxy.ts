import "server-only";
import { forward } from "./api";
import { endSession, sessionToken, startSession } from "./session";

type Options = { method?: string; session?: "start" | "use" | "none" };

const UNREACHABLE = "Không kết nối được hệ thống của shop. Bạn thử lại sau ít phút, giỏ hàng vẫn được giữ.";

// Trình duyệt không gọi thẳng API: route handler của web nhận rồi chuyển tiếp.
// session "use": gửi kèm token khách từ cookie. "start": API trả token thì cất vào cookie, không đưa token cho JS.
// "none": không đụng tới phiên khách, ví dụ trang nhà cung cấp
// IP của khách do nginx đặt; chạy dev không qua nginx thì không có, API dùng IP kết nối
const clientIpOf = (request: Request) => request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

// path là hàm khi đường dẫn có tham số, ví dụ (p) => `/orders/${p.code}/cancel`
type Path = string | ((params: Record<string, string>) => string);

export function routeProxy(pathOf: Path, { method = "POST", session = "use" }: Options = {}) {
  return async function handler(request: Request, context?: { params?: Promise<Record<string, string>> }) {
    const path = typeof pathOf === "string" ? pathOf : pathOf(Object.fromEntries(Object.entries((await context?.params) ?? {}).map(([k, v]) => [k, encodeURIComponent(v)])));
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
      res = await forward(path, { method, body, token: session === "use" ? await sessionToken() : null, clientIp: clientIpOf(request) });
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
