import { formatDate } from "./site";

// Giờ mở bán sửa ở CMS > Thông tin cửa hàng (store.launchAt), web đọc lại sau khoảng một phút.
// Trước giờ này: đồng hồ đếm ngược, đơn là đơn đặt chờ (API tự quyết theo cùng giờ này).
// Trống hoặc ngày sai thì coi như đã mở bán, để lỗi cấu hình không khoá việc đặt hàng

// Trang đếm ngược. Trước giờ mở bán, proxy.ts chuyển trang sản phẩm về đây nếu CMS bật chuyển hướng
export const countdownHref = "/countdown";

// Mili giây của giờ mở bán, null khi đã mở bán
export function launchAtOf(store: { launchAt?: string | null } | null | undefined): number | null {
  const time = store?.launchAt ? Date.parse(store.launchAt) : Number.NaN;
  return Number.isNaN(time) ? null : time;
}

// Số mili giây còn lại tới giờ mở bán, 0 khi đã mở
export function msToLaunch(at: number | null, now = Date.now()) {
  return at === null ? 0 : Math.max(0, at - now);
}

export function isPreLaunch(at: number | null, now = Date.now()) {
  return msToLaunch(at, now) > 0;
}

export const launchLabel = (at: number | null) => (at === null ? "" : formatDate(new Date(at)));
export const launchIso = (at: number | null) => (at === null ? "" : new Date(at).toISOString());
