import type { ReactNode } from "react";
import type { Quote } from "@/lib/client-api";
import { formatVnd } from "@/lib/site";

// Tổng đặt trong aria-live để trình đọc màn hình báo khi số lượng đổi
export function OrderSummary({ quote, children, busy }: { quote: Quote; children?: ReactNode; busy?: boolean }) {
  const { subtotalVnd, shippingVnd, totalVnd, shipping } = quote;
  const missing = shipping.freeFromVnd !== null && shippingVnd > 0 ? shipping.freeFromVnd - subtotalVnd : 0;

  return (
    <section aria-labelledby="tom-tat" aria-busy={busy || undefined} className="rounded-lg border border-line bg-surface p-5 md:p-6">
      <h2 id="tom-tat" className="font-serif text-2xl leading-tight font-semibold">
        Tóm tắt đơn hàng
      </h2>
      <dl className="mt-4 flex flex-col gap-2 text-sm" aria-live="polite">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Tạm tính</dt>
          <dd className="tabular-nums">{formatVnd(subtotalVnd)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Phí giao hàng</dt>
          <dd className="tabular-nums">{shippingVnd === 0 ? "Miễn phí" : formatVnd(shippingVnd)}</dd>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
          <dt className="font-medium">Tổng cộng</dt>
          <dd className="font-serif text-[28px] leading-tight font-semibold whitespace-nowrap">{formatVnd(totalVnd)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-ink-3">
        Giao trong {shipping.eta}.
        {missing > 0 && ` Đơn từ ${formatVnd(shipping.freeFromVnd!)} được miễn phí giao, còn thiếu ${formatVnd(missing)}.`}
      </p>
      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}
