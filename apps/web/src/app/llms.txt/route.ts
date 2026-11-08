import { getCategories, getPosts } from "@/lib/api";
import { aboutHref, braceletHref, categoryHref, postHref, postsHref, productsHref } from "@/lib/links";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

export const revalidate = 3600;

// llms.txt: bản tóm tắt site cho trợ lý AI (ChatGPT, Perplexity...). Google không dùng.
// Chỉ liệt kê trang công khai đã index; bản test không có file này
export async function GET() {
  if (!site.indexable) return new Response("Not found", { status: 404 });
  const [categories, posts] = await Promise.all([getCategories(), getPosts({ limit: 100 })]);
  const line = (name: string, path: string, note?: string | null) => `- [${name}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`;

  const body = [
    `# ${site.name}`,
    "",
    `> ${site.description} Bán online, giao hàng toàn quốc.`,
    "",
    "## Trang chính",
    line("Giới thiệu", aboutHref, "nguồn gốc, nguyên tắc bán hàng, giao hàng và đổi trả"),
    line("Tất cả sản phẩm", productsHref),
    line("Tự thiết kế vòng tay", braceletHref, "chọn từng hạt trầm và charm"),
    "",
    "## Danh mục sản phẩm",
    ...categories.map((c) => line(c.name, categoryHref(c.slug), c.description)),
    "",
    "## Bài viết",
    line("Tất cả bài viết", postsHref),
    ...posts.data.map((p) => line(p.title, postHref(p.slug), p.excerpt)),
    "",
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
