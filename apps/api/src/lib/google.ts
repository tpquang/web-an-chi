import { env } from "../env.js";
import { HttpError } from "../middleware/errors.js";

// Đăng nhập Google (OpenID Connect, luồng authorization code + PKCE). Web điều hướng sang Google và nhận code,
// API đổi code lấy id_token. id_token nhận thẳng từ token endpoint của Google qua TLS nên theo OIDC Core 3.1.3.7
// không cần kiểm chữ ký, chỉ kiểm iss, aud, exp

export const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export type GoogleProfile = { sub: string; email: string | null; name: string | null };

const ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

export async function exchangeGoogleCode(code: string, codeVerifier: string, redirectUri: string): Promise<GoogleProfile> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) throw new HttpError(404, "Chưa bật đăng nhập Google.");
  let res: Response;
  try {
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        grant_type: "authorization_code",
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new HttpError(502, "Không kết nối được Google. Bạn thử lại sau ít phút.", "GOOGLE_UNREACHABLE");
  }
  const body = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string };
  // Code hết hạn, đã dùng, hoặc redirect_uri không khớp với lúc xin code
  if (!res.ok || !body.id_token) throw new HttpError(400, "Phiên đăng nhập Google đã hết hạn. Bạn bấm đăng nhập Google lại.", "GOOGLE_BAD_CODE");

  const claims = decodeJwtPayload(body.id_token);
  const valid =
    claims &&
    ISSUERS.has(String(claims.iss)) &&
    claims.aud === env.GOOGLE_CLIENT_ID &&
    typeof claims.exp === "number" &&
    claims.exp * 1000 > Date.now() &&
    typeof claims.sub === "string";
  if (!valid) throw new HttpError(400, "Google trả về thông tin không hợp lệ. Bạn thử đăng nhập lại.", "GOOGLE_BAD_TOKEN");

  // Chỉ nhận email Google đã xác minh
  const email = claims.email_verified === true && typeof claims.email === "string" ? claims.email.toLowerCase() : null;
  const name = typeof claims.name === "string" && claims.name.trim() ? claims.name.trim().slice(0, 80) : null;
  return { sub: claims.sub as string, email, name };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString());
  } catch {
    return null;
  }
}
