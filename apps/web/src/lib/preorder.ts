import "server-only";
import { isPreLaunch } from "./launch";

// Trước ngày mở bán mọi đơn là đơn đặt chờ: web gắn cờ theo ngày mở bán, khách không tự chọn được.
// API kiểm shop có bật đặt chờ hay không
export function withPreorder(body: unknown) {
  return body && typeof body === "object" ? { ...body, preorder: isPreLaunch() } : body;
}
