"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

// Gửi view_item một lần khi trang sản phẩm mở. Không render gì
export function TrackViewItem({ slug, name, priceVnd }: { slug: string; name: string; priceVnd: number }) {
  useEffect(() => {
    trackEvent("view_item", { value: priceVnd, items: [{ item_id: slug, item_name: name, price: priceVnd, quantity: 1 }] });
  }, [slug, name, priceVnd]);
  return null;
}
