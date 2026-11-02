"use client";

import { checkoutHref, productsHref } from "@/lib/links";
import { useQuote } from "@/lib/use-quote";
import { Button } from "../ui/button";
import { EmptyState, ErrorState, Skeleton } from "../ui/states";
import { CartLine } from "./cart-line";
import { OrderSummary } from "./order-summary";

export function CartSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
      <div className="flex flex-col gap-5 lg:col-span-7">
        {[0, 1].map((key) => (
          <div key={key} className="flex gap-4">
            <Skeleton className="size-18 flex-none" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-11 w-36" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-64 lg:col-span-5" />
    </div>
  );
}

export function CartView() {
  const { state, reload } = useQuote();

  if (state.status === "loading") return <CartSkeleton />;
  if (state.status === "empty") {
    return (
      <EmptyState
        title="Giỏ hàng đang trống."
        desc="Xem các sản phẩm trầm hương để bắt đầu."
        action={<Button href={productsHref}>Xem sản phẩm</Button>}
      />
    );
  }
  if (state.status === "error") {
    return <ErrorState title="Chưa tải được giỏ hàng" desc={state.error} onRetry={reload} />;
  }

  const { quote, refreshing } = state;
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
      <ul aria-label="Sản phẩm trong giỏ" className="divide-y divide-line border-y border-line lg:col-span-7">
        {quote.lines.map((line) => (
          <CartLine key={line.slug} line={line} />
        ))}
      </ul>
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <OrderSummary quote={quote} busy={refreshing}>
            {quote.canCheckout ? (
              <Button href={checkoutHref} size="lg" block>
                Đặt hàng
              </Button>
            ) : (
              <>
                <Button size="lg" block disabled>
                  Đặt hàng
                </Button>
                <p className="mt-2 text-sm text-err">Bạn sửa các sản phẩm được đánh dấu trong giỏ trước khi đặt hàng.</p>
              </>
            )}
            <p className="mt-3 text-sm text-ink-3">Không cần tạo tài khoản. Shop gọi xác nhận trước khi giao.</p>
          </OrderSummary>
        </div>
      </div>
    </div>
  );
}
