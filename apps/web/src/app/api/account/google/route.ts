import { cookies } from "next/headers";
import { getGoogleClientId } from "@/lib/api";
import { encodeGoogleFlow, GOOGLE_COOKIE, GOOGLE_COOKIE_PATH, GOOGLE_COOKIE_SECONDS, googleAuthUrl, newGoogleFlow, seeOther } from "@/lib/google-auth";
import { accountHref, loginHref, safeNext } from "@/lib/links";

// Bấm "Đăng nhập bằng Google": cất state + verifier rồi chuyển sang Google. ?tiep= là trang quay về sau khi xong
export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = await getGoogleClientId();
  if (!clientId) return seeOther(`${loginHref}?loi=google-tat`);

  const flow = newGoogleFlow(safeNext(url.searchParams.get("tiep") ?? undefined, accountHref));
  (await cookies()).set(GOOGLE_COOKIE, encodeGoogleFlow(flow), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: GOOGLE_COOKIE_PATH,
    maxAge: GOOGLE_COOKIE_SECONDS,
  });
  return seeOther(googleAuthUrl(clientId, flow));
}
