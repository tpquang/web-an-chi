"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { Account } from "@/lib/api";
import { postJson } from "@/lib/client-api";
import { Button } from "../ui/button";
import { Checkbox, Field, Input, Textarea } from "../ui/field";
import { showToast } from "../ui/toast";

async function patchProfile(body: unknown) {
  const res = await fetch("/api/account/me", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const json = res ? await res.json().catch(() => ({})) : {};
  return res?.ok
    ? { ok: true as const }
    : { ok: false as const, error: json.error ?? "Không gửi được. Bạn thử lại.", code: json.code as string | undefined, issues: json.issues as { path: string[]; message: string }[] | undefined };
}

// Địa chỉ lưu ở đây được điền sẵn khi đặt hàng
export function ProfileForm({ account }: { account: Account }) {
  const router = useRouter();
  const [values, setValues] = useState({
    name: account.name,
    email: account.email ?? "",
    address: account.address ?? "",
    marketingConsent: account.marketingConsent,
    // Chỉ gửi khi tài khoản chưa có số (tạo qua Google); số đã có là tên đăng nhập, không sửa ở đây
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await patchProfile(account.phone ? { ...values, phone: undefined } : values);
      if (result.ok) {
        setErrors({});
        showToast({ title: "Đã lưu thông tin", desc: "Lần đặt hàng sau shop điền sẵn địa chỉ này." });
        // Vừa bổ sung số: tải lại để tiêu đề và mục mật khẩu dùng số mới
        if (!account.phone && values.phone) router.refresh();
        return;
      }
      if (result.code === "PHONE_TAKEN") {
        setErrors({ phone: result.error });
        return;
      }
      const found: Record<string, string> = {};
      for (const issue of result.issues ?? []) found[issue.path[0]] = issue.message;
      setErrors(found);
      if (!result.issues) showToast({ type: "error", title: "Chưa lưu được", desc: result.error });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-3xl border border-edge bg-surface p-5 md:p-6">
      <h2 className="font-serif text-2xl leading-tight">Thông tin giao hàng</h2>
      <Field label="Họ tên" error={errors.name}>
        <Input value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} disabled={submitting} autoComplete="name" />
      </Field>
      {!account.phone && (
        <Field label="Số điện thoại" optional hint="Để shop gọi xác nhận đơn và để bạn đăng nhập bằng số điện thoại." error={errors.phone}>
          <Input value={values.phone} onChange={(e) => setValues({ ...values, phone: e.target.value })} disabled={submitting} inputMode="tel" autoComplete="tel" />
        </Field>
      )}
      <Field label="Email" optional error={errors.email}>
        <Input type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} disabled={submitting} autoComplete="email" />
      </Field>
      <Field label="Địa chỉ nhận hàng" optional error={errors.address}>
        <Textarea value={values.address} onChange={(e) => setValues({ ...values, address: e.target.value })} disabled={submitting} autoComplete="street-address" rows={3} />
      </Field>
      <Checkbox
        checked={values.marketingConsent}
        disabled={submitting}
        onChange={(e) => setValues({ ...values, marketingConsent: e.target.checked })}
        label="Nhận tin nhắc theo dịp lễ qua Zalo hoặc email, tối đa 2 tin mỗi tháng."
      />
      <div className="mt-2">
        <Button type="submit" loading={submitting}>
          Lưu thông tin
        </Button>
      </div>
    </form>
  );
}
