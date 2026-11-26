"use client";

import { useState } from "react";
import { cart, useCart } from "@/lib/cart";
import { openCartDrawer } from "@/lib/cart-drawer";
import { trackEvent } from "@/lib/track";
import { Button } from "./ui/button";
import { QuantityInput } from "./ui/quantity-input";
import { showToast } from "./ui/toast";

// Đơn đặt chờ trước ngày mở bán không giới hạn theo tồn kho (shop nhập thêm trước ngày giao, API cũng cho qua),
// chỉ chặn ở mức tối đa của một dòng trong giỏ
const PREORDER_MAX = 99;

export function AddToCart({ slug, stock, preorder }: { slug: string; stock: number; preorder?: boolean }) {
  const [quantity, setQuantity] = useState(1);
  const inCart = useCart().find((item) => item.slug === slug)?.quantity ?? 0;
  const limit = preorder ? PREORDER_MAX : stock;
  const room = Math.max(0, limit - inCart);

  if (limit === 0) {
    return <p className="font-medium text-ink-2">Sản phẩm tạm hết hàng. Bạn có thể xem các sản phẩm khác cùng danh mục bên dưới.</p>;
  }

  function add() {
    if (room === 0) {
      showToast({
        type: "error",
        title: preorder ? "Đã đủ số lượng tối đa" : "Đã đủ số lượng còn lại",
        desc: preorder ? `Giỏ của bạn đã có ${inCart} sản phẩm này. Cần nhiều hơn, bạn nhắn shop nhé.` : `Giỏ của bạn đã có ${inCart} sản phẩm này, bằng số shop còn.`,
      });
      return;
    }
    const added = Math.min(quantity, room);
    cart.add(slug, added, limit);
    trackEvent("add_to_cart", { items: [{ item_id: slug, quantity: added }] });
    setQuantity(1);
    // Mở bảng giỏ bên phải để khách thấy ngay món vừa thêm và nút thanh toán
    openCartDrawer();
  }

  return (
    <div className="flex flex-col gap-4">
      <QuantityInput value={quantity} max={Math.max(1, room)} onChange={setQuantity} label="Chọn số lượng" disabled={room === 0} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button size="lg" onClick={add} className="sm:min-w-56" disabled={room === 0}>
          Thêm vào giỏ
        </Button>
        {inCart > 0 && <p className="text-sm text-ink-2">Đã có {inCart} trong giỏ.</p>}
      </div>
    </div>
  );
}
