import { routeProxy } from "@/lib/route-proxy";

const devLogin = routeProxy("/account/dev-login", { session: "start" });

// Chỉ có khi `next dev`. API cũng chỉ mở endpoint này khi DEV_LOGIN=on
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  return devLogin(request);
}
