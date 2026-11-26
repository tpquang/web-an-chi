import { NextResponse, type NextRequest } from "next/server";
import { countdownHref, isPreLaunch, launchAtOf } from "./lib/launch";

// Giờ mở bán và cờ chuyển hướng sửa ở CMS > Thông tin cửa hàng.
// Trước giờ mở bán, nếu bật "Chuyển trang sản phẩm về đếm ngược": mọi trang sản phẩm, danh mục chuyển tạm (307) về /countdown.
// Bật cờ này khi site đã index thì Google thấy sản phẩm, danh mục chuyển về trang noindex: tránh bật trên production.
// Sau giờ mở bán, /countdown hết dùng nên chuyển hẳn (308) về trang chủ

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const TTL_MS = 60_000;

type Launch = { at: number | null; redirect: boolean };
let cached: { value: Launch; until: number } | null = null;

// Proxy chạy ở mỗi request nên nhớ cài đặt 60 giây, cùng nhịp cache với các trang. API lỗi thì coi như đã mở bán
async function launchSettings(): Promise<Launch> {
  if (cached && cached.until > Date.now()) return cached.value;
  let value: Launch = { at: null, redirect: false };
  try {
    const res = await fetch(`${API_URL}/api/v1/settings/store`, { signal: AbortSignal.timeout(3000), cache: "no-store" });
    if (res.ok) {
      const { data } = (await res.json()) as { data: { launchAt?: string | null; countdownRedirect?: boolean } };
      value = { at: launchAtOf(data), redirect: data.countdownRedirect === true };
    }
  } catch {}
  cached = { value, until: Date.now() + TTL_MS };
  return value;
}

export async function proxy(request: NextRequest) {
  const { at, redirect } = await launchSettings();
  const preLaunch = isPreLaunch(at);
  if (request.nextUrl.pathname === countdownHref) {
    return preLaunch ? NextResponse.next() : NextResponse.redirect(new URL("/", request.url), 308);
  }
  if (!redirect || !preLaunch) return NextResponse.next();
  return NextResponse.redirect(new URL(countdownHref, request.url), 307);
}

export const config = {
  matcher: ["/san-pham", "/san-pham/:path*", "/danh-muc/:path*", "/countdown"],
};
