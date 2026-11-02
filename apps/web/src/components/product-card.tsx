import Link from "next/link";
import type { Product } from "@/lib/api";
import { productHref } from "@/lib/links";
import { ProductImage } from "./product-image";
import { Price } from "./ui/price";
import { Tag } from "./ui/tag";

// Cả thẻ là link, không có nút mua trên thẻ theo anchi-growth bậc 1
export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  return (
    <Link href={productHref(product.slug)} className="group flex flex-col">
      <ProductImage
        image={product.images[0]}
        alt={product.name}
        sizes="(min-width: 960px) 280px, (min-width: 720px) 33vw, 50vw"
        priority={priority}
      />
      <p className="mt-3 text-sm text-ink-3">{product.category.name}</p>
      <h3 className="line-clamp-2 font-medium group-hover:text-wood">{product.name}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Price value={product.priceVnd} compareAt={product.compareAtPriceVnd} />
        {product.stock === 0 && <Tag>Hết hàng</Tag>}
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
