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
    <footer className="mt-24 border-t border-line bg-paper-2 py-10 pb-[max(40px,env(safe-area-inset-bottom))] text-sm">
      <PageFrame className="grid gap-8 md:grid-cols-3">
        <div>
          <BrandLogo className="text-3xl text-wood" />
          {store && (
            <address className="mt-3 flex flex-col gap-1 not-italic text-ink-2">
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
            <p className="font-medium">An Chi trên sàn thương mại</p>
            <MarketplaceLinks
              shopeeUrl={store.shopeeUrl}
              tiktokUrl={store.tiktokUrl}
              medium="footer"
              content="gian-hang"
              className="mt-3"
            />
          </div>
        )}
      </PageFrame>
      <PageFrame className="mt-8 text-ink-3">
        © {new Date().getFullYear()} {site.name}
      </PageFrame>
    </footer>
  );
}
