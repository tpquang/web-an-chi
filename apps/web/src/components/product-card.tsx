import Link from "next/link";
import type { Product } from "@/lib/api";
import { productHref } from "@/lib/links";
import { ArrowRightIcon } from "./icons";
import { ProductImage } from "./product-image";
import { Price } from "./ui/price";
import { Tag } from "./ui/tag";

// Cả thẻ là link, không có nút mua trên thẻ theo anchi-growth bậc 1. Mũi tên tròn chỉ là dấu hiệu bấm được
export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  return (
    <Link href={productHref(product.slug)} className="group flex h-full flex-col rounded-3xl border border-edge bg-surface p-2 transition-shadow duration-(--d-base) hover:shadow-e2">
      <div className="overflow-hidden rounded-2xl">
        <ProductImage
          image={product.images[0]}
          alt={product.name}
          sizes="(min-width: 960px) 280px, (min-width: 720px) 33vw, 50vw"
          priority={priority}
          className="transition-transform duration-(--d-slow) ease-(--ease-out) group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      </div>
      <div className="flex flex-1 flex-col px-2 pt-3 pb-2 sm:px-3">
        <p className="text-[13px] text-ink-3">{product.category.name}</p>
        <h3 className="mt-0.5 line-clamp-2 font-medium group-hover:text-wood">{product.name}</h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Price value={product.priceVnd} compareAt={product.compareAtPriceVnd} />
            {product.stock === 0 && <Tag>Hết hàng</Tag>}
          </div>
          <span
            aria-hidden
            className="hidden size-9 flex-none items-center justify-center rounded-full bg-paper-2 text-ink transition-colors duration-(--d-fast) group-hover:bg-wood group-hover:text-on-wood sm:inline-flex"
          >
            <ArrowRightIcon size={18} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
