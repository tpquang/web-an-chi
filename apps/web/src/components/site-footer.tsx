import Link from "next/link";
import type { Store } from "@/lib/api";
import { footerNav } from "@/lib/nav";
import { site } from "@/lib/site";
import { BrandLogo } from "./brand-mark";
import { MarketplaceLinks } from "./marketplace-links";
import { PageFrame } from "./ui/layout";

// minimal: giỏ và thanh toán không có link dẫn ra ngoài theo anchi-growth luật 4
export function SiteFooter({ store, minimal }: { store: Store | null; minimal?: boolean }) {
  return (
    <footer className="mt-24 pb-[max(24px,env(safe-area-inset-bottom))] text-sm">
      <PageFrame>
        <div className="grid gap-8 rounded-3xl border border-edge bg-surface p-6 md:grid-cols-3 md:p-10">
          <div>
            <BrandLogo className="text-3xl text-brand" />
            <p className="mt-3 max-w-[32ch] text-ink-2">Trầm hương ghi rõ xuất xứ, kích thước và cách dùng. Giao hàng toàn quốc.</p>
            {store && (
              <address className="mt-4 flex flex-col gap-1 not-italic text-ink-2">
                {store.address && <span>{store.address}</span>}
                {store.phone && (
                  <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="hover:text-wood">
                    Điện thoại: {store.phone}
                  </a>
                )}
                {store.email && (
                  <a href={`mailto:${store.email}`} className="hover:text-wood">
                    Email: {store.email}
                  </a>
                )}
                {store.openingHours && <span>Giờ làm việc: {store.openingHours}</span>}
              </address>
            )}
          </div>
          <nav aria-label="Liên kết cuối trang">
            <ul className="flex flex-col">
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex min-h-11 items-center hover:text-wood">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {!minimal && store && (store.shopeeUrl || store.tiktokUrl) && (
            <div>
              <p className="font-serif text-lg font-semibold">An Chi trên sàn thương mại</p>
              <MarketplaceLinks
                shopeeUrl={store.shopeeUrl}
                tiktokUrl={store.tiktokUrl}
                medium="footer"
                content="gian-hang"
                className="mt-3"
              />
            </div>
          )}
        </div>
        <p className="mt-6 px-2 text-ink-3">
          © {new Date().getFullYear()} {site.name}
        </p>
      </PageFrame>
    </footer>
  );
}
