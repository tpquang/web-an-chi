import "server-only";
import { cookies } from "next/headers";

// Token khách nằm trong cookie httpOnly, JS của trang không đọc được.
// Cookie cờ đi kèm chỉ cho header biết đã đăng nhập, không chứa thông tin gì.
export const SESSION_COOKIE = "anchi-session";
export const SIGNED_IN_COOKIE = "anchi-signed-in";

export async function sessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export async function startSession(token: string, expiresAt: string) {
  const store = await cookies();
  const common = { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", expires: new Date(expiresAt) };
  store.set(SESSION_COOKIE, token, { ...common, httpOnly: true });
  store.set(SIGNED_IN_COOKIE, "1", common);
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(SIGNED_IN_COOKIE);
}
