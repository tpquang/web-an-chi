"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { announceSession } from "@/lib/account-client";
import { normalizePhone } from "@/lib/checkout";
import { postJson } from "@/lib/client-api";
import { registerHref } from "@/lib/links";
import { Button } from "../ui/button";
import { Field, Input } from "../ui/field";
import { DevAccountLogin } from "./dev-account-login";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ phone?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function finish(error?: string) {
    if (error) {
      setErrors({ form: error });
      return;
    }
    announceSession();
    router.replace(next);
    router.refresh();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    const found: typeof errors = {};
    if (!/^0\d{9}$/.test(normalizePhone(phone))) found.phone = "Số điện thoại cần đủ 10 chữ số, bắt đầu bằng 0.";
    if (!password) found.password = "Bạn nhập mật khẩu.";
    setErrors(found);
    if (found.phone) return phoneRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();

    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await postJson("/api/account/login", { phone, password });
      finish(result.ok ? undefined : result.error);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Số điện thoại" error={errors.phone}>
          <Input ref={phoneRef} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" disabled={submitting} />
        </Field>
        <Field label="Mật khẩu" error={errors.password}>
          <Input ref={passwordRef} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" disabled={submitting} />
        </Field>
        {errors.form && (
          <p role="alert" className="text-sm text-err">
            {errors.form}
          </p>
        )}
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" loading={submitting}>
            Đăng nhập
          </Button>
          <p className="text-sm text-ink-2">
            Chưa có tài khoản?{" "}
            <Link href={registerHref} className="font-medium text-wood underline-offset-4 hover:underline">
              Tạo tài khoản
            </Link>
          </p>
        </div>
      </form>
      {process.env.NODE_ENV === "development" && <DevAccountLogin onDone={finish} disabled={submitting} />}
    </div>
  );
}
