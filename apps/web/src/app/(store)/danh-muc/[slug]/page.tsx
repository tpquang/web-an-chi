import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductGrid } from "@/components/product-card";
import { PageFrame, PageHeader, Section } from "@/components/ui/layout";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { getCategories, getCategory, getProducts } from "@/lib/api";
import { paragraphs } from "@/lib/content";
import { categoryHref, pagedHref, productsHref } from "@/lib/links";
import { pageMeta, parsePage } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ trang?: string | string[] }> };

const loadCategory = cache(async (slug: string) => {
  const category = await getCategory(slug);
  if (!category) notFound();
  return category;
});

export async function generateMetadata({ params, searchParams }: Props) {
  const [category, page] = await Promise.all([loadCategory((await params).slug), searchParams.then((s) => parsePage(s.trang))]);
  const title = category.metaTitle ?? category.name;
  return pageMeta({
    title: page > 1 ? `${title}, trang ${page}` : title,
    description: category.metaDescription ?? category.description,
    path: pagedHref(categoryHref(category.slug), page),
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await loadCategory((await params).slug);
  const page = parsePage((await searchParams).trang);
  const [products, categories] = await Promise.all([getProducts({ category: category.slug, page }), getCategories()]);
  if (page > products.meta.totalPages) notFound();
  const others = categories.filter((item) => item.id !== category.id);
  const guide = paragraphs(category.guide);

  return (
    <PageFrame>
      <PageHeader
        title={category.name}
        desc={category.description}
        crumbs={[
          { name: "Trang chủ", href: "/" },
          { name: category.name, href: categoryHref(category.slug) },
        ]}
      />
      {products.data.length === 0 ? (
        <EmptyState
          title="Danh mục này chưa có sản phẩm đang bán."
          desc="Bạn xem các danh mục khác hoặc toàn bộ sản phẩm của shop."
          action={
            <Link href={productsHref} className="font-medium text-wood underline-offset-4 hover:underline">
              Xem tất cả sản phẩm
            </Link>
          }
        />
      ) : (
        <ProductGrid products={products.data} priorityCount={4} />
      )}
      <Pagination
        page={page}
        totalPages={products.meta.totalPages}
        hrefFor={(p) => pagedHref(categoryHref(category.slug), p)}
        label={`Phân trang ${category.name}`}
      />

      {guide.length > 0 && page === 1 && (
        <Section title={`Cách chọn ${category.name.toLowerCase()}`} id="huong-dan">
          <div className="max-w-[68ch] space-y-4 leading-[1.75]">
            {guide.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </Section>
      )}

      {others.length > 0 && (
        <Section title="Danh mục khác" id="danh-muc-khac">
          <ul className="flex flex-wrap gap-2">
            {others.map((item) => (
              <li key={item.id}>
                <Link
                  href={categoryHref(item.slug)}
                  className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-sm hover:border-wood hover:text-wood"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </PageFrame>
  );
}
