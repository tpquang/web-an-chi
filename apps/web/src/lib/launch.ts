import { formatDate } from "./site";

// Ngày mở bán. Trước giờ này web chỉ cho xem trước: không thêm vào giỏ, không nhận đơn.
// Đổi ngày bằng NEXT_PUBLIC_LAUNCH_AT (ISO, có múi giờ) rồi build lại; đặt ngày đã qua để mở bán ngay.
// Ngày viết sai thì coi như đã mở bán, để lỗi cấu hình không khoá việc đặt hàng
const launchTime = new Date(process.env.NEXT_PUBLIC_LAUNCH_AT || "2026-12-01T00:00:00+07:00").getTime();

export const launchDateLabel = Number.isNaN(launchTime) ? "" : formatDate(new Date(launchTime));
// Trang đếm ngược. Trước giờ mở bán, proxy.ts chuyển mọi trang sản phẩm về đây
export const countdownHref = "/countdown";
export const launchIso = Number.isNaN(launchTime) ? "" : new Date(launchTime).toISOString();

// Số mili giây còn lại tới giờ mở bán, 0 khi đã mở
export function msToLaunch(now = Date.now()) {
  return Number.isNaN(launchTime) ? 0 : Math.max(0, launchTime - now);
}

export function isPreLaunch(now = Date.now()) {
  return msToLaunch(now) > 0;
}
