import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { getStore } from "@/lib/api";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  // Footer thiếu thông tin liên hệ vẫn tốt hơn để lỗi cấu hình làm hỏng mọi trang
  const store = await getStore().catch(() => null);
  return (
    <>
      <main id="noi-dung" className="flex-1 pt-6 md:pt-10">
        {children}
      </main>
      <SiteFooter store={store} />
    </>
  );
}
