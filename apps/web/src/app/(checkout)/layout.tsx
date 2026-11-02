import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { getStore } from "@/lib/api";

// Khu đặt hàng: không banner, không link ra sàn khác
export default async function CheckoutLayout({ children }: { children: ReactNode }) {
  const store = await getStore().catch(() => null);
  return (
    <>
      <main id="noi-dung" className="flex-1 pt-6 md:pt-10">
        {children}
      </main>
      <SiteFooter store={store} minimal />
    </>
  );
}
