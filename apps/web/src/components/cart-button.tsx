"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartCount } from "@/lib/cart";
import { cartHref } from "@/lib/links";
import { BagIcon } from "./icons";
import { Badge } from "./ui/button";

export function CartButton({ showLabel }: { showLabel?: boolean }) {
  const count = useCartCount();
  const current = usePathname() === cartHref;
  return (
    <Link
      href={cartHref}
      aria-label={count ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng"}
      aria-current={current ? "page" : undefined}
      className="relative inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2.5 text-ink hover:bg-paper-2 hover:text-wood"
    >
      <BagIcon size={22} />
      {/* Chữ chỉ hiện từ 960px; dưới đó icon và nhãn đọc cho trình đọc màn hình là đủ */}
      {showLabel && <span aria-hidden className="hidden lg:inline">Giỏ hàng</span>}
      {count > 0 && <Badge value={count} />}
    </Link>
  );
}
