import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AddToCart } from "@/components/add-to-cart";
import { MarketplaceLinks } from "@/components/marketplace-links";
import { ProductGrid } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { PageFrame, Section } from "@/components/ui/layout";
import { Price } from "@/components/ui/price";
import { Tag } from "@/components/ui/tag";
import { getProduct, getProducts, getStore } from "@/lib/api";
import { paragraphs } from "@/lib/content";
import { categoryHref, postHref, productHref } from "@/lib/links";
import { absoluteUrl, pageMeta, safeJsonLd } from "@/lib/seo";
import { formatDate, formatVnd } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

// Không dựng sẵn lúc build; mỗi slug dựng ở lần xem đầu rồi cache theo revalidate của fetch
export function generateStaticParams() {
  return [];
}

const loadProduct = cache(async (slug: string) => {
  const product = await getProduct(slug);
  if (!product) notFound();
  return product;
});

// Chưa có ảnh thật hoặc mô tả thì là trang mỏng, chưa cho index
function isThin(product: Awaited<ReturnType<typeof loadProduct>>) {
  return product.images.length === 0 || !product.description;
}

export async function generateMetadata({ params }: Props) {
  const product = await loadProduct((await params).slug);
  return pageMeta({
    title: product.metaTitle ?? product.name,
    description:
      product.metaDescription ??
      ([product.summary, product.description].filter(Boolean).join(" ") ||
        `${product.name}, giá ${formatVnd(product.priceVnd)}.`),
    path: productHref(product.slug),
    noindex: isThin(product),
    image: product.images[0]?.url,
  });
}

export default async function ProductPage({ params }: Props) {
  const product = await loadProduct((await params).slug);
  const [related, store] = await Promise.all([
    getProducts({ category: product.category.slug, exclude: product.slug, limit: 4 }),
    getStore(),
  ]);

  const url = absoluteUrl(productHref(product.slug));
  const crumbs = [
    { name: "Trang chủ", href: "/" },
    { name: product.category.name, href: categoryHref(product.category.slug) },
    { name: product.name, href: productHref(product.slug) },
  ];
  const specs = [...(product.origin ? [{ label: "Xuất xứ", value: product.origin }] : []), ...(product.specs ?? [])];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.summary ?? undefined,
    image: product.images.map((image) => image.url),
    category: product.category.name,
    url,
    offers: {
      "@type": "Offer",
      url,
      price: product.priceVnd,
      priceCurrency: "VND",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  const { flatFeeVnd, freeFromVnd, eta } = store.shipping;

  return (
    <PageFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <PageBreadcrumb crumbs={crumbs} />

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-7">
          <ProductImage image={product.images[0]} alt={product.name} sizes="(min-width: 960px) 680px, 100vw" priority />
        </div>

        <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          <div>
            <Link href={categoryHref(product.category.slug)} className="text-sm text-ink-3 hover:text-wood">
              {product.category.name}
            </Link>
            <h1 className="mt-1 font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] font-medium">{product.name}</h1>
            {product.summary && <p className="mt-3 text-lg text-ink-2">{product.summary}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Price value={product.priceVnd} compareAt={product.compareAtPriceVnd} size="page" />
            {product.stock > 0 ? <Tag tone="ok">Còn {product.stock} sản phẩm</Tag> : <Tag>Hết hàng</Tag>}
          </div>
          <AddToCart slug={product.slug} stock={product.stock} />
          <p className="text-sm text-ink-2">
            Phí giao {formatVnd(flatFeeVnd)}
            {freeFromVnd ? `, miễn phí cho đơn từ ${formatVnd(freeFromVnd)}` : ""}. Giao trong {eta}.
          </p>
          <div className="border-t border-line pt-5">
            <p className="mb-2 text-sm text-ink-2">Bạn quen mua trên sàn? Sản phẩm này cũng có tại:</p>
            <MarketplaceLinks shopeeUrl={product.shopeeUrl} tiktokUrl={product.tiktokUrl} medium="san-pham" content={product.slug} />
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-10 lg:col-span-8">
          {specs.length > 0 && (
            <section aria-labelledby="thong-so">
              <h2 id="thong-so" className="mb-4 font-serif text-[32px] leading-[1.15] font-medium">
                Thông số
              </h2>
              <dl className="divide-y divide-line rounded-3xl border border-edge bg-surface">
                {specs.map((spec) => (
                  <div key={spec.label} className="grid grid-cols-[minmax(120px,40%)_1fr] gap-4 px-4 py-3 text-sm">
                    <dt className="text-ink-3">{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {product.description && (
            <section aria-labelledby="mo-ta">
              <h2 id="mo-ta" className="mb-4 font-serif text-[32px] leading-[1.15] font-medium">
                Mô tả
              </h2>
              <div className="max-w-[68ch] space-y-4 leading-[1.75]">
                {paragraphs(product.description).map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            </section>
          )}
          {product.usage && (
            <section aria-labelledby="cach-dung">
              <h2 id="cach-dung" className="mb-4 font-serif text-[32px] leading-[1.15] font-medium">
                Cách dùng và bảo quản
              </h2>
              <div className="max-w-[68ch] space-y-4 leading-[1.75]">
                {paragraphs(product.usage).map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </div>
            </section>
          )}
          <section aria-labelledby="giao-hang">
            <h2 id="giao-hang" className="mb-4 font-serif text-[32px] leading-[1.15] font-medium">
              Giao hàng và đổi trả
            </h2>
            <ul className="max-w-[68ch] list-disc space-y-2 pl-5 leading-[1.75]">
              <li>Giao toàn quốc trong {eta}.</li>
              <li>
                Phí giao {formatVnd(flatFeeVnd)}
                {freeFromVnd ? `, miễn phí cho đơn từ ${formatVnd(freeFromVnd)}` : ""}.
              </li>
              {store.returnPolicy && <li>{store.returnPolicy}</li>}
            </ul>
          </section>
        </div>

        {product.posts.length > 0 && (
          <aside aria-labelledby="bai-lien-quan" className="lg:col-span-4">
            <h2 id="bai-lien-quan" className="mb-4 font-serif text-2xl leading-tight font-semibold">
              Bài viết liên quan
            </h2>
            <ul className="flex flex-col gap-3">
              {product.posts.map((post) => (
                <li key={post.slug}>
                  <Link href={postHref(post.slug)} className="block rounded-2xl border border-edge bg-surface p-4 hover:border-wood">
                    <span className="font-medium">{post.title}</span>
                    <span className="mt-1 block text-[13px] text-ink-3">{formatDate(post.publishedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      {related.data.length > 0 && (
        <Section title={`${product.category.name} khác`} id="san-pham-lien-quan">
          <ProductGrid products={related.data} />
        </Section>
      )}
    </PageFrame>
  );
}
