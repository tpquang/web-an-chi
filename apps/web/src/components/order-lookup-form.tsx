"use client";

import { useRef, useState, type FormEvent } from "react";
import type { OrderSummary } from "@/lib/api";
import { normalizePhone } from "@/lib/checkout";
import { postJson } from "@/lib/client-api";
import { BankTransferBox, OrderDetails } from "./order-details";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";

type Found = OrderSummary & { customerName: string; address: string };

export function OrderLookupForm() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ code?: string; phone?: string; form?: string }>({});
  const [order, setOrder] = useState<Found | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    const found: typeof errors = {};
    if (code.trim().length < 4) found.code = "Mã đơn có dạng AC2611ABCDEF, nằm trong trang xác nhận đơn.";
    if (!/^0\d{9}$/.test(normalizePhone(phone))) found.phone = "Số điện thoại cần đủ 10 chữ số, bắt đầu bằng 0.";
    setErrors(found);
    if (found.code) return codeRef.current?.focus();
    if (found.phone) return phoneRef.current?.focus();

    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await postJson<Found>("/api/orders/lookup", { code: code.trim(), phone });
      setOrder(result.ok ? result.data : null);
      if (!result.ok) setErrors({ form: result.error });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 lg:col-span-7">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Mã đơn hàng" error={errors.code}>
            <Input ref={codeRef} value={code} onChange={(e) => setCode(e.target.value)} disabled={submitting} autoCapitalize="characters" placeholder="VD: AC2611ABCDEF" />
          </Field>
          <Field label="Số điện thoại đặt hàng" error={errors.phone}>
            <Input ref={phoneRef} value={phone} onChange={(e) => setPhone(e.target.value)} disabled={submitting} inputMode="tel" autoComplete="tel" />
          </Field>
        </div>
        {errors.form && (
          <p role="alert" className="text-sm text-err">
            {errors.form}
          </p>
        )}
        <div className="mt-2">
          <Button type="submit" loading={submitting}>
            Tra cứu đơn
          </Button>
        </div>
      </form>
      {order && (
        <div aria-live="polite" className="flex flex-col gap-6 lg:col-span-5">
          {order.payment && <BankTransferBox payment={order.payment} totalVnd={order.totalVnd} />}
          <OrderDetails order={order} />
        </div>
      )}
    </div>
  );
}
