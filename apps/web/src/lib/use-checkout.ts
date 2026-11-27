"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { showToast } from "@/components/ui/toast";
import { announceSession } from "./account-client";
import { composeAddress, parseAddress, useDivisions } from "./address";
import { cart, type CartItem } from "./cart";
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
} from "./checkout";
import { postJson, type Quote } from "./client-api";
import { cartHref, orderHref } from "./links";
import { trackEvent } from "./track";
import { useSignedInClient } from "./use-signed-in";

// Logic form đặt hàng trong bảng giỏ: nháp, điền sẵn từ tài khoản, kiểm lỗi, gửi đơn một lần.
// Nhận giá từ useQuote của bảng để không hỏi giá hai lần
export function useCheckout({ items, quote, reload }: { items: CartItem[]; quote: Quote | null; reload: () => void }) {
  const router = useRouter();
  const divisions = useDivisions();
  const signedIn = useSignedInClient();
  const [values, setValues] = useState<CheckoutValues>(emptyCheckout);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const inFlight = useRef(false);
  // Một khoá cho cả phiên đặt hàng: gửi lại sau lỗi mạng không tạo đơn thứ hai
  const idempotencyKey = useRef("");
  const refs = useRef<Partial<Record<CheckoutField, HTMLElement | null>>>({});
  // Địa chỉ dạng chuỗi (tài khoản, khách mẫu) chờ danh sách tỉnh để tách ra ba ô
  const pendingAddress = useRef<string | null>(null);

  const placed = useRef(false);
  useEffect(() => {
    idempotencyKey.current = crypto.randomUUID();
    setValues(loadDraft());
    // Xoá giỏ khi bảng đã đóng hẳn sau lúc chuyển sang trang đơn; xoá sớm thì bảng nháy "giỏ trống" trước khi chuyển trang
    return () => {
      if (placed.current) cart.clear();
    };
  }, []);

  // begin_checkout gửi một lần khi đã có giá
  const tracked = useRef(false);
  useEffect(() => {
    if (!quote || tracked.current) return;
    tracked.current = true;
    trackEvent("begin_checkout", {
      value: quote.totalVnd,
      items: quote.lines.map((line) => ({ item_id: line.slug, quantity: line.quantity, price: line.product?.unitPriceVnd })),
    });
  }, [quote]);

  function applyPendingAddress(provinces: NonNullable<typeof divisions.data>) {
    const text = pendingAddress.current;
    pendingAddress.current = null;
    const parsed = text ? parseAddress(text, provinces) : null;
    // Không tách được (địa chỉ cũ ghi tay) thì để khách chọn lại, không đoán
    if (parsed) setValues((prev) => (prev.provinceCode ? prev : { ...prev, ...parsed }));
  }

  function fillAddress(text: string) {
    pendingAddress.current = text;
    if (divisions.data) applyPendingAddress(divisions.data);
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
      .then((body: { data: { name: string; phone: string | null; email: string | null; address: string | null } } | null) => {
        if (!body) return;
        const { name, phone, email, address } = body.data;
        setValues((prev) => ({ ...prev, name: prev.name || name, phone: prev.phone || (phone ?? ""), email: prev.email || (email ?? "") }));
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

  // Khối điền nhanh khách mẫu (chỉ dev)
  function quickFill({ address, ...patch }: Partial<CheckoutValues> & { address?: string }) {
    update({ ...patch, provinceCode: null, wardCode: null, street: "" });
    setErrors({});
    if (address) fillAddress(address);
  }

  function focusFirst(found: CheckoutErrors) {
    const first = fieldOrder.find((field) => found[field]);
    if (first) refs.current[first]?.focus();
  }

  const bindRef = (field: CheckoutField) => (el: HTMLElement | null) => {
    refs.current[field] = el;
  };

  const paymentMethod = quote ? paymentMethodFor(values, quote) : values.paymentMethod;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || !quote) return;
    const found = validateCheckout(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirst(found);
      return;
    }
    const province = divisions.data?.find((p) => p.code === values.provinceCode);
    const ward = province?.wards.find((w) => w.code === values.wardCode);

    inFlight.current = true;
    setSubmitting(true);
    let ok = false;
    try {
      const result = await postJson<{ code: string }>("/api/orders", {
        idempotencyKey: idempotencyKey.current,
        customer: { name: values.name, phone: values.phone, email: values.email, address: composeAddress(values.street, ward, province), note: values.note },
        paymentMethod,
        items,
        // Giá đổi trong lúc khách điền form thì API báo PRICE_CHANGED thay vì tự tính giá mới
        expectedTotalVnd: quote.totalVnd,
      });
      if (result.ok) {
        ok = true;
        placed.current = true;
        setDone(true);
        trackEvent("purchase", {
          transaction_id: result.data.code,
          value: quote.totalVnd,
          shipping: quote.shippingVnd,
          items: quote.lines.map((line) => ({ item_id: line.slug, item_name: line.product?.name, quantity: line.quantity, price: line.product?.unitPriceVnd })),
        });
        clearDraft();
        // Đổi đường dẫn thì bảng tự đóng, giỏ xoá lúc bảng gỡ khỏi trang
        router.replace(orderHref(result.data.code));
        return;
      }
      // Phiên hết hạn hoặc bị thu hồi giữa chừng: route handler đã xoá cookie, bảng quay về bước đăng nhập, form vẫn giữ trong nháp
      if (result.code === "LOGIN_REQUIRED" || result.code === "UNAUTHORIZED") {
        showToast({ type: "error", title: "Bạn cần đăng nhập lại", desc: "Đăng nhập xong bấm Đặt hàng lần nữa, thông tin đã điền vẫn còn." });
        announceSession();
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
      if (!ok) setSubmitting(false);
    }
  }

  return { values, errors, submitting, done, signedIn, divisions, paymentMethod, update, quickFill, bindRef, submit };
}

export type CheckoutState = ReturnType<typeof useCheckout>;

// Shop chưa có tài khoản ngân hàng mà bản nháp cũ chọn chuyển khoản thì về trả khi nhận hàng
function paymentMethodFor(values: CheckoutValues, quote: Quote) {
  return values.paymentMethod === "BANK_TRANSFER" && !quote.payment.bankTransfer ? "COD" : values.paymentMethod;
}
