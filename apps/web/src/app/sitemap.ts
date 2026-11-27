import type { MetadataRoute } from "next";
import { getCategories, getContentPages, getPostCategories, getPosts, getProducts, getSeoPages, type Paged } from "@/lib/api";
import { aboutHref, braceletHref, categoryHref, contentPageHref, policyHref, postHref, postsHref, productHref, productsHref, topicHref } from "@/lib/links";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

// Lấy hết các trang. BE lỗi thì ném tiếp: thà sitemap lỗi còn hơn sitemap thiếu URL
async function all<T>(load: (page: number) => Promise<Paged<T>>) {
  const first = await load(1);
  const rest = await Promise.all(Array.from({ length: first.meta.totalPages - 1 }, (_, i) => load(i + 2)));
  return [first, ...rest].flatMap((page) => page.data);
}

// Sitemap chỉ có trang được index: trang tắt "Hiện trên Google" trong CMS bị bỏ ra
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, posts, topics, pages, contentPages] = await Promise.all([
    all((page) => getProducts({ page, limit: 100 })),
    getCategories(),
    all((page) => getPosts({ page, limit: 100 })),
    getPostCategories(),
    getSeoPages(),
    getContentPages(),
  ]);

  const staticPages = [
    { key: "home", path: "/" },
    { key: "products", path: productsHref },
    { key: "bracelet", path: braceletHref },
    { key: "about", path: aboutHref },
    { key: "posts", path: postsHref },
    { key: "policy", path: policyHref },
  ].filter((page) => !pages[page.key]?.noindex);

  return [
    ...staticPages.map((page) => ({ url: absoluteUrl(page.path) })),
    // Danh mục chưa có sản phẩm đang bán là trang mỏng, trang cũng noindex
    ...categories.filter((c) => !c.noindex && (c._count?.products ?? 0) > 0).map((category) => ({ url: absoluteUrl(categoryHref(category.slug)), lastModified: category.updatedAt })),
    // Trang sản phẩm mỏng (chưa ảnh hoặc mô tả) cũng đang noindex
    ...products
      .filter((product) => !product.noindex && product.images.length > 0 && product.description)
      .map((product) => ({ url: absoluteUrl(productHref(product.slug)), lastModified: product.updatedAt })),
    ...contentPages.filter((p) => !p.noindex).map((page) => ({ url: absoluteUrl(contentPageHref(page.slug)), lastModified: page.updatedAt })),
    ...topics.filter((t) => !t.noindex).map((topic) => ({ url: absoluteUrl(topicHref(topic.slug)), lastModified: topic.updatedAt })),
    ...posts.filter((p) => !p.noindex).map((post) => ({ url: absoluteUrl(postHref(post.slug)), lastModified: post.updatedAt })),
  ];
}
