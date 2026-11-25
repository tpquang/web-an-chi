"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import type { BraceletDesign } from "@/lib/cart";
import { loadDraft, normalizePhone, saveDraft } from "@/lib/checkout";
import { postJson } from "@/lib/client-api";
import { launchDateLabel } from "@/lib/launch";
import { formatVnd } from "@/lib/site";
import { trackEvent } from "@/lib/track";
import { Button } from "../ui/button";
import { Field, Input, Textarea } from "../ui/field";
import { Modal } from "../ui/modal";
import { QuantityInput } from "../ui/quantity-input";

// Món đặt chờ: một sản phẩm (có số lượng) hoặc một vòng tự thiết kế
export type PreorderItem = { slug: string; name: string; priceVnd: number; design?: BraceletDesign; maxQuantity?: number };

type Errors = { name?: string; phone?: string };

// Đặt chờ trước ngày mở bán: chỉ hỏi tên và số điện thoại (theo anchi-growth mục 6, chỉ thu thứ cần).
// Đơn vào CMS ở trạng thái "Đặt chờ"; shop gọi lại chốt địa chỉ, phí giao rồi mới trừ kho
export function PreorderDialog({ item, open, onClose }: { item: PreorderItem; open: boolean; onClose(): void }) {
  return (
    <Modal open={open} onClose={onClose} title="Đặt chờ">
      <PreorderForm item={item} onClose={onClose} />
    </Modal>
  );
}

function PreorderForm({ item, onClose }: { item: PreorderItem; onClose(): void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ code: string; phone: string } | null>(null);
  const key = useRef("");
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);

  // Điền sẵn tên và số đã gõ ở form đặt hàng trong tab này
  useEffect(() => {
    key.current = crypto.randomUUID();
    const draft = loadDraft();
    setName(draft.name);
    setPhone(draft.phone);
  }, []);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const total = item.priceVnd * (item.design ? 1 : quantity);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const found: Errors = {};
    if (name.trim().length < 2) found.name = "Vui lòng nhập họ tên để shop xưng hô khi gọi lại.";
    if (!/^0\d{9}$/.test(normalizePhone(phone))) found.phone = "Số điện thoại cần đủ 10 chữ số, bắt đầu bằng 0.";
    setErrors(found);
    setFailure(null);
    if (found.name) return nameRef.current?.focus();
    if (found.phone) return phoneRef.current?.focus();

    setSubmitting(true);
    const result = await postJson<{ code: string }>("/api/preorders", {
      idempotencyKey: key.current,
      customer: { name, phone, note },
      items: [{ slug: item.slug, quantity: item.design ? 1 : quantity, ...(item.design ? { design: item.design } : {}) }],
    });
    setSubmitting(false);
    if (result.ok) {
      const draft = loadDraft();
      saveDraft({ ...draft, name: name.trim(), phone: normalizePhone(phone) });
      // Chỉ gửi mã đơn và giá trị, không gửi tên hay số điện thoại vào công cụ đo
      trackEvent("preorder", { transaction_id: result.data.code, value: total, items: [{ item_id: item.slug, quantity: item.design ? 1 : quantity }] });
      setDone({ code: result.data.code, phone: normalizePhone(phone) });
      return;
    }
    const issue = result.issues?.find((i) => i.path.includes("phone") || i.path.includes("name"));
    if (issue?.path.includes("phone")) setErrors({ phone: issue.message });
    else if (issue?.path.includes("name")) setErrors({ name: issue.message });
    else setFailure(result.error);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p ref={doneRef} tabIndex={-1} role="status" className="focus:outline-none">
          Shop đã nhận đơn đặt chờ <span className="font-semibold tabular-nums">{done.code}</span>.
        </p>
        <p className="text-ink-2">
          Shop sẽ gọi số <span className="font-medium text-ink tabular-nums">{done.phone}</span> để chốt địa chỉ, phí giao và thời gian giao trước
          ngày mở bán {launchDateLabel}. Bạn chưa phải thanh toán gì lúc này.
        </p>
        <p className="text-sm text-ink-3">Tra cứu đơn bằng mã trên và số điện thoại ở trang Tra cứu đơn hàng.</p>
        <div className="flex justify-end">
          <Button onClick={onClose}>Xong</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="rounded-xl bg-paper-2 p-4">
        <p className="font-medium">{item.name}</p>
        {!item.design && (
          <div className="mt-3">
            <QuantityInput value={quantity} max={item.maxQuantity ?? 99} onChange={setQuantity} label="Số lượng đặt chờ" disabled={submitting} />
          </div>
        )}
        <p className="mt-3 flex items-baseline justify-between text-sm text-ink-2" aria-live="polite">
          Tạm tính
          <span className="font-serif text-xl font-semibold text-ink tabular-nums">{formatVnd(total)}</span>
        </p>
      </div>
      <p className="text-sm text-ink-2">
        Shop mở bán ngày {launchDateLabel}. Bạn để lại tên và số điện thoại, shop gọi lại chốt địa chỉ và phí giao. Chưa cần thanh toán.
      </p>

      <Field label="Họ tên" error={errors.name}>
        <Input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} disabled={submitting} />
      </Field>
      <Field label="Số điện thoại" error={errors.phone} hint="Shop chỉ dùng số này để gọi lại về đơn đặt chờ.">
        <Input ref={phoneRef} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="VD: 0912 345 678" disabled={submitting} />
      </Field>
      <Field label="Ghi chú" optional>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} placeholder="VD: Gọi sau 18 giờ." disabled={submitting} />
      </Field>

      {failure && (
        <p role="alert" className="rounded-lg bg-err-soft p-3 text-sm text-err">
          {failure}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Để sau
        </Button>
        <Button type="submit" loading={submitting}>
          Gửi đơn đặt chờ
        </Button>
      </div>
    </form>
  );
}
