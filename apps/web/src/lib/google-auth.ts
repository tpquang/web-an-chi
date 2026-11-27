import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { site } from "./site";

// Đăng nhập Google: web giữ state và code_verifier (PKCE) trong cookie httpOnly 10 phút, chỉ gửi về đường dẫn callback.
// API đổi code lấy id_token (apps/api/src/lib/google.ts). Quy tắc ở skill anchi-auth mục 4
export const GOOGLE_COOKIE = "anchi-google";
export const GOOGLE_COOKIE_PATH = "/api/account/google";
export const GOOGLE_COOKIE_SECONDS = 600;

// Khai đúng chuỗi này trong Google Cloud Console > Authorized redirect URIs
export const googleRedirectUri = () => `${site.url}/api/account/google/callback`;

export type GoogleFlow = { state: string; verifier: string; next: string };

export function newGoogleFlow(next: string): GoogleFlow {
  return { state: randomBytes(24).toString("base64url"), verifier: randomBytes(48).toString("base64url"), next };
}

export function googleAuthUrl(clientId: string, flow: GoogleFlow) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: flow.state,
    code_challenge: createHash("sha256").update(flow.verifier).digest("base64url"),
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function readGoogleFlow(value: string | undefined): GoogleFlow | null {
  if (!value) return null;
  try {
    const flow = JSON.parse(Buffer.from(value, "base64url").toString());
    return typeof flow.state === "string" && typeof flow.verifier === "string" && typeof flow.next === "string" ? flow : null;
  } catch {
    return null;
  }
}

// Chuyển hướng 303 về trang của web. Dựng từ site.url vì sau nginx request.url là địa chỉ nội bộ.
// Không dùng Response.redirect: header của nó không sửa được nên Next không gắn được cookie phiên
export function seeOther(location: string) {
  return new Response(null, { status: 303, headers: { location: location.startsWith("https://") ? location : `${site.url}${location}` } });
}

export const encodeGoogleFlow = (flow: GoogleFlow) => Buffer.from(JSON.stringify(flow)).toString("base64url");
