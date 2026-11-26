"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { announceSession } from "@/lib/account-client";
import { composeAddress, parseAddress, useDivisions } from "@/lib/address";
import { cart } from "@/lib/cart";
import {
  clearDraft,
  emptyCheckout,
  fieldOrder,
  loadDraft,
  saveDraft,
  validateCheckout,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutValues,
} from "@/lib/checkout";
import { postJson } from "@/lib/client-api";
import { cartHref, checkoutHref, loginHref, orderHref, policyHref, productsHref } from "@/lib/links";
import { paymentOptions } from "@/lib/order";
import { trackEvent } from "@/lib/track";
import { useQuote } from "@/lib/use-quote";
import { useSignedIn } from "@/lib/use-signed-in";
import { CartSkeleton } from "../cart/cart-view";
import { OrderSummary } from "../cart/order-summary";
import { PreorderNote } from "../cart/preorder-note";
import { Button } from "../ui/button";
import { Field, Input } from "../ui/field";
import { RadioGroup } from "../ui/radio-group";
import { Spinner } from "../ui/spinner";
import { EmptyState, ErrorState } from "../ui/states";
import { showToast } from "../ui/toast";
import { AddressFields } from "./address-fields";
import { DevQuickFill } from "./dev-quick-fill";

// Bố cục: cột trái thông tin giao hàng và cách thanh toán; cột phải tóm tắt đơn kèm nút Đặt hàng (dính khi cuộn).
// Điện thoại: form trước, tóm tắt và nút Đặt hàng ở cuối để khách xem lại đơn rồi mới bấm
export function CheckoutForm() {
  const router = useRouter();
  const { items, state, reload } = useQuote();
  const divisions = useDivisions();
  const [values, setValues] = useState<CheckoutValues>(emptyCheckout);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const done = useRef(false);
  // Một khoá cho cả phiên đặt hàng: gửi lại sau lỗi mạng không tạo đơn thứ hai
  const idempotencyKey = useRef<string>("");
  const refs = useRef<Partial<Record<CheckoutField, HTMLElement | null>>>({});
  // Địa chỉ dạng chuỗi (tài khoản, khách mẫu) chờ danh sách tỉnh để tách ra ba ô
  const pendingAddress = useRef<string | null>(null);

  const signedIn = useSignedIn();

  // begin_checkout gửi một lần khi giỏ đã tính xong giá
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (state.status !== "ready" || checkoutTracked.current) return;
    checkoutTracked.current = true;
    trackEvent("begin_checkout", {
      value: state.quote.totalVnd,
      items: state.quote.lines.map((line) => ({ item_id: line.slug, quantity: line.quantity, price: line.product?.unitPriceVnd })),
    });
  }, [state]);

  useEffect(() => {
    idempotencyKey.current = crypto.randomUUID();
    setValues(loadDraft());
  }, []);

  function fillAddress(text: string) {
    pendingAddress.current = text;
    if (divisions.data) applyPendingAddress(divisions.data);
  }

  function applyPendingAddress(provinces: NonNullable<typeof divisions.data>) {
    const text = pendingAddress.current;
    pendingAddress.current = null;
    const parsed = text ? parseAddress(text, provinces) : null;
    // Không tách được (địa chỉ cũ ghi tay) thì để khách chọn lại, không đoán
    if (parsed) setValues((prev) => (prev.provinceCode ? prev : { ...prev, ...parsed }));
  }

  useEffect(() => {
    if (divisions.data && pendingAddress.current) applyPendingAddress(divisions.data);
  }, [divisions.data]);

  // Đã đăng nhập: điền những ô còn trống bằng thông tin tài khoản, không ghi đè thứ khách vừa gõ
  useEffect(() => {
    if (!signedIn) return;
    fetch("/api/account/me")
      .then((res) => {
        // Phiên hết hạn: route handler đã xoá cookie, báo header đổi lại thành "Đăng nhập"
        if (res.status === 401) announceSession();
        return res.ok ? res.json() : null;
      })
      .then((body: { data: { name: string; phone: string; email: string | null; address: string | null } } | null) => {
        if (!body) return;
        const { name, phone, email, address } = body.data;
        setValues((prev) => ({ ...prev, name: prev.name || name, phone: prev.phone || phone, email: prev.email || (email ?? "") }));
        if (address) fillAddress(address);
      })
      .catch(() => {});
  }, [signedIn]);

  function update(patch: Partial<CheckoutValues>) {
    const next = { ...values, ...patch };
    setValues(next);
    saveDraft(next);
    const touched: CheckoutField[] = [];
    if ("provinceCode" in patch) touched.push("province");
    if ("wardCode" in patch) touched.push("ward");
    for (const key of ["name", "phone", "email", "street", "note"] as const) if (key in patch) touched.push(key);
    if (touched.some((key) => errors[key])) setErrors((prev) => ({ ...prev, ...Object.fromEntries(touched.map((key) => [key, undefined])) }));
  }

  function focusFirst(found: CheckoutErrors) {
    const first = fieldOrder.find((field) => found[field]);
    if (first) refs.current[first]?.focus();
  }

  const bindRef = (field: CheckoutField) => (el: HTMLElement | null) => {
    refs.current[field] = el;
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || state.status !== "ready") return;
    const found = validateCheckout(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirst(found);
      return;
    }
    const province = divisions.data?.find((p) => p.code === values.provinceCode);
    const ward = province?.wards.find((w) => w.code === values.wardCode);
    const { quote } = state;

    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await postJson<{ code: string }>("/api/orders", {
        idempotencyKey: idempotencyKey.current,
        customer: { name: values.name, phone: values.phone, email: values.email, address: composeAddress(values.street, ward, province), note: values.note },
        paymentMethod: paymentMethodFor(values, quote),
        items,
        // Giá đổi trong lúc khách điền form thì API báo PRICE_CHANGED thay vì tự tính giá mới
        expectedTotalVnd: quote.totalVnd,
      });
      if (result.ok) {
        done.current = true;
        trackEvent("purchase", {
          transaction_id: result.data.code,
          value: quote.totalVnd,
          shipping: quote.shippingVnd,
          items: quote.lines.map((line) => ({ item_id: line.slug, item_name: line.product?.name, quantity: line.quantity, price: line.product?.unitPriceVnd })),
        });
        cart.clear();
        clearDraft();
        router.replace(orderHref(result.data.code));
        return;
      }
      if (result.code === "PRICE_CHANGED") {
        showToast({ type: "error", title: "Giá vừa thay đổi", desc: "Shop đã cập nhật tổng tiền. Bạn xem lại rồi bấm Đặt hàng lần nữa." });
        reload();
        return;
      }
      if (result.code === "CART_CHANGED") {
        showToast({ type: "error", title: "Giỏ hàng đã thay đổi", desc: result.error, action: { href: cartHref, label: "Xem lại giỏ hàng" } });
        reload();
        return;
      }
      const serverErrors: CheckoutErrors = {};
      for (const issue of result.issues ?? []) {
        if (issue.path[0] !== "customer") continue;
        // API kiểm địa chỉ đã ghép; lỗi báo vào ô số nhà, tên đường
        const field = (issue.path[1] === "address" ? "street" : issue.path[1]) as CheckoutField;
        if (fieldOrder.includes(field)) serverErrors[field] = issue.message;
      }
      setErrors(serverErrors);
      if (Object.keys(serverErrors).length > 0) focusFirst(serverErrors);
      else showToast({ type: "error", title: "Chưa đặt được hàng", desc: result.error });
    } finally {
      inFlight.current = false;
      if (!done.current) setSubmitting(false);
    }
  }

  // Đơn đã tạo, giỏ vừa xoá: giữ spinner tới khi chuyển trang, không nháy "giỏ trống"
  if (done.current) {
    return (
      <div aria-busy className="flex justify-center py-16 text-wood">
        <Spinner size="lg" />
      </div>
    );
  }
  if (state.status === "loading") return <CartSkeleton />;
  if (state.status === "empty") {
    return (
      <EmptyState
        title="Giỏ hàng đang trống."
        desc="Bạn chọn sản phẩm trước rồi quay lại đây để đặt hàng."
        action={<Button href={productsHref}>Xem sản phẩm</Button>}
      />
    );
  }
  if (state.status === "error") return <ErrorState title="Chưa tải được giỏ hàng" desc={state.error} onRetry={reload} />;

  const { quote } = state;
  const paymentMethod = paymentMethodFor(values, quote);
  const depositVnd = paymentMethod === "COD" ? quote.payment.deposit?.amountVnd : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-12 lg:gap-6">
      <div className="flex flex-col gap-8 lg:col-span-7">
        {process.env.NODE_ENV === "development" && (
          <DevQuickFill
            disabled={submitting}
            onFill={({ address, ...patch }) => {
              update({ ...patch, provinceCode: null, wardCode: null, street: "" });
              setErrors({});
              if (address) fillAddress(address);
            }}
          />
        )}
        <fieldset className="flex flex-col gap-4" disabled={submitting}>
          <legend className="mb-4 font-serif text-2xl leading-tight">Thông tin giao hàng</legend>
          {!signedIn && (
            <p className="-mt-2 text-sm text-ink-2">
              Đã có tài khoản?{" "}
              <Link href={`${loginHref}?tiep=${encodeURIComponent(checkoutHref)}`} className="font-medium text-wood underline-offset-4 hover:underline">
                Đăng nhập để điền sẵn
              </Link>
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Họ tên người nhận" required error={errors.name}>
              <Input ref={bindRef("name")} value={values.name} onChange={(e) => update({ name: e.target.value })} autoComplete="name" />
            </Field>
            <Field label="Số điện thoại" required error={errors.phone}>
              <Input ref={bindRef("phone")} value={values.phone} onChange={(e) => update({ phone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="VD: 0901 234 567" />
            </Field>
          </div>
          <AddressFields
            values={values}
            provinces={divisions.data}
            failed={divisions.failed}
            onRetry={divisions.retry}
            errors={errors}
            disabled={submitting}
            onChange={update}
            refs={{ province: bindRef("province"), ward: bindRef("ward"), street: bindRef("street") }}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email" error={errors.email}>
              <Input ref={bindRef("email")} value={values.email} onChange={(e) => update({ email: e.target.value })} type="email" inputMode="email" autoComplete="email" />
            </Field>
            <Field label="Ghi chú cho shop" error={errors.note}>
              <Input ref={bindRef("note")} value={values.note} onChange={(e) => update({ note: e.target.value })} maxLength={500} placeholder="VD: Giao giờ hành chính" />
            </Field>
          </div>
        </fieldset>

        <RadioGroup
          name="paymentMethod"
          label="Cách thanh toán"
          value={paymentMethod}
          options={paymentOptions(quote.payment, quote.totalVnd)}
          onChange={(value) => update({ paymentMethod: value })}
          disabled={submitting}
        />
      </div>

      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <OrderSummary quote={quote} busy={state.refreshing} depositVnd={depositVnd}>
            <ul className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
              {quote.lines.map((line) => (
                <li key={line.slug} className="flex justify-between gap-4">
                  <span className="min-w-0 text-ink-2">
                    {line.product?.name ?? line.slug} × {line.quantity}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-col gap-3">
              <PreorderNote quote={quote} />
              {!quote.canCheckout && !quote.preorderClosed && (
                <p role="alert" className="text-sm text-err">
                  Giỏ có sản phẩm cần sửa. Bạn quay lại giỏ hàng để xem.
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
              <Button href={cartHref} variant="text" className="self-start">
                Sửa giỏ hàng
              </Button>
            </div>
          </OrderSummary>
        </div>
      </div>
    </form>
  );
}

// Shop chưa có tài khoản ngân hàng mà bản nháp cũ chọn chuyển khoản thì về trả khi nhận hàng
function paymentMethodFor(values: CheckoutValues, quote: { payment: { bankTransfer: boolean } }) {
  return values.paymentMethod === "BANK_TRANSFER" && !quote.payment.bankTransfer ? "COD" : values.paymentMethod;
}
