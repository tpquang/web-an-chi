"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { OrderSummary } from "@/lib/api";
import { normalizePhone } from "@/lib/checkout";
import { postJson } from "@/lib/client-api";
import { cancelPolicyText, customerStatus, orderSteps, stepIndex } from "@/lib/order";
import { formatVnd } from "@/lib/site";
import { CheckIcon } from "../icons";
import { Button } from "../ui/button";
import { Field, Input } from "../ui/field";
import { Tag, type Tone } from "../ui/tag";
import { showToast } from "../ui/toast";

const reasons = ["Tôi đổi ý", "Đặt nhầm sản phẩm hoặc số lượng", "Muốn đổi địa chỉ, sẽ đặt lại", "Chưa chuyển khoản kịp"];

const tone = (order: OrderSummary): Tone =>
  order.status === "CANCELLED" ? "neutral" : order.status === "RETURNED" ? "err" : order.status === "COMPLETED" ? "ok" : order.amountDue > 0 ? "warn" : "info";

// "23:43 ngày 27/11", giờ Việt Nam
function time(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", hourCycle: "h23", timeZone: "Asia/Ho_Chi_Minh" })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.hour}:${parts.minute} ngày ${parts.day}/${parts.month}`;
}

// Trạng thái đơn cho khách: tiến trình, hạn chuyển khoản, mã vận đơn, chính sách huỷ, nút huỷ khi shop chưa xác nhận.
// phone: trang tra cứu đã xác minh số điện thoại nên không hỏi lại. onChange: trang tra cứu cập nhật tại chỗ; không có thì tải lại trang
export function OrderStatusCard({ order, phone, onChange }: { order: OrderSummary; phone?: string; onChange?: (order: OrderSummary) => void }) {
  const step = stepIndex(order.status);
  const policy = cancelPolicyText(order);
  const refundText =
    order.refundVnd > 0 ? (order.refundedAt ? `Shop đã hoàn ${formatVnd(order.refundVnd)} cho bạn.` : `Shop sẽ hoàn ${formatVnd(order.refundVnd)} cho bạn, thường trong 1–3 ngày làm việc.`) : null;

  return (
    <section aria-labelledby="trang-thai" className="flex flex-col gap-4 rounded-3xl border border-edge bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="trang-thai" className="font-serif text-2xl leading-tight">
          Trạng thái đơn
        </h2>
        <Tag tone={tone(order)}>{customerStatus(order)}</Tag>
      </div>

      {step >= 0 && (
        <ol className="grid grid-cols-4 gap-2" aria-label="Tiến trình đơn">
          {orderSteps.map((s, i) => (
            <li key={s.status} aria-current={i === step ? "step" : undefined} className="flex flex-col gap-2">
              <span className={`h-1.5 rounded-full ${i <= step ? "bg-wood" : "bg-line"}`} />
              <span className={`flex items-center gap-1 text-xs sm:text-sm ${i === step ? "font-medium text-ink" : i < step ? "text-ink-2" : "text-ink-3"}`}>
                {i < step && <CheckIcon size={14} className="flex-none text-wood" />}
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      )}

      {order.status === "CANCELLED" && (
        <p className="text-sm">
          {order.cancelledBy === "SYSTEM" ? "Đơn tự huỷ vì quá hạn chuyển khoản." : order.cancelledBy === "CUSTOMER" ? "Bạn đã huỷ đơn này." : "Shop đã huỷ đơn này."}
          {order.cancelReason && order.cancelledBy !== "SYSTEM" ? ` Lý do: ${order.cancelReason}.` : ""} {refundText}
        </p>
      )}
      {order.status === "RETURNED" && <p className="text-sm">Đơn đã được hoàn về shop. {refundText}</p>}
      {order.paymentDueAt && order.amountDue > 0 && (
        <p className="rounded-xl bg-warn-soft px-4 py-3 text-sm">
          Bạn chuyển {formatVnd(order.amountDue)} trước <strong className="font-semibold">{time(order.paymentDueAt)}</strong>. Quá hạn chưa nhận được tiền, đơn tự huỷ để nhường hàng cho khách khác.
        </p>
      )}
      {order.status === "SHIPPING" && (order.carrier || order.trackingCode) && (
        <p className="text-sm">
          Vận chuyển: <span className="font-medium">{[order.carrier, order.trackingCode].filter(Boolean).join(" · ")}</span>
        </p>
      )}
      {policy && <p className="text-sm text-ink-2">{policy}</p>}
      {order.canCancel && <CancelForm order={order} phone={phone} onChange={onChange} />}
    </section>
  );
}

function CancelForm({ order, phone, onChange }: { order: OrderSummary; phone?: string; onChange?: (order: OrderSummary) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [typedPhone, setTypedPhone] = useState("");
  const [errors, setErrors] = useState<{ reason?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!reason) found.reason = "Chọn lý do huỷ.";
    if (!phone && !/^0\d{9}$/.test(normalizePhone(typedPhone))) found.phone = "Nhập số điện thoại đã dùng khi đặt hàng.";
    setErrors(found);
    if (found.phone) return phoneRef.current?.focus();
    if (found.reason) return;
    setSubmitting(true);
    const result = await postJson<OrderSummary>(`/api/orders/${encodeURIComponent(order.code)}/cancel`, { phone: phone ?? typedPhone, reason });
    setSubmitting(false);
    if (!result.ok) {
      if (result.code === "PHONE_MISMATCH") {
        setErrors({ phone: result.error });
        return phoneRef.current?.focus();
      }
      showToast({ type: "error", title: "Chưa huỷ được đơn", desc: result.error });
      if (result.code === "CANNOT_CANCEL") router.refresh();
      return;
    }
    showToast({ title: "Đã huỷ đơn", desc: order.paidVnd > 0 ? "Shop sẽ liên hệ để hoàn tiền cho bạn." : `Đơn ${order.code} đã được huỷ.` });
    if (onChange) onChange({ ...order, ...result.data });
    else router.refresh();
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="self-start">
        Huỷ đơn
      </Button>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 border-t border-line pt-4">
      <fieldset disabled={submitting} className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">
          Vì sao bạn huỷ đơn?<span aria-hidden className="ml-0.5 text-err">*</span>
        </legend>
        {reasons.map((r) => (
          <label key={r} className="flex min-h-11 items-center gap-3 rounded-xl border border-line px-3 text-sm has-checked:border-wood has-checked:bg-wood-soft">
            <input type="radio" name="ly-do-huy" value={r} checked={reason === r} onChange={() => setReason(r)} className="size-4.5 accent-wood" />
            {r}
          </label>
        ))}
        {errors.reason && (
          <p role="alert" className="text-sm text-err">
            {errors.reason}
          </p>
        )}
      </fieldset>
      {!phone && (
        <Field label="Số điện thoại đặt hàng" required error={errors.phone}>
          <Input ref={phoneRef} value={typedPhone} onChange={(e) => setTypedPhone(e.target.value)} inputMode="tel" autoComplete="tel" disabled={submitting} />
        </Field>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="outline" loading={submitting}>
          Huỷ đơn này
        </Button>
        <Button variant="text" onClick={() => setOpen(false)} disabled={submitting}>
          Giữ đơn
        </Button>
      </div>
    </form>
  );
}
