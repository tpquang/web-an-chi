import type { Metadata } from "next";
import { OrderLookupForm } from "@/components/order-lookup-form";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { privateMeta } from "@/lib/seo";

export const metadata: Metadata = { title: "Tra cứu đơn hàng", ...privateMeta };

export default function OrderLookupPage() {
  return (
    <PageFrame>
      <PageHeader title="Tra cứu đơn hàng" desc="Nhập mã đơn và số điện thoại bạn dùng khi đặt hàng." />
      <OrderLookupForm />
    </PageFrame>
  );
}
