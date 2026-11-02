"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartCount } from "@/lib/cart";
import { cartHref } from "@/lib/links";
import { BagIcon } from "./icons";
import { Badge } from "./ui/button";

export function CartButton() {
  const count = useCartCount();
  const current = usePathname() === cartHref;
  return (
    <Link
      href={cartHref}
      aria-label={count ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng"}
      aria-current={current ? "page" : undefined}
      title="Giỏ hàng"
      className="relative inline-flex size-11 items-center justify-center rounded-full text-ink transition-colors duration-(--d-fast) hover:bg-paper-2 hover:text-wood"
    >
      <BagIcon size={22} />
      {count > 0 && <Badge value={count} />}
    </Link>
  );
}
