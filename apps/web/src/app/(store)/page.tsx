import { HomeBanner } from "@/components/home/home-banner";
import { IntroSlider } from "@/components/home/intro-slider";
import { ArrowRightIcon } from "@/components/icons";
import { PostGrid } from "@/components/post-card";
import { ProductGrid } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { PageFrame, Section } from "@/components/ui/layout";
import { getHome, getPosts, getProducts, getStore } from "@/lib/api";
import { postsHref, productsHref } from "@/lib/links";
import { absoluteUrl, pageMeta, safeJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMeta({
  title: `${site.name}: vòng tay, nhang và nụ trầm`,
  absoluteTitle: true,
  description:
    "Trầm hương An Chi: vòng tay, nhang, nụ trầm và trầm miếng, ghi rõ xuất xứ, kích thước, cách dùng. Giao hàng toàn quốc, đặt hàng không cần tài khoản.",
  path: "/",
});

// Năm khối theo thứ tự: banner, sản phẩm nổi bật, slide giới thiệu, bài viết nổi bật, footer (ở layout).
// Banner và slide cấu hình ở CMS. Sản phẩm tối đa 4, bài viết tối đa 3, giới hạn kiểm ở API.
export default async function HomePage() {
  const [home, featured, featuredPosts, store] = await Promise.all([
    getHome(),
    getProducts({ featured: true, limit: 4 }),
    getPosts({ featured: true, limit: 3 }),
    getStore(),
  ]);
  // Chưa chọn bài nổi bật thì hiện bài mới nhất, để khối không trống
  const posts = featuredPosts.data.length > 0 ? featuredPosts : await getPosts({ limit: 3 });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.name,
      url: absoluteUrl("/"),
      ...(store.phone ? { telephone: store.phone } : {}),
      ...(store.email ? { email: store.email } : {}),
      ...(store.address ? { address: store.address } : {}),
      sameAs: [store.shopeeUrl, store.tiktokUrl].filter((url) => url && !url.includes("/search")),
    },
    { "@context": "https://schema.org", "@type": "WebSite", name: site.name, url: absoluteUrl("/") },
  ];

  const seeAll = (href: string, label: string) => (
    <Button href={href} variant="outline">
      {label}
      <ArrowRightIcon size={18} />
    </Button>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <PageFrame>
        <HomeBanner banner={home.banner} />

        {featured.data.length > 0 && (
          <Section eyebrow="Sản phẩm nổi bật" title="Gợi ý từ An Chi" id="noi-bat" action={seeAll(productsHref, "Xem tất cả sản phẩm")}>
            <ProductGrid products={featured.data} />
          </Section>
        )}

        {home.slides.length > 0 && <IntroSlider slides={home.slides} label="Giới thiệu trầm hương" />}

        {posts.data.length > 0 && (
          <Section eyebrow="Bài viết nổi bật" title="Hiểu về trầm hương" id="bai-viet" action={seeAll(postsHref, "Xem tất cả bài viết")}>
            <PostGrid posts={posts.data} />
          </Section>
        )}
      </PageFrame>
    </>
  );
}
