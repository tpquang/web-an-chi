import { NextResponse, type NextRequest } from "next/server";
import { countdownHref, isPreLaunch } from "./lib/launch";

// Tạm tắt để test trang sản phẩm: trang vẫn ở chế độ xem trước (có giá, không có nút mua, không nhận đơn).
// Đổi lại true để chuyển trang sản phẩm về /countdown như cũ.
// Bật cờ này khi site đã index thì Google thấy sản phẩm, danh mục chuyển về trang noindex: tránh bật trên production
const REDIRECT_TO_COUNTDOWN = false;

// Trước giờ mở bán, mọi trang sản phẩm chuyển tạm (307) về trang đếm ngược.
// Sau giờ mở bán, /countdown hết dùng nên chuyển hẳn (308) về trang chủ.
// Proxy chạy ở mỗi request, không qua cache trang, nên đúng giờ là tự mở. Gỡ file này sau ngày mở bán
export function proxy(request: NextRequest) {
  const preLaunch = isPreLaunch();
  if (request.nextUrl.pathname === countdownHref) {
    return preLaunch ? NextResponse.next() : NextResponse.redirect(new URL("/", request.url), 308);
  }
  if (!REDIRECT_TO_COUNTDOWN || !preLaunch) return NextResponse.next();
  return NextResponse.redirect(new URL(countdownHref, request.url), 307);
}

export const config = {
  matcher: ["/san-pham", "/san-pham/:path*", "/danh-muc/:path*", "/countdown"],
};
