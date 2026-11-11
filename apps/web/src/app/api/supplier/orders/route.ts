import { routeProxy } from "@/lib/route-proxy";

export const POST = routeProxy("/supplier/orders", { session: "none" });
