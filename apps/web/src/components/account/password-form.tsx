"use client";

import { useRef, useState, type FormEvent } from "react";
import { postJson } from "@/lib/client-api";
import { Button } from "../ui/button";
import { Field, Input } from "../ui/field";
import { showToast } from "../ui/toast";

type Errors = { current?: string; next?: string; confirm?: string };

// Đổi mật khẩu đăng xuất mọi thiết bị khác, thiết bị đang dùng vẫn giữ đăng nhập.
// Tài khoản chưa có mật khẩu (tạo qua Google) thì đặt mới, không hỏi mật khẩu cũ
export function PasswordForm({ hasPassword, hasPhone }: { hasPassword: boolean; hasPhone: boolean }) {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(hasPassword);
  const inFlight = useRef(false);
  const refs = { current: useRef<HTMLInputElement>(null), next: useRef<HTMLInputElement>(null), confirm: useRef<HTMLInputElement>(null) };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    const found: Errors = {};
    if (done && !values.current) found.current = "Bạn nhập mật khẩu đang dùng.";
    if (values.next.length < 8) found.next = "Mật khẩu mới cần ít nhất 8 ký tự.";
    else if (values.next !== values.confirm) found.confirm = "Hai lần nhập chưa giống nhau.";
    setErrors(found);
    const first = (["current", "next", "confirm"] as const).find((key) => found[key]);
    if (first) return refs[first].current?.focus();

    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await postJson("/api/account/password", { currentPassword: done ? values.current : undefined, newPassword: values.next });
      if (result.ok) {
        setValues({ current: "", next: "", confirm: "" });
        showToast({ title: done ? "Đã đổi mật khẩu" : "Đã đặt mật khẩu", desc: "Các thiết bị khác đã được đăng xuất." });
        setDone(true);
        return;
      }
      if (result.code === "BAD_CURRENT_PASSWORD") {
        setErrors({ current: result.error });
        refs.current.current?.focus();
        return;
      }
      showToast({ type: "error", title: "Chưa đổi được mật khẩu", desc: result.error });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => setValues({ ...values, [key]: e.target.value });

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-3xl border border-edge bg-surface p-5 md:p-6">
      <h2 className="font-serif text-2xl leading-tight">{done ? "Đổi mật khẩu" : "Đặt mật khẩu"}</h2>
      {!done && (
        <p className="text-sm text-ink-2">
          {hasPhone ? "Đặt mật khẩu để đăng nhập được bằng số điện thoại, không cần Google." : "Bổ sung số điện thoại ở mục trên, rồi đặt mật khẩu để đăng nhập được bằng số điện thoại."}
        </p>
      )}
      {done && (
        <Field label="Mật khẩu hiện tại" error={errors.current}>
          <Input ref={refs.current} type="password" value={values.current} onChange={set("current")} autoComplete="current-password" disabled={submitting} />
        </Field>
      )}
      <Field label="Mật khẩu mới" hint="Ít nhất 8 ký tự." error={errors.next}>
        <Input ref={refs.next} type="password" value={values.next} onChange={set("next")} autoComplete="new-password" disabled={submitting} />
      </Field>
      <Field label="Nhập lại mật khẩu mới" error={errors.confirm}>
        <Input ref={refs.confirm} type="password" value={values.confirm} onChange={set("confirm")} autoComplete="new-password" disabled={submitting} />
      </Field>
      <div className="mt-2">
        <Button type="submit" loading={submitting}>
          {done ? "Đổi mật khẩu" : "Đặt mật khẩu"}
        </Button>
      </div>
    </form>
  );
}
