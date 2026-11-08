import { z } from "zod";
import { prisma } from "./prisma.js";

// Redirect 308 khi đổi slug: { "/san-pham/cu": "/san-pham/moi" }, lưu ở setting "redirects".
// Web chỉ tra bảng này khi không tìm thấy trang, nên không tốn gì cho trang bình thường.
// Đường dẫn khớp lib/links.ts bên web
export const PATH_PREFIX = {
  product: "/san-pham/",
  category: "/danh-muc/",
  post: "/bai-viet/",
  postCategory: "/chu-de/",
} as const;

const KEY = "redirects";
const mapSchema = z.record(z.string(), z.string());

export async function getRedirects(): Promise<Record<string, string>> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  return mapSchema.safeParse(row?.value).data ?? {};
}

// Ghi khi slug đổi. Nối thẳng chuỗi cũ về đích mới để luôn chỉ một bước,
// và bỏ redirect đang trỏ từ chính URL mới (đổi slug quay lại tên cũ)
export async function recordSlugChange(kind: keyof typeof PATH_PREFIX, oldSlug: string, newSlug: string) {
  if (oldSlug === newSlug) return;
  const from = PATH_PREFIX[kind] + oldSlug;
  const to = PATH_PREFIX[kind] + newSlug;
  const map = await getRedirects();
  for (const [key, target] of Object.entries(map)) if (target === from) map[key] = to;
  delete map[to];
  map[from] = to;
  await prisma.setting.upsert({ where: { key: KEY }, update: { value: map }, create: { key: KEY, value: map } });
}
