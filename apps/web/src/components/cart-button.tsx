"use client";

import { useCartCount } from "@/lib/cart";
import { openCartDrawer, useCartDrawerOpen } from "@/lib/cart-drawer";
import { CartDrawer } from "./cart/cart-drawer";
import { BagIcon } from "./icons";
import { Badge } from "./ui/button";

// Nút giỏ trên header mở bảng giỏ hàng bên phải. Trang /gio-hang vẫn có cho khách xem đầy đủ
export function CartButton() {
  const count = useCartCount();
  const open = useCartDrawerOpen();
  return (
    <>
      <button
        type="button"
        onClick={openCartDrawer}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={count ? `Giỏ hàng, ${count} sản phẩm` : "Giỏ hàng"}
        title="Giỏ hàng"
        className="relative inline-flex size-11 items-center justify-center rounded-full text-ink transition-colors duration-(--d-fast) hover:bg-paper-2 hover:text-wood"
      >
        <BagIcon size={22} />
        {count > 0 && <Badge value={count} />}
      </button>
      <CartDrawer />
    </>
  );
}
