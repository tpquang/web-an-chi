import { getCategories, getPosts, getSeoPages } from "@/lib/api";
import { aboutHref, braceletHref, categoryHref, postHref, postsHref, productsHref } from "@/lib/links";
import { absoluteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

export const revalidate = 3600;

// llms.txt: bản tóm tắt site cho trợ lý AI (ChatGPT, Perplexity...). Google không dùng.
// Chỉ liệt kê trang công khai đã index; bản test không có file này
export async function GET() {
  if (!site.indexable) return new Response("Not found", { status: 404 });
  const [allCategories, allPosts, pages] = await Promise.all([getCategories(), getPosts({ limit: 100 }), getSeoPages()]);
  // Bỏ trang đã tắt "Hiện trên Google" trong CMS
  const categories = allCategories.filter((c) => !c.noindex);
  const posts = allPosts.data.filter((p) => !p.noindex);
  const shown = (key: string) => !pages[key]?.noindex;
  const line = (name: string, path: string, note?: string | null) => `- [${name}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`;

  const body = [
    `# ${site.name}`,
    "",
    `> ${site.description} Bán online, giao hàng toàn quốc.`,
    "",
    "## Trang chính",
    ...(shown("about") ? [line("Giới thiệu", aboutHref, "nguồn gốc, nguyên tắc bán hàng, giao hàng và đổi trả")] : []),
    ...(shown("products") ? [line("Tất cả sản phẩm", productsHref)] : []),
    ...(shown("bracelet") ? [line("Tự thiết kế vòng tay", braceletHref, "chọn từng hạt trầm và charm")] : []),
    "",
    "## Danh mục sản phẩm",
    ...categories.map((c) => line(c.name, categoryHref(c.slug), c.description)),
    "",
    "## Bài viết",
    ...(shown("posts") ? [line("Tất cả bài viết", postsHref)] : []),
    ...posts.map((p) => line(p.title, postHref(p.slug), p.excerpt)),
    "",
  ].join("\n");

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
