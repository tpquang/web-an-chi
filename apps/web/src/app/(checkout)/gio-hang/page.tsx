import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { privateMeta } from "@/lib/seo";

export const metadata: Metadata = { title: "Giỏ hàng", ...privateMeta };

export default function CartPage() {
  return (
    <PageFrame>
      <PageHeader title="Giỏ hàng" />
      <CartView />
    </PageFrame>
  );
}
