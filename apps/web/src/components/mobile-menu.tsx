"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cartHref, orderLookupHref } from "@/lib/links";
import { mainNav } from "@/lib/nav";
import { useCartCount } from "@/lib/cart";
import { BrandMark } from "./brand-mark";
import { CloseIcon } from "./icons";
import { isActive } from "./site-header";
import { ThemeToggle } from "./theme-toggle";

type Props = { onClose: () => void; account: { href: string; label: string } };

// Drawer theo anchi-ui-ux: portal ra ngoài header, focus vào nút đóng, Esc và bấm nền để đóng
export function MobileMenu({ onClose, account }: Props) {
  const pathname = usePathname();
  const count = useCartCount();
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstPath = useRef(pathname);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [onClose]);

  // Chọn link thì đóng
  useEffect(() => {
    if (pathname !== firstPath.current) onClose();
  }, [pathname, onClose]);

  const links = [
    ...mainNav,
    { href: cartHref, label: count ? `Giỏ hàng (${count})` : "Giỏ hàng" },
    account,
    { href: orderLookupHref, label: "Tra cứu đơn hàng" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-(--z-overlay)">
      <div aria-hidden className="absolute inset-0 bg-(--scrim)" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="absolute inset-y-0 right-0 flex w-[min(360px,88vw)] flex-col bg-surface pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] shadow-e4"
      >
        <div className="flex h-(--header-h) items-center justify-between border-b border-line px-4">
          <BrandMark className="size-9 text-brand" />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng menu"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2"
          >
            <CloseIcon />
          </button>
        </div>
        <nav aria-label="Menu" className="flex-1 overflow-y-auto p-2">
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  aria-current={pathname === link.href ? "page" : undefined}
                  className={`flex min-h-12 items-center rounded-xl px-3 text-lg hover:bg-paper-2 ${isActive(pathname, link.href) ? "font-medium text-wood" : ""}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center justify-between border-t border-line px-5 py-3">
          <span className="text-sm text-ink-3">Giao diện</span>
          <ThemeToggle />
        </div>
      </div>
    </div>,
    document.body,
  );
}
