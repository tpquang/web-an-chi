import { routeProxy } from "@/lib/route-proxy";

export const POST = routeProxy("/account/login", { session: "start" });
