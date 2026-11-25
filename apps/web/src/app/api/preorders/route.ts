import { routeProxy } from "@/lib/route-proxy";

// Đặt chờ trước ngày mở bán: không cần phiên khách
export const POST = routeProxy("/preorders", { session: "none" });
