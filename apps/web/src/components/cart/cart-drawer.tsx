"use client";

import { usePathname } from "next/navigation";
import { PreorderNote } from "./preorder-note";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { closeCartDrawer, openChatFromCart, useCartDrawerOpen } from "@/lib/cart-drawer";
import { useCartCount } from "@/lib/cart";
import { cartHref, checkoutHref, productsHref } from "@/lib/links";
import { formatVnd } from "@/lib/site";
import { useQuote } from "@/lib/use-quote";
import { ChatIcon, CloseIcon } from "../icons";
import { Button } from "../ui/button";
import { EmptyState, ErrorState, Skeleton } from "../ui/states";
import { CartLine } from "./cart-line";

// Giỏ hàng dạng bảng bên phải. Chỉ render khi mở, theo anchi-ui-ux: portal vào body, focus nút đóng, Esc và bấm nền để đóng
export function CartDrawer() {
  const open = useCartDrawerOpen();
  const pathname = usePathname();
  const firstPath = useRef(pathname);

  // Chuyển trang (bấm Đặt hàng, Xem giỏ hàng) thì đóng
  useEffect(() => {
    if (pathname !== firstPath.current) closeCartDrawer();
    firstPath.current = pathname;
  }, [pathname]);

  return open ? createPortal(<Panel />, document.body) : null;
}

function Panel() {
  const count = useCartCount();
  const { state, reload } = useQuote();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeCartDrawer();
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, []);

  return (
    // Cùng lớp với sheet thiết kế vòng nhưng gắn sau trong body nên nằm trên
    <div className="fixed inset-0 z-(--z-modal)">
      <div
        aria-hidden
        onClick={closeCartDrawer}
        className="absolute inset-0 bg-(--scrim) transition-opacity duration-(--d-base) ease-(--ease-out) motion-reduce:transition-none starting:opacity-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gio-hang-bang"
        className="absolute inset-y-0 right-0 flex w-[min(440px,92vw)] flex-col bg-surface pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] shadow-e4 transition-transform duration-(--d-page) ease-(--ease-ios) motion-reduce:transition-none starting:translate-x-full"
      >
        <div className="flex h-(--header-h) flex-none items-center justify-between border-b border-line px-5">
          <h2 id="gio-hang-bang" className="font-serif text-2xl">
            Giỏ hàng{count > 0 && <span className="text-ink-3 tabular-nums"> ({count})</span>}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCartDrawer}
            aria-label="Đóng giỏ hàng"
            className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {state.status === "loading" && (
            <div className="flex flex-col gap-5 py-5">
              {[0, 1].map((key) => (
                <div key={key} className="flex gap-4">
                  <Skeleton className="size-18 flex-none" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {state.status === "empty" && (
            <div className="py-5">
              <EmptyState title="Giỏ hàng đang trống." desc="Xem các sản phẩm trầm hương để bắt đầu." action={<Button href={productsHref}>Xem sản phẩm</Button>} />
            </div>
          )}
          {state.status === "error" && (
            <div className="py-5">
              <ErrorState title="Chưa tải được giỏ hàng" desc={state.error} onRetry={reload} />
            </div>
          )}
          {state.status === "ready" && (
            <ul aria-label="Sản phẩm trong giỏ" aria-busy={state.refreshing || undefined} className="divide-y divide-line">
              {state.quote.lines.map((line) => (
                <CartLine key={line.slug} line={line} />
              ))}
            </ul>
          )}
        </div>

        {state.status === "ready" && (
          <div className="flex flex-none flex-col gap-3 border-t border-line px-5 py-4">
            <p className="flex items-baseline justify-between gap-4" aria-live="polite">
              <span className="text-ink-2">Tạm tính</span>
              <span className="font-serif text-[28px] leading-tight font-semibold tabular-nums">{formatVnd(state.quote.subtotalVnd)}</span>
            </p>
            <p className="text-sm text-ink-3">Phí giao hàng tính ở bước đặt hàng. Shop gọi xác nhận trước khi giao.</p>
            <PreorderNote quote={state.quote} />
            {state.quote.canCheckout ? (
              <Button href={checkoutHref} size="lg" block>
                Đặt hàng
              </Button>
            ) : state.quote.preorderClosed ? null : (
              <p className="text-sm text-err">Bạn sửa các sản phẩm được đánh dấu trong giỏ trước khi đặt hàng.</p>
            )}
            <Button href={cartHref} variant="outline" block>
              Xem giỏ hàng
            </Button>
          </div>
        )}

        {/* Màn hẹp bảng gần kín màn hình nên nút chat nổi bị ẩn; đưa lối nhắn shop vào trong bảng */}
        <div className="flex flex-none items-center justify-between gap-3 border-t border-line px-5 py-2 md:hidden">
          <span className="text-sm text-ink-3">Cần tư vấn thêm?</span>
          <Button variant="text" onClick={openChatFromCart} className="min-h-11">
            <ChatIcon size={18} />
            Nhắn shop
          </Button>
        </div>
      </div>
    </div>
  );
}
