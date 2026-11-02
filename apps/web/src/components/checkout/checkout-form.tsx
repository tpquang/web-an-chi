"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { announceSession } from "@/lib/account-client";
import { cart } from "@/lib/cart";
import {
  clearDraft,
  fieldOrder,
  loadDraft,
  saveDraft,
  validateCheckout,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutValues,
  emptyCheckout,
} from "@/lib/checkout";
import { postJson } from "@/lib/client-api";
import { cartHref, checkoutHref, loginHref, orderHref, productsHref } from "@/lib/links";
import { paymentOptions } from "@/lib/order";
import { useQuote } from "@/lib/use-quote";
import { useSignedIn } from "@/lib/use-signed-in";
import { OrderSummary } from "../cart/order-summary";
import { CartSkeleton } from "../cart/cart-view";
import { Button } from "../ui/button";
import { Checkbox, Field, Input, Textarea } from "../ui/field";
import { RadioGroup } from "../ui/radio-group";
import { EmptyState, ErrorState } from "../ui/states";
import { Spinner } from "../ui/spinner";
import { DevQuickFill } from "./dev-quick-fill";
import { showToast } from "../ui/toast";

export function CheckoutForm() {
  const router = useRouter();
  const { items, state, reload } = useQuote();
  const [values, setValues] = useState<CheckoutValues>(emptyCheckout);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const done = useRef(false);
  // Một khoá cho cả phiên đặt hàng: gửi lại sau lỗi mạng không tạo đơn thứ hai
  const idempotencyKey = useRef<string>("");
  const refs = useRef<Partial<Record<CheckoutField, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  const signedIn = useSignedIn();

  useEffect(() => {
    idempotencyKey.current = crypto.randomUUID();
    setValues(loadDraft());
  }, []);

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
        setValues((prev) => ({
          ...prev,
          name: prev.name || name,
          phone: prev.phone || phone,
          email: prev.email || (email ?? ""),
          address: prev.address || (address ?? ""),
        }));
      })
      .catch(() => {});
  }, [signedIn]);

  function update<K extends keyof CheckoutValues>(key: K, value: CheckoutValues[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    saveDraft(next);
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function focusFirst(found: CheckoutErrors) {
    const first = fieldOrder.find((field) => found[field]);
    if (first) refs.current[first]?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    const found = validateCheckout(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirst(found);
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await postJson<{ code: string }>("/api/orders", {
        idempotencyKey: idempotencyKey.current,
        customer: { name: values.name, phone: values.phone, email: values.email, address: values.address, note: values.note },
        marketingConsent: consent,
        paymentMethod: values.paymentMethod,
        items,
      });
      if (result.ok) {
        done.current = true;
        cart.clear();
        clearDraft();
        router.replace(orderHref(result.data.code));
        return;
      }
      if (result.code === "CART_CHANGED") {
        showToast({ type: "error", title: "Giỏ hàng đã thay đổi", desc: result.error, action: { href: cartHref, label: "Xem lại giỏ hàng" } });
        reload();
        return;
      }
      const serverErrors: CheckoutErrors = {};
      for (const issue of result.issues ?? []) {
        const field = issue.path[1] as CheckoutField;
        if (issue.path[0] === "customer" && fieldOrder.includes(field)) serverErrors[field] = issue.message;
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
  const bind = (field: CheckoutField) => ({
    value: values[field],
    disabled: submitting,
    ref: (el: HTMLInputElement | HTMLTextAreaElement | null) => {
      refs.current[field] = el;
    },
  });

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-8 lg:grid-cols-12 lg:gap-6">
      <div className="order-last flex flex-col gap-8 lg:order-first lg:col-span-7">
        {process.env.NODE_ENV === "development" && (
          <DevQuickFill
            disabled={submitting}
            onFill={(patch) => {
              const next = { ...values, ...patch };
              setValues(next);
              saveDraft(next);
              setErrors({});
            }}
          />
        )}
        <fieldset className="flex flex-col gap-4" disabled={submitting}>
          <legend className="mb-4 font-serif text-2xl leading-tight font-semibold">Thông tin giao hàng</legend>
          {!signedIn && (
            <p className="-mt-2 text-sm text-ink-2">
              Đã có tài khoản?{" "}
              <Link href={`${loginHref}?tiep=${encodeURIComponent(checkoutHref)}`} className="font-medium text-wood underline-offset-4 hover:underline">
                Đăng nhập để điền sẵn
              </Link>
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Họ tên người nhận" error={errors.name}>
              <Input {...bind("name")} onChange={(e) => update("name", e.target.value)} autoComplete="name" />
            </Field>
            <Field label="Số điện thoại" hint="Để shop gọi xác nhận đơn." error={errors.phone}>
              <Input {...bind("phone")} onChange={(e) => update("phone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="VD: 0901 234 567" />
            </Field>
          </div>
          <Field label="Địa chỉ nhận hàng" hint="Số nhà, đường, phường hoặc xã, quận hoặc huyện, tỉnh." error={errors.address}>
            <Textarea {...bind("address")} onChange={(e) => update("address", e.target.value)} autoComplete="street-address" rows={3} />
          </Field>
          <Field label="Email" optional hint="Shop gửi xác nhận đơn qua email nếu bạn nhập." error={errors.email}>
            <Input {...bind("email")} onChange={(e) => update("email", e.target.value)} type="email" inputMode="email" autoComplete="email" />
          </Field>
          <Field label="Ghi chú cho shop" optional error={errors.note}>
            <Textarea {...bind("note")} onChange={(e) => update("note", e.target.value)} placeholder="VD: Giao giờ hành chính" />
          </Field>
        </fieldset>

        <RadioGroup
          name="paymentMethod"
          label="Cách thanh toán"
          value={values.paymentMethod}
          options={paymentOptions}
          onChange={(value) => update("paymentMethod", value)}
          disabled={submitting}
        />

        <div className="flex flex-col gap-6">
          <Checkbox
            checked={consent}
            disabled={submitting}
            onChange={(e) => setConsent(e.target.checked)}
            label="Nhận tin nhắc theo dịp lễ qua Zalo hoặc email, tối đa 2 tin mỗi tháng. Bạn huỷ được bất cứ lúc nào."
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button type="submit" size="lg" loading={submitting} disabled={!quote.canCheckout} className="sm:min-w-56">
              Đặt hàng
            </Button>
            {!quote.canCheckout && <p className="text-sm text-err">Giỏ có sản phẩm cần sửa. Bạn quay lại giỏ hàng để xem.</p>}
          </div>
          <p className="text-sm text-ink-3">Shop chỉ dùng tên, số điện thoại và địa chỉ để giao đơn này.</p>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <OrderSummary quote={quote} busy={state.refreshing}>
            <ul className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
              {quote.lines.map((line) => (
                <li key={line.slug} className="flex justify-between gap-4">
                  <span className="min-w-0 text-ink-2">
                    {line.product?.name ?? line.slug} × {line.quantity}
                  </span>
                </li>
              ))}
            </ul>
            <Button href={cartHref} variant="text" className="mt-3">
              Sửa giỏ hàng
            </Button>
          </OrderSummary>
        </div>
      </div>
    </form>
  );
}
