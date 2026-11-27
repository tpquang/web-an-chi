"use client";

import Link from "next/link";
import { showDrawerView } from "@/lib/cart-drawer";
import type { CartItem } from "@/lib/cart";
import type { Quote } from "@/lib/client-api";
import { policyHref } from "@/lib/links";
import { paymentOptions } from "@/lib/order";
import { formatVnd } from "@/lib/site";
import { useCheckout } from "@/lib/use-checkout";
import { PreorderNote } from "../cart/preorder-note";
import { Button } from "../ui/button";
import { Field, Input } from "../ui/field";
import { RadioGroup } from "../ui/radio-group";
import { Spinner } from "../ui/spinner";
import { AddressFields } from "./address-fields";
import { CheckoutSignIn } from "./checkout-sign-in";
import { DevQuickFill } from "./dev-quick-fill";

type Props = { items: CartItem[]; quote: Quote; refreshing: boolean; reload: () => void; googleClientId: string | null };

// Bước đặt hàng trong bảng giỏ trượt. Một cột vì bảng hẹp: người nhận, địa chỉ, email, ghi chú, cách thanh toán, xem lại hàng.
// Đáy bảng dính: tổng tiền và nút Đặt hàng, như nút Thanh toán ở bước giỏ
export function CheckoutStep({ items, quote, refreshing, reload, googleClientId }: Props) {
  const form = useCheckout({ items, quote, reload });
  const { values, errors, submitting, bindRef, update } = form;

  // Đơn đã tạo, đang chuyển sang trang đơn: giữ spinner, không nháy "giỏ trống"
  if (form.done) {
    return (
      <div aria-busy className="flex flex-1 items-center justify-center text-wood">
        <Spinner size="lg" />
      </div>
    );
  }

  // Phải đăng nhập mới đặt được hàng: chưa đăng nhập thì bảng hiện đăng nhập, tạo tài khoản, Google
  if (!form.signedIn) return <CheckoutSignIn googleClientId={googleClientId} />;

  const depositVnd = form.paymentMethod === "COD" ? quote.payment.deposit?.amountVnd : undefined;

  return (
    <form onSubmit={form.submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-8 overscroll-contain overflow-y-auto px-5 py-5">
        {process.env.NODE_ENV === "development" && <DevQuickFill disabled={submitting} onFill={form.quickFill} />}
        <fieldset className="flex flex-col gap-4" disabled={submitting}>
          <legend className="mb-4 font-serif text-xl leading-tight">Thông tin giao hàng</legend>
          <Field label="Họ tên người nhận" required error={errors.name}>
            <Input ref={bindRef("name")} value={values.name} onChange={(e) => update({ name: e.target.value })} autoComplete="name" />
          </Field>
          <Field label="Số điện thoại" required error={errors.phone}>
            <Input ref={bindRef("phone")} value={values.phone} onChange={(e) => update({ phone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="VD: 0901 234 567" />
          </Field>
          <AddressFields
            values={values}
            provinces={form.divisions.data}
            failed={form.divisions.failed}
            onRetry={form.divisions.retry}
            errors={errors}
            disabled={submitting}
            onChange={update}
            refs={{ province: bindRef("province"), ward: bindRef("ward"), street: bindRef("street") }}
          />
          <Field label="Email" error={errors.email}>
            <Input ref={bindRef("email")} value={values.email} onChange={(e) => update({ email: e.target.value })} type="email" inputMode="email" autoComplete="email" />
          </Field>
          <Field label="Ghi chú cho shop" error={errors.note}>
            <Input ref={bindRef("note")} value={values.note} onChange={(e) => update({ note: e.target.value })} maxLength={500} placeholder="VD: Giao giờ hành chính" />
          </Field>
        </fieldset>

        <RadioGroup
          name="paymentMethod"
          label="Cách thanh toán"
          value={form.paymentMethod}
          options={paymentOptions(quote.payment, quote.totalVnd)}
          onChange={(value) => update({ paymentMethod: value })}
          disabled={submitting}
        />

        <section aria-labelledby="xem-lai-don" aria-busy={refreshing || undefined} className="flex flex-col gap-3">
          <h3 id="xem-lai-don" className="text-sm font-medium">
            Đơn hàng
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            {quote.lines.map((line) => (
              <li key={line.slug} className="flex justify-between gap-4">
                <span className="min-w-0 text-ink-2">
                  {line.product?.name ?? line.slug} × {line.quantity}
                </span>
                <span className="tabular-nums">{formatVnd(line.lineTotalVnd)}</span>
              </li>
            ))}
          </ul>
          <dl className="flex flex-col gap-2 border-t border-line pt-3 text-sm">
            <Row label="Tạm tính" value={formatVnd(quote.subtotalVnd)} />
            <Row label="Phí giao hàng" value={quote.shippingVnd === 0 ? "Miễn phí" : formatVnd(quote.shippingVnd)} />
            {depositVnd ? (
              <>
                <Row label="Chuyển khoản cọc trước" value={formatVnd(depositVnd)} />
                <Row label="Trả khi nhận hàng" value={formatVnd(quote.totalVnd - depositVnd)} />
              </>
            ) : null}
          </dl>
          <p className="text-sm text-ink-3">Giao trong {quote.shipping.eta}. Shop gọi xác nhận trước khi giao.</p>
          <PreorderNote quote={quote} />
          <Button type="button" variant="text" className="self-start" onClick={() => showDrawerView("cart")} disabled={submitting}>
            Sửa giỏ hàng
          </Button>
        </section>
      </div>

      <div className="flex flex-none flex-col gap-3 border-t border-line bg-surface px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <p aria-live="polite" className="flex items-baseline justify-between gap-4">
          <span className="text-ink-2">Tổng cộng</span>
          <span className="font-serif text-[28px] leading-tight font-semibold tabular-nums">{formatVnd(quote.totalVnd)}</span>
        </p>
        {!quote.canCheckout && !quote.preorderClosed && (
          <p role="alert" className="text-sm text-err">
            Giỏ có sản phẩm cần sửa. Bạn bấm Sửa giỏ hàng để xem.
          </p>
        )}
        <Button type="submit" size="lg" block loading={submitting} disabled={!quote.canCheckout}>
          Đặt hàng
        </Button>
        <p className="text-sm text-ink-3">
          Bạn huỷ được tới khi shop xác nhận đơn.{" "}
          <Link href={`${policyHref}#huy-don`} className="text-wood underline-offset-4 hover:underline">
            Chính sách huỷ đơn
          </Link>
        </p>
      </div>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-2">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
