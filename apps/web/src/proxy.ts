import { NextResponse, type NextRequest } from "next/server";
import { countdownHref, isPreLaunch } from "./lib/launch";

// Trước giờ mở bán, mọi trang sản phẩm chuyển tạm (307) về trang đếm ngược.
// Proxy chạy ở mỗi request, không qua cache trang, nên đúng giờ là tự mở. Gỡ file này sau ngày mở bán
export function proxy(request: NextRequest) {
  if (!isPreLaunch()) return NextResponse.next();
  return NextResponse.redirect(new URL(countdownHref, request.url), 307);
}

export const config = {
  matcher: ["/san-pham", "/san-pham/:path*", "/danh-muc/:path*"],
};
