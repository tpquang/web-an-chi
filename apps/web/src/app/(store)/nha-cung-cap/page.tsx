import type { Metadata } from "next";
import { SupplierPortal } from "@/components/supplier-portal";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { privateMeta } from "@/lib/seo";

export const metadata: Metadata = { title: "Nhà cung cấp", ...privateMeta };

// Trang riêng cho nhà cung cấp, vào bằng mã giới thiệu shop gửi. Không có trong menu và sitemap
export default function SupplierPage() {
  return (
    <PageFrame>
      <PageHeader title="Đơn đặt hàng nhà cung cấp" desc="Nhập mã giới thiệu An Chi gửi bạn để xem các đơn shop đã đặt." />
      <SupplierPortal />
    </PageFrame>
  );
}
