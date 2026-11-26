import { withPreorder } from "@/lib/preorder";
import { routeProxy } from "@/lib/route-proxy";

export const POST = routeProxy("/cart/quote", { body: withPreorder });
