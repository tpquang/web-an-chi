"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { closeCartDrawer, finishCartDrawer, openChatFromCart, useCartDrawerPhase } from "@/lib/cart-drawer";
import { useCartCount } from "@/lib/cart";
import { cartHref, checkoutHref, productsHref } from "@/lib/links";
import { formatVnd } from "@/lib/site";
import { useQuote } from "@/lib/use-quote";
import { ArrowRightIcon, ChatIcon, CloseIcon } from "../icons";
import { Button } from "../ui/button";
import { EmptyState, ErrorState, Skeleton } from "../ui/states";
import { CartEdgeTab } from "./cart-edge-tab";
import { CartLine } from "./cart-line";
import { PreorderNote } from "./preorder-note";

// Lớp giỏ hàng gắn một lần ở root layout: bảng trượt từ phải và tab cạnh phải màn máy tính.
// Portal vào body vì header có backdrop-filter làm position: fixed bám sai chỗ
export function CartLayer() {
  const phase = useCartDrawerPhase();
  const pathname = usePathname();
  const firstPath = useRef(pathname);

  // Chuyển trang (bấm Thanh toán, Xem giỏ hàng) thì đóng
  useEffect(() => {
    if (pathname !== firstPath.current) closeCartDrawer();
    firstPath.current = pathname;
  }, [pathname]);

  return (
    <>
      <CartEdgeTab hidden={phase !== "closed"} />
      {phase !== "closed" && createPortal(<Panel closing={phase === "closing"} />, document.body)}
    </>
  );
}

// Vuốt sang phải để đóng (điện thoại). Chỉ bắt khi kéo ngang rõ ràng, kéo dọc vẫn cuộn danh sách
function useSwipeToClose() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; t: number; dx: number; horizontal: boolean | null } | null>(null);

  const move = (dx: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = dx ? "none" : "";
    el.style.translate = dx ? `${dx}px 0` : "";
  };

  return {
    ref,
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      drag.current = { x: touch.clientX, y: touch.clientY, t: e.timeStamp, dx: 0, horizontal: null };
    },
    onTouchMove: (e: React.TouchEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.touches[0].clientX - d.x;
      const dy = e.touches[0].clientY - d.y;
      if (d.horizontal === null && Math.hypot(dx, dy) > 8) d.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!d.horizontal) return;
      d.dx = Math.max(0, dx);
      move(d.dx);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const d = drag.current;
      drag.current = null;
      if (!d?.horizontal) return;
      const fast = d.dx / Math.max(1, e.timeStamp - d.t) > 0.5;
      // Bỏ style kéo tay để transition của class đưa bảng tiếp ra ngoài hoặc về chỗ cũ
      move(0);
      if (d.dx > 96 || (fast && d.dx > 32)) closeCartDrawer();
    },
  };
}

function Panel({ closing }: { closing: boolean }) {
  const count = useCartCount();
  const { state, reload } = useQuote();
  const closeRef = useRef<HTMLButtonElement>(null);
  const swipe = useSwipeToClose();

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

  // Trượt ra xong thì gỡ. Giảm chuyển động hoặc transitionend không tới thì gỡ theo giờ
  useEffect(() => {
    if (!closing) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(finishCartDrawer, reduced ? 0 : 450);
    return () => clearTimeout(timer);
  }, [closing]);

  // Giữ Tab trong bảng khi đang mở
  function trapTab(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  const ready = state.status === "ready" ? state.quote : null;

  return (
    // Cùng lớp với sheet thiết kế vòng nhưng gắn sau trong body nên nằm trên. Đang trượt ra thì inert, không bắt bấm
    <div className="fixed inset-0 z-(--z-modal)" inert={closing}>
      <div
        aria-hidden
        onClick={closeCartDrawer}
        className={`absolute inset-0 bg-(--scrim) transition-opacity duration-(--d-page) ease-(--ease-out) motion-reduce:transition-none starting:opacity-0 ${closing ? "opacity-0" : ""}`}
      />
      <div
        ref={swipe.ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gio-hang-bang"
        onKeyDown={trapTab}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        onTouchCancel={swipe.onTouchEnd}
        onTransitionEnd={(e) => closing && e.target === e.currentTarget && finishCartDrawer()}
        // Điện thoại: kín bề ngang. Từ 480px: rộng min(440px, 92vw), để lộ nền bên trái cho bấm đóng
        className={`absolute inset-y-0 right-0 flex w-full flex-col bg-surface pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] shadow-e4 transition-[translate] motion-reduce:transition-none starting:translate-x-full sm:w-[min(440px,92vw)] sm:rounded-l-3xl ${
          closing ? "translate-x-full duration-(--d-slow) ease-(--ease-exit)" : "duration-(--d-page) ease-(--ease-ios)"
        }`}
      >
        <div className="flex h-(--header-h) flex-none items-center gap-2 border-b border-line pr-3 pl-5">
          <h2 id="gio-hang-bang" className="mr-auto font-serif text-2xl">
            Giỏ hàng{count > 0 && <span className="text-ink-3 tabular-nums"> ({count})</span>}
          </h2>
          {/* Màn hẹp bảng kín màn hình nên nút chat nổi bị ẩn; lối nhắn shop đặt trên đầu bảng, không chen dưới nút thanh toán */}
          <button
            type="button"
            onClick={openChatFromCart}
            aria-label="Nhắn shop"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2 hover:text-wood md:hidden"
          >
            <ChatIcon size={22} />
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCartDrawer}
            aria-label="Đóng giỏ hàng"
            className="inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-paper-2"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-5">
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
          {ready && (
            <>
              <ul aria-label="Sản phẩm trong giỏ" aria-busy={state.status === "ready" && state.refreshing ? true : undefined} className="divide-y divide-line">
                {ready.lines.map((line) => (
                  <CartLine key={line.slug} line={line} preorder={ready.preorder} />
                ))}
              </ul>
              <div className="flex flex-col gap-3 border-t border-line py-4">
                <PreorderNote quote={ready} />
                <Button href={cartHref} variant="text" className="self-start">
                  Xem giỏ hàng đầy đủ
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Đáy bảng luôn ở dưới cùng: tạm tính rồi nút Thanh toán, chừa vùng an toàn của iPhone */}
        {ready && (
          <div className="flex flex-none flex-col gap-3 border-t border-line bg-surface px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <div aria-live="polite">
              <p className="flex items-baseline justify-between gap-4">
                <span className="text-ink-2">Tạm tính</span>
                <span className="font-serif text-[28px] leading-tight font-semibold tabular-nums">{formatVnd(ready.subtotalVnd)}</span>
              </p>
              <p className="mt-1 text-sm text-ink-3">Phí giao hàng tính ở bước thanh toán. Shop gọi xác nhận trước khi giao.</p>
            </div>
            {ready.canCheckout ? (
              <Button href={checkoutHref} size="lg" block>
                Thanh toán
                <ArrowRightIcon size={20} />
              </Button>
            ) : ready.preorderClosed ? null : (
              <p role="alert" className="text-sm text-err">
                Bạn sửa các sản phẩm được đánh dấu trong giỏ trước khi thanh toán.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
