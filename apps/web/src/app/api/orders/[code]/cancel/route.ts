import { routeProxy } from "@/lib/route-proxy";

// Khách tự huỷ đơn khi shop chưa xác nhận. API kiểm số điện thoại của đơn
export const POST = routeProxy((params) => `/orders/${params.code}/cancel`, { session: "none" });
