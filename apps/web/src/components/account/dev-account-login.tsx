"use client";

import { useEffect, useState } from "react";
import { postJson } from "@/lib/client-api";

type SampleCustomer = { name: string; phone: string };

// Chỉ có khi `next dev`: đăng nhập thành khách mẫu, không cần mật khẩu
export function DevAccountLogin({ onDone, disabled }: { onDone: (error?: string) => void; disabled?: boolean }) {
  const [customers, setCustomers] = useState<SampleCustomer[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/dev/sample-customers")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body) => setCustomers(body.data))
      .catch(() => {});
  }, []);

  async function login(phone: string) {
    setBusy(true);
    const result = await postJson("/api/account/dev-login", { phone });
    setBusy(false);
    onDone(result.ok ? undefined : result.status === 404 ? "API chưa bật đăng nhập nhanh. Thêm DEV_LOGIN=on vào apps/api/.env." : result.error);
  }

  if (customers.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-line p-4">
      <p className="text-sm text-ink-3">Chỉ có khi chạy dev: đăng nhập nhanh bằng khách mẫu, không cần mật khẩu.</p>
      <div className="flex flex-wrap gap-2">
        {customers.map((customer) => (
          <button
            key={customer.phone}
            type="button"
            disabled={disabled || busy}
            onClick={() => login(customer.phone)}
            className="inline-flex min-h-11 items-center rounded-md border border-line-strong px-4 text-sm hover:border-wood hover:text-wood disabled:opacity-60"
          >
            {customer.name}
          </button>
        ))}
      </div>
    </div>
  );
}
