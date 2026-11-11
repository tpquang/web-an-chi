"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { postJson } from "@/lib/client-api";
import { formatDate, formatVnd } from "@/lib/site";
import { Button } from "./ui/button";
import { Field, Input } from "./ui/field";
import { EmptyState } from "./ui/states";
import { Tag } from "./ui/tag";

type Line = { id: string; quantity: number; totalCostVnd: number; inputKg: number | null; pricePerKgVnd: number | null; material: { name: string; unit: string } };
type Batch = { id: string; name: string; status: "ORDERED" | "RECEIVED"; orderedAt: string | null; receivedAt: string | null; lines: Line[] };
type Orders = { supplier: { name: string }; batches: Batch[] };

// Giữ mã trong phiên trình duyệt để tải lại trang không phải nhập lại. Đóng tab là mất
const STORAGE_KEY = "anchi-supplier-code";
const store = {
  get: () => {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set: (code: string | null) => {
    try {
      if (code) sessionStorage.setItem(STORAGE_KEY, code);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
};

export function SupplierPortal() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Orders | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const input = useRef<HTMLInputElement>(null);

  async function load(value: string, silent = false) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await postJson<Orders>("/api/supplier/orders", { code: value });
      if (result.ok) {
        setOrders(result.data);
        store.set(value);
      } else {
        store.set(null);
        if (!silent) {
          setError(result.error);
          input.current?.focus();
        }
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  useEffect(() => {
    const saved = store.get();
    if (saved) void load(saved, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = code.replace(/[^a-z0-9]/gi, "");
    if (value.length < 8) {
      setError("Mã giới thiệu gồm ít nhất 8 chữ và số, shop gửi bạn qua Zalo hoặc điện thoại.");
      return input.current?.focus();
    }
    setError(null);
    void load(value);
  }

  function signOut() {
    store.set(null);
    setOrders(null);
    setCode("");
  }

  if (!orders) {
    return (
      <form onSubmit={handleSubmit} noValidate className="flex max-w-md flex-col gap-4">
        <Field label="Mã giới thiệu" error={error ?? undefined}>
          <Input
            ref={input}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={submitting}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="VD: K7M2QX9PAB"
          />
        </Field>
        <div>
          <Button type="submit" loading={submitting}>
            Xem đơn đặt hàng
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg">
          Nhà cung cấp: <span className="font-semibold">{orders.supplier.name}</span>
        </p>
        <Button variant="text" onClick={signOut}>
          Thoát
        </Button>
      </div>

      {orders.batches.length === 0 ? (
        <EmptyState title="Chưa có đơn đặt hàng nào." desc="Khi shop đặt hàng, đơn sẽ hiện ở đây. Bạn mở lại trang này sau nhé." />
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.batches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </ul>
      )}
    </div>
  );
}

function BatchCard({ batch }: { batch: Batch }) {
  const total = batch.lines.reduce((sum, line) => sum + line.totalCostVnd, 0);
  return (
    <li className="rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{batch.name}</h2>
          <p className="text-sm text-ink-3">
            {batch.orderedAt ? `Đặt ngày ${formatDate(batch.orderedAt)}` : "Chưa ghi ngày đặt"}
            {batch.receivedAt ? ` · Nhận ngày ${formatDate(batch.receivedAt)}` : ""}
          </p>
        </div>
        <Tag tone={batch.status === "RECEIVED" ? "ok" : "wood"}>{batch.status === "RECEIVED" ? "Shop đã nhận hàng" : "Đang chờ giao"}</Tag>
      </div>
      <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
        {batch.lines.map((line) => (
          <div key={line.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 py-3">
            <dt className="font-medium">{line.material.name}</dt>
            <dd className="text-right tabular-nums">{formatVnd(line.totalCostVnd)}</dd>
            <dd className="col-span-2 text-ink-2 tabular-nums">
              {line.quantity.toLocaleString("vi-VN")} {line.material.unit}
              {line.inputKg ? ` · ${line.inputKg.toLocaleString("vi-VN")} kg` : ""}
              {line.pricePerKgVnd ? ` × ${formatVnd(line.pricePerKgVnd)}/kg` : ""}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 flex justify-between font-semibold tabular-nums">
        <span>Tổng tiền hàng</span>
        <span>{formatVnd(total)}</span>
      </p>
    </li>
  );
}
