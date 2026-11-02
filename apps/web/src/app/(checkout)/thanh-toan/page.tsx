import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { privateMeta } from "@/lib/seo";

export const metadata: Metadata = { title: "Đặt hàng", ...privateMeta };

export default function CheckoutPage() {
  return (
    <PageFrame>
      <PageHeader
        title="Đặt hàng"
        desc="Bạn không cần tạo tài khoản. Shop gọi xác nhận trước khi giao."
      />
      <CheckoutForm />
    </PageFrame>
  );
}
