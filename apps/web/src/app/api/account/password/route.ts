import { routeProxy } from "@/lib/route-proxy";

// Gửi kèm token hiện tại, API trả token mới (phiên cũ ở thiết bị khác hết hiệu lực) thì cất lại vào cookie
export const POST = routeProxy("/account/password", { session: "renew" });
