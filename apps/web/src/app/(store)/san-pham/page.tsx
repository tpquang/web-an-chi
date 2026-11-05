import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-card";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { getCategories, getProducts } from "@/lib/api";
import { categoryHref, pagedHref, productsHref } from "@/lib/links";
import { pageMeta, parsePage } from "@/lib/seo";

type Props = { searchParams: Promise<{ trang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props) {
  const page = parsePage((await searchParams).trang);
  return pageMeta({
    title: page > 1 ? `Sản phẩm trầm hương, trang ${page}` : "Sản phẩm trầm hương",
    description:
      "Tất cả sản phẩm trầm hương tại An Chi: vòng tay, nhang, nụ trầm, trầm miếng và lư xông. Mỗi sản phẩm ghi rõ kích thước, xuất xứ và giá.",
    path: pagedHref(productsHref, page),
  });
}

export default async function ProductsPage({ searchParams }: Props) {
  const page = parsePage((await searchParams).trang);
  const [products, categories] = await Promise.all([getProducts({ page }), getCategories()]);
  if (page > products.meta.totalPages) notFound();

  return (
    <PageFrame>
      <PageHeader
        title="Sản phẩm trầm hương"
        desc="Vòng tay, nhang, nụ trầm, trầm miếng và phụ kiện xông trầm."
        crumbs={[
          { name: "Trang chủ", href: "/" },
          { name: "Sản phẩm", href: productsHref },
        ]}
      />
      <nav aria-label="Danh mục sản phẩm" className="mb-8">
        <ul className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={categoryHref(category.slug)}
                className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm hover:border-wood hover:text-wood"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {products.data.length === 0 ? (
        <EmptyState title="Shop đang cập nhật sản phẩm." desc="Bạn quay lại sau ít ngày, hoặc đọc các bài hướng dẫn chọn trầm trong lúc chờ." />
      ) : (
        <ProductGrid products={products.data} priorityCount={4} />
      )}
      <Pagination
        page={page}
        totalPages={products.meta.totalPages}
        hrefFor={(p) => pagedHref(productsHref, p)}
        label="Phân trang sản phẩm"
      />
    </PageFrame>
  );
}
