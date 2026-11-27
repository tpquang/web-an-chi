import { cookies } from "next/headers";
import { forward } from "@/lib/api";
import { GOOGLE_COOKIE, GOOGLE_COOKIE_PATH, googleRedirectUri, readGoogleFlow, seeOther } from "@/lib/google-auth";
import { accountHref, loginHref } from "@/lib/links";
import { clientIpOf } from "@/lib/route-proxy";
import { sessionToken, startSession } from "@/lib/session";

// Google chuyển về đây kèm code. So state với cookie, nhờ API đổi code lấy tài khoản, cất phiên rồi về trang khách đang xem.
// Đang đăng nhập thì gửi kèm token để API gắn Google vào chính tài khoản đó
export async function GET(request: Request) {
  const url = new URL(request.url);
  const store = await cookies();
  const flow = readGoogleFlow(store.get(GOOGLE_COOKIE)?.value);
  store.delete({ name: GOOGLE_COOKIE, path: GOOGLE_COOKIE_PATH });

  const back = (reason: string) => seeOther(`${loginHref}?loi=${reason}`);
  const code = url.searchParams.get("code");
  // Khách bấm huỷ ở màn Google: quay lại trang đăng nhập, không báo lỗi
  if (url.searchParams.get("error") === "access_denied") return seeOther(loginHref);
  if (!flow || !code || url.searchParams.get("state") !== flow.state) return back("google-het-han");

  let res: Response;
  try {
    res = await forward("/account/google", {
      body: { code, codeVerifier: flow.verifier, redirectUri: googleRedirectUri() },
      token: await sessionToken(),
      clientIp: clientIpOf(request),
    });
  } catch {
    return back("google-loi");
  }
  if (!res.ok) {
    const { code: errorCode } = (await res.json().catch(() => ({}))) as { code?: string };
    if (errorCode === "GOOGLE_LINKED_ELSEWHERE") return seeOther(`${accountHref}?loi=google-da-gan`);
    return back(errorCode === "GOOGLE_BAD_CODE" ? "google-het-han" : "google-loi");
  }
  const { data } = (await res.json()) as { data: { token: string; expiresAt: string } };
  await startSession(data.token, data.expiresAt);
  return seeOther(flow.next);
}
