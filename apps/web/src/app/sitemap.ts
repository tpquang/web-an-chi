import type { MetadataRoute } from "next";
import { getCategories, getPostCategories, getPosts, getProducts, type Paged } from "@/lib/api";
import { categoryHref, postHref, postsHref, productHref, productsHref, topicHref } from "@/lib/links";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

// Lấy hết các trang. BE lỗi thì ném tiếp: thà sitemap lỗi còn hơn sitemap thiếu URL
async function all<T>(load: (page: number) => Promise<Paged<T>>) {
  const first = await load(1);
  const rest = await Promise.all(Array.from({ length: first.meta.totalPages - 1 }, (_, i) => load(i + 2)));
  return [first, ...rest].flatMap((page) => page.data);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, posts, topics] = await Promise.all([
    all((page) => getProducts({ page, limit: 100 })),
    getCategories(),
    all((page) => getPosts({ page, limit: 100 })),
    getPostCategories(),
  ]);

  return [
    { url: absoluteUrl("/") },
    { url: absoluteUrl(productsHref) },
    ...categories.map((category) => ({ url: absoluteUrl(categoryHref(category.slug)), lastModified: category.updatedAt })),
    // Trang sản phẩm mỏng đang noindex nên không đưa vào sitemap
    ...products
      .filter((product) => product.images.length > 0 && product.description)
      .map((product) => ({ url: absoluteUrl(productHref(product.slug)), lastModified: product.updatedAt })),
    { url: absoluteUrl(postsHref) },
    ...topics.map((topic) => ({ url: absoluteUrl(topicHref(topic.slug)), lastModified: topic.updatedAt })),
    ...posts.map((post) => ({ url: absoluteUrl(postHref(post.slug)), lastModified: post.updatedAt })),
  ];
}
