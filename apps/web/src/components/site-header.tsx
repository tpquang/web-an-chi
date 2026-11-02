"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { accountHref, loginHref } from "@/lib/links";
import { mainNav } from "@/lib/nav";
import { site } from "@/lib/site";
import { useSignedIn } from "@/lib/use-signed-in";
import { BrandLogo } from "./brand-mark";
import { CartButton } from "./cart-button";
import { MenuIcon, UserIcon } from "./icons";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";
import { frameClass } from "./ui/layout";

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const signedIn = useSignedIn();
  const [menuOpen, setMenuOpen] = useState(false);
  const account = signedIn ? { href: accountHref, label: "Tài khoản" } : { href: loginHref, label: "Đăng nhập" };

  return (
    <header className="sticky top-0 z-(--z-sticky) border-b border-line bg-paper pt-[env(safe-area-inset-top)]">
      <a
        href="#noi-dung"
        className="absolute top-2 left-2 z-(--z-dropdown) -translate-y-24 rounded-md bg-wood px-4 py-2 text-on-wood focus:translate-y-0"
      >
        Bỏ qua menu
      </a>
      <nav aria-label="Menu chính" className={`${frameClass} flex h-(--header-h) items-center justify-between gap-2`}>
        <Link href="/" aria-label={`${site.name}, về trang chủ`} className="flex min-h-11 items-center text-wood">
          <BrandLogo className="h-9" />
        </Link>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={`inline-flex min-h-11 items-center px-3 hover:text-wood ${isActive(pathname, item.href) ? "text-wood" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <CartButton showLabel />
          <Link
            href={account.href}
            aria-current={pathname === account.href ? "page" : undefined}
            className={`hidden min-h-11 items-center gap-1.5 rounded-md px-3 hover:text-wood md:inline-flex ${isActive(pathname, account.href) ? "text-wood" : ""}`}
          >
            <UserIcon size={20} />
            {account.label}
          </Link>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-label="Mở menu"
            className="inline-flex size-11 items-center justify-center rounded-md text-ink-2 hover:bg-paper-2 hover:text-wood md:hidden"
          >
            <MenuIcon size={22} />
          </button>
        </div>
      </nav>
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} account={account} />}
    </header>
  );
}
