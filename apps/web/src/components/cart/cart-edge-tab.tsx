"use client";

import { usePathname } from "next/navigation";
import { useCartCount } from "@/lib/cart";
import { openCartDrawer } from "@/lib/cart-drawer";
import { cartHref } from "@/lib/links";
import { BagIcon } from "../icons";

// Tab giỏ hàng dính cạnh phải, chỉ màn máy tính (từ 960px). Mờ 50% để không giành chú ý với nội dung, rê chuột hoặc focus thì rõ hẳn.
// CartLayer nằm ngoài header (header có backdrop-filter) nên position: fixed bám đúng cạnh màn hình.
// Ẩn ở trang giỏ hàng (khu đặt hàng giữ sạch) và khi bảng giỏ đang mở
export function CartEdgeTab({ hidden }: { hidden: boolean }) {
  const count = useCartCount();
  const pathname = usePathname();

  if (hidden || pathname === cartHref) return null;

  return (
    <button
      type="button"
      onClick={openCartDrawer}
      aria-haspopup="dialog"
      aria-label={count ? `Mở giỏ hàng, ${count} sản phẩm` : "Mở giỏ hàng"}
      className="fixed top-1/2 right-0 z-(--z-sticky) hidden -translate-y-1/2 translate-x-1 flex-col items-center gap-2 rounded-l-2xl border border-r-0 border-edge bg-surface py-4 pr-3 pl-2.5 text-ink opacity-50 shadow-e3 transition-[opacity,translate] duration-(--d-base) ease-(--ease-out) hover:translate-x-0 hover:text-wood hover:opacity-100 focus-visible:translate-x-0 focus-visible:opacity-100 motion-reduce:transition-none starting:opacity-0 lg:flex"
    >
      <BagIcon size={22} />
      {count > 0 && (
        <span aria-hidden className="inline-flex min-w-6 items-center justify-center rounded-full bg-wood px-1.5 text-xs leading-6 font-semibold text-on-wood tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
      <span aria-hidden className="text-sm font-medium [writing-mode:vertical-rl]">
        Giỏ hàng
      </span>
    </button>
  );
}
