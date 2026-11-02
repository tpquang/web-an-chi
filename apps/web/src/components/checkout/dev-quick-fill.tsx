"use client";

import { useEffect, useState } from "react";
import type { CheckoutValues } from "@/lib/checkout";

type SampleCustomer = { name: string; phone: string; email?: string; address?: string };

// Nút điền nhanh khách mẫu để test giao diện. Bản build production không render khối này
export function DevQuickFill({ onFill, disabled }: { onFill: (values: Partial<CheckoutValues>) => void; disabled?: boolean }) {
  const [customers, setCustomers] = useState<SampleCustomer[]>([]);

  useEffect(() => {
    fetch("/api/dev/sample-customers")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body) => setCustomers(body.data))
      .catch(() => {});
  }, []);

  if (customers.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-line p-4">
      <p className="text-sm text-ink-3">Chỉ có khi chạy dev: điền nhanh bằng khách mẫu.</p>
      <div className="flex flex-wrap gap-2">
        {customers.map((customer) => (
          <button
            key={customer.phone}
            type="button"
            disabled={disabled}
            onClick={() =>
              onFill({ name: customer.name, phone: customer.phone, email: customer.email ?? "", address: customer.address ?? "" })
            }
            className="inline-flex min-h-11 items-center rounded-md border border-line-strong px-4 text-sm hover:border-wood hover:text-wood disabled:opacity-60"
          >
            {customer.name}
          </button>
        ))}
      </div>
    </div>
  );
}
