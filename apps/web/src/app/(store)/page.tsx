import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { PostGrid } from "@/components/post-card";
import { ProductGrid } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { PageFrame, Section } from "@/components/ui/layout";
import { getCategories, getPosts, getProducts, getStore } from "@/lib/api";
import { categoryHref, postHref, postsHref, productsHref } from "@/lib/links";
import { absoluteUrl, pageMeta, safeJsonLd } from "@/lib/seo";
import { formatVnd, site } from "@/lib/site";

export const metadata = pageMeta({
  title: `${site.name}: vòng tay, nhang và nụ trầm`,
  absoluteTitle: true,
  description:
    "Trầm hương An Chi: vòng tay, nhang, nụ trầm và trầm miếng, ghi rõ xuất xứ, kích thước, cách dùng. Giao hàng toàn quốc, đặt hàng không cần tài khoản.",
  path: "/",
});

const HUB_POST = "cach-phan-biet-tram-huong-that";

export default async function HomePage() {
  const [categories, featured, posts, store] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getPosts({ limit: 3 }),
    getStore(),
  ]);

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

  const { freeFromVnd, eta } = store.shipping;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <PageFrame>
        <section className="relative overflow-hidden rounded-xl bg-wood px-6 py-14 text-on-wood md:px-12 md:py-20">
          {/* Hoạ tiết logo mờ, chỉ một chỗ trên trang, không nằm sau chữ trên màn hẹp */}
          <div aria-hidden className="pointer-events-none absolute top-1/2 -right-16 hidden -translate-y-1/2 opacity-15 md:block lg:right-8">
            <BrandMark className="size-96" />
          </div>
          <h1 className="relative max-w-2xl font-serif text-[clamp(40px,5.6vw,72px)] leading-[1.05] font-medium">
            Trầm hương cho không gian sống của bạn
          </h1>
          <p className="relative mt-5 max-w-xl text-lg">
            Vòng tay, nhang, nụ trầm và trầm miếng. Mỗi sản phẩm ghi rõ kích thước, xuất xứ và cách dùng.
          </p>
          <Link
            href={productsHref}
            className="relative mt-8 inline-flex min-h-13 items-center rounded-md bg-on-wood px-6 text-lg font-medium text-wood hover:opacity-90"
          >
            Xem sản phẩm
          </Link>
        </section>

        <Section title="Danh mục" id="danh-muc">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={categoryHref(category.slug)}
                  className="flex h-full flex-col rounded-lg border border-line bg-surface p-5 transition-colors duration-(--d-fast) hover:border-wood"
                >
                  <span className="font-serif text-xl font-semibold">{category.name}</span>
                  {category.description && <span className="mt-2 line-clamp-2 text-sm text-ink-2">{category.description}</span>}
                  <span className="mt-3 text-[13px] text-ink-3">{category._count?.products ?? 0} sản phẩm</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        {featured.data.length > 0 && (
          <Section
            title="Sản phẩm tiêu biểu"
            id="tieu-bieu"
            action={<Button href={productsHref} variant="text">Xem tất cả sản phẩm</Button>}
          >
            <ProductGrid products={featured.data} />
          </Section>
        )}

        <Section title="Mua trầm ở An Chi" id="vi-sao">
          <ul className="grid gap-4 md:grid-cols-3">
            <li className="rounded-lg border border-line bg-surface p-5">
              <h3 className="font-serif text-xl font-semibold">Thông tin rõ ràng</h3>
              <p className="mt-2 text-sm text-ink-2">
                Mỗi sản phẩm ghi kích thước, trọng lượng và xuất xứ. Thông tin chưa xác minh được thì shop để trống, không phỏng đoán.
              </p>
            </li>
            <li className="rounded-lg border border-line bg-surface p-5">
              <h3 className="font-serif text-xl font-semibold">Giao hàng {eta}</h3>
              <p className="mt-2 text-sm text-ink-2">
                Phí giao hàng hiện ngay trong giỏ
                {freeFromVnd ? `, miễn phí cho đơn từ ${formatVnd(freeFromVnd)}` : ""}. Bạn đặt hàng không cần tạo tài khoản.
              </p>
            </li>
            {store.returnPolicy && (
              <li className="rounded-lg border border-line bg-surface p-5">
                <h3 className="font-serif text-xl font-semibold">Đổi trả</h3>
                <p className="mt-2 text-sm text-ink-2">{store.returnPolicy}</p>
              </li>
            )}
          </ul>
        </Section>

        <Section title="Cách chọn trầm hương" id="cach-chon">
          <div className="max-w-[68ch] space-y-4 leading-[1.75] text-ink-2">
            <p>
              Trầm hương là phần gỗ cây dó bầu đã tích tụ tinh dầu. Trầm tự nhiên hình thành trong nhiều năm nên hiếm và giá cao.
              Trầm cấy được tạo trên cây trồng, mùi nhẹ hơn và giá dễ tiếp cận hơn.
            </p>
            <p>
              Khi chọn, bạn nên hỏi rõ loại trầm, xuất xứ và có phụ gia hay không. Vòng tay chọn theo cỡ cổ tay; nhang chọn có tăm cho bàn thờ,
              không tăm cho phòng kín; nụ trầm dùng với lư xông hoặc thác khói.
            </p>
          </div>
          <Button href={postHref(HUB_POST)} variant="text" className="mt-4">
            Đọc cách phân biệt trầm hương thật
          </Button>
        </Section>

        {posts.data.length > 0 && (
          <Section title="Bài viết mới" id="bai-viet" action={<Button href={postsHref} variant="text">Xem tất cả bài viết</Button>}>
            <PostGrid posts={posts.data} />
          </Section>
        )}
      </PageFrame>
    </>
  );
}
