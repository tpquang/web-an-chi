import { readFile } from "node:fs/promises";
import path from "node:path";

// Chỉ có khi `next dev`: trả vài khách trong sample-data.json để điền nhanh form đặt hàng
export async function GET() {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  const file = path.join(process.cwd(), "../api/prisma/sample-data.json");
  const sample = JSON.parse(await readFile(file, "utf8"));
  // Không trả mật khẩu mẫu ra trình duyệt
  const customers = sample.customers.slice(0, 3).map(({ password: _password, ...customer }: { password?: string }) => customer);
  return Response.json({ data: customers });
}
