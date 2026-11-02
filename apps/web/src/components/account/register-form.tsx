"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { announceSession } from "@/lib/account-client";
import { normalizePhone } from "@/lib/checkout";
import { postJson } from "@/lib/client-api";
import { accountHref, loginHref } from "@/lib/links";
import { Button } from "../ui/button";
import { Field, Input } from "../ui/field";

type Values = { name: string; phone: string; password: string; orderCode: string };
type Errors = Partial<Record<keyof Values | "form", string>>;

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<Values>({ name: "", phone: "", password: "", orderCode: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [needsOrder, setNeedsOrder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const refs = useRef<Partial<Record<keyof Values, HTMLInputElement | null>>>({});

  const set = (key: keyof Values, value: string) => setValues((prev) => ({ ...prev, [key]: value }));
  const bind = (key: keyof Values) => ({
    value: values[key],
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    disabled: submitting,
    ref: (el: HTMLInputElement | null) => {
      refs.current[key] = el;
    },
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    const found: Errors = {};
    if (values.name.trim().length < 2) found.name = "Vui lòng nhập họ tên.";
    if (!/^0\d{9}$/.test(normalizePhone(values.phone))) found.phone = "Số điện thoại cần đủ 10 chữ số, bắt đầu bằng 0.";
    if (values.password.length < 8) found.password = "Mật khẩu cần ít nhất 8 ký tự.";
    if (needsOrder && !values.orderCode.trim()) found.orderCode = "Bạn nhập mã một đơn đã đặt bằng số này.";
    setErrors(found);
    const first = (["name", "phone", "password", "orderCode"] as const).find((key) => found[key]);
    if (first) return refs.current[first]?.focus();

    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await postJson("/api/account/register", { ...values, orderCode: values.orderCode || undefined });
      if (result.ok) {
        announceSession();
        router.replace(accountHref);
        router.refresh();
        return;
      }
      if (result.code === "NEEDS_ORDER_CODE") {
        setNeedsOrder(true);
        setErrors({ orderCode: result.error });
        setTimeout(() => refs.current.orderCode?.focus());
        return;
      }
      const fields: Errors = {};
      for (const issue of result.issues ?? []) fields[issue.path[0] as keyof Values] = issue.message;
      setErrors(Object.keys(fields).length ? fields : { form: result.error });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Field label="Họ tên" error={errors.name}>
        <Input {...bind("name")} autoComplete="name" />
      </Field>
      <Field label="Số điện thoại" hint="Dùng để đăng nhập và nhận gọi xác nhận đơn." error={errors.phone}>
        <Input {...bind("phone")} inputMode="tel" autoComplete="tel" />
      </Field>
      <Field label="Mật khẩu" hint="Ít nhất 8 ký tự." error={errors.password}>
        <Input {...bind("password")} type="password" autoComplete="new-password" />
      </Field>
      {needsOrder && (
        <Field label="Mã một đơn đã đặt" hint="Mã có dạng AC2611ABCDEF, nằm trong tin xác nhận đơn." error={errors.orderCode}>
          <Input {...bind("orderCode")} autoCapitalize="characters" />
        </Field>
      )}
      {errors.form && (
        <p role="alert" className="text-sm text-err">
          {errors.form}
        </p>
      )}
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" loading={submitting}>
          Tạo tài khoản
        </Button>
        <p className="text-sm text-ink-2">
          Đã có tài khoản?{" "}
          <Link href={loginHref} className="font-medium text-wood underline-offset-4 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </form>
  );
}
