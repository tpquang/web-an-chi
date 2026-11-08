import { notFound, permanentRedirect } from "next/navigation";
import { getRedirects } from "./api";

// Chỉ dùng ở server (api.ts là server-only), nên tách khỏi seo.ts mà component client cũng nạp.
// Không có trang ở đường dẫn này: nếu slug từng đổi thì 308 sang URL mới, không thì 404
export async function notFoundOrRedirect(path: string): Promise<never> {
  const target = (await getRedirects())[path];
  if (target && target !== path) permanentRedirect(target);
  notFound();
}
