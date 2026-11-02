import { routeProxy } from "@/lib/route-proxy";

export const GET = routeProxy("/account/me", { method: "GET" });
export const PATCH = routeProxy("/account/me", { method: "PATCH" });
