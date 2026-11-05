"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { accountHref, categoryHref, loginHref, productsHref } from "@/lib/links";
import { mainNav } from "@/lib/nav";
import { site } from "@/lib/site";
import { useSignedIn } from "@/lib/use-signed-in";
import { BrandLogo } from "./brand-mark";
import { CartButton } from "./cart-button";
import { ChevronDownIcon, MenuIcon, UserIcon } from "./icons";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";
import { frameClass } from "./ui/layout";

export type NavCategory = { name: string; slug: string };

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Gạch chân chạy từ trái sang khi hover, giữ nguyên khi đang ở trang đó
const underline =
  "relative after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:origin-left after:scale-x-0 after:bg-wood after:transition-transform after:duration-(--d-base) after:ease-(--ease-out) hover:text-wood hover:after:scale-x-100 focus-visible:after:scale-x-100";
const underlineOn = "text-wood after:scale-x-100";

export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const signedIn = useSignedIn();
  const [menuOpen, setMenuOpen] = useState(false);
  const account = signedIn ? { href: accountHref, label: "Tài khoản" } : { href: loginHref, label: "Đăng nhập" };
  const productsOn = isActive(pathname, productsHref) || pathname.startsWith("/danh-muc/");

  return (
    <header className="sticky top-0 z-(--z-sticky) border-b border-line bg-paper pt-[env(safe-area-inset-top)]">
      <a
        href="#noi-dung"
        className="absolute top-2 left-2 z-(--z-dropdown) -translate-y-24 rounded-full bg-wood px-4 py-2 text-on-wood focus:translate-y-0"
      >
        Bỏ qua menu
      </a>
      <nav aria-label="Menu chính" className={`${frameClass} flex h-(--header-h) items-center justify-between gap-2`}>
        <Link href="/" aria-label={`${site.name}, về trang chủ`} className="flex min-h-11 items-center text-brand">
          <BrandLogo className="text-2xl" />
        </Link>

        <div className="flex items-center gap-1 self-stretch">
          <ul className="hidden items-stretch gap-1 self-stretch md:flex">
            {mainNav.map((item) =>
              item.href === productsHref ? (
                <li key={item.href} className="group relative flex">
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    aria-haspopup="true"
                    className={`inline-flex items-center gap-1 px-3 ${underline} ${productsOn ? underlineOn : ""}`}
                  >
                    {item.label}
                    <ChevronDownIcon size={16} className="transition-transform duration-(--d-base) ease-(--ease-out) group-hover:rotate-180 group-focus-within:rotate-180" />
                  </Link>
                  {/* Mở bằng hover hoặc khi focus vào bên trong, đóng nhanh hơn mở */}
                  <div className="invisible absolute top-full left-0 z-(--z-dropdown) -translate-y-1 pt-px opacity-0 transition-[opacity,translate,visibility] duration-(--d-fast) ease-(--ease-exit) group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-focus-within:duration-(--d-base) group-focus-within:ease-(--ease-ios) group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-hover:duration-(--d-base) group-hover:ease-(--ease-ios)">
                    <ul className="min-w-56 rounded-2xl border border-line bg-surface p-2 shadow-e2">
                      {categories.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={categoryHref(c.slug)}
                            aria-current={pathname === categoryHref(c.slug) ? "page" : undefined}
                            className="flex min-h-11 items-center rounded-lg px-3 text-ink-2 transition-colors duration-(--d-fast) hover:bg-paper-2 hover:text-wood aria-[current=page]:text-wood"
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                      <li className={categories.length ? "mt-1 border-t border-line pt-1" : ""}>
                        <Link href={productsHref} className="flex min-h-11 items-center rounded-lg px-3 font-medium text-wood hover:bg-paper-2">
                          Tất cả sản phẩm
                        </Link>
                      </li>
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={item.href} className="flex">
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={`inline-flex items-center px-3 ${underline} ${isActive(pathname, item.href) ? underlineOn : ""}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
          <CartButton />
          <Link
            href={account.href}
            aria-label={account.label}
            title={account.label}
            aria-current={pathname === account.href ? "page" : undefined}
            className={`hidden size-11 items-center justify-center rounded-full text-ink transition-colors duration-(--d-fast) hover:bg-paper-2 hover:text-wood md:inline-flex ${isActive(pathname, account.href) ? "text-wood" : ""}`}
          >
            <UserIcon size={22} />
          </Link>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-label="Mở menu"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2 hover:text-wood md:hidden"
          >
            <MenuIcon size={22} />
          </button>
        </div>
      </nav>
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} account={account} />}
    </header>
  );
}
