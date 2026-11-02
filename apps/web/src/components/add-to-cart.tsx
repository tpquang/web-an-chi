"use client";

import { useState } from "react";
import { cart, useCart } from "@/lib/cart";
import { cartHref } from "@/lib/links";
import { Button } from "./ui/button";
import { QuantityInput } from "./ui/quantity-input";
import { showToast } from "./ui/toast";

export function AddToCart({ slug, stock }: { slug: string; stock: number }) {
  const [quantity, setQuantity] = useState(1);
  const inCart = useCart().find((item) => item.slug === slug)?.quantity ?? 0;
  const room = Math.max(0, stock - inCart);

  if (stock === 0) {
    return <p className="font-medium text-ink-2">Sản phẩm tạm hết hàng. Bạn có thể xem các sản phẩm khác cùng danh mục bên dưới.</p>;
  }

  function add() {
    if (room === 0) {
      showToast({ type: "error", title: "Đã đủ số lượng còn lại", desc: `Giỏ của bạn đã có ${inCart} sản phẩm này, bằng số shop còn.` });
      return;
    }
    const total = cart.add(slug, Math.min(quantity, room), stock);
    setQuantity(1);
    showToast({
      title: "Đã thêm vào giỏ",
      desc: `Giỏ đang có ${total} sản phẩm này. Bạn có thể đặt hàng khi đã chọn xong.`,
      action: { href: cartHref, label: "Xem giỏ hàng" },
    });
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
