import { useState } from "react";
import { Button } from "../ui/Button";
import { Field, Input, MoneyInput } from "../ui/Field";
import { confirmDialog, Modal } from "../ui/Modal";
import { Panel } from "../ui/Page";
import { Tag } from "../ui/States";
import { showToast } from "../ui/Toast";
import { api } from "../../lib/api";
import { formatDateTime, formatVnd } from "../../lib/format";
import { paymentMethod, paymentStatus } from "../../lib/labels";
import type { Order } from "../../lib/types";
import { useSubmit } from "../../lib/use-submit";

// "Còn 3 giờ", "Quá hạn 20 phút"
export function dueText(iso: string, now = Date.now()) {
  const ms = Date.parse(iso) - now;
  const abs = Math.abs(ms);
  const span = abs >= 3_600_000 ? `${Math.round(abs / 3_600_000)} giờ` : `${Math.max(1, Math.round(abs / 60_000))} phút`;
  return ms >= 0 ? `còn ${span}` : `quá hạn ${span}`;
}

// Khối thanh toán: phải thu, đã nhận, cọc, hạn chuyển khoản, tiền hoàn. Ghi nhận tiền và hoàn tiền đều vào lịch sử đơn
export function OrderPayment({ order, onDone, editable }: { order: Order; onDone: () => void; editable: boolean }) {
  const [payOpen, setPayOpen] = useState(false);
  const { submitting, run } = useSubmit();
  const remaining = Math.max(0, order.totalVnd - order.paidVnd);
  const closed = order.status === "CANCELLED" || order.status === "RETURNED";
  const refundDue = order.refundVnd > 0 && !order.refundedAt;

  async function markRefunded() {
    const ok = await confirmDialog({ title: "Ghi đã hoàn tiền", desc: `Xác nhận đã chuyển trả ${formatVnd(order.refundVnd)} cho khách ${order.customerName}.`, confirmLabel: "Đã hoàn tiền", cancelLabel: "Để sau" });
    if (!ok) return;
    run(async () => {
      await api.post(`/orders/${order.id}/refund`, {});
      showToast("Đã ghi hoàn tiền.");
      onDone();
    }, "Chưa ghi được hoàn tiền");
  }

  const rows: [string, string, string?][] = [
    ["Phải thu", formatVnd(order.totalVnd)],
    ...(order.depositVnd > 0 ? [["Tiền cọc", formatVnd(order.depositVnd)] as [string, string]] : []),
    ["Đã nhận", formatVnd(order.paidVnd), order.paidVnd > 0 ? "font-medium text-ok" : undefined],
    ...(!closed ? [["Còn lại", formatVnd(remaining)] as [string, string]] : []),
    ...(order.refundVnd > 0 ? [[order.refundedAt ? `Đã hoàn ${formatDateTime(order.refundedAt)}` : "Phải hoàn cho khách", formatVnd(order.refundVnd), order.refundedAt ? undefined : "font-semibold text-err"] as [string, string, string?]] : []),
  ];

  return (
    <Panel title="Thanh toán">
      <div className="flex flex-col gap-3">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          {paymentMethod[order.paymentMethod]} <Tag tone={paymentStatus[order.paymentStatus].tone}>{paymentStatus[order.paymentStatus].label}</Tag>
        </p>
        <dl className="grid grid-cols-2 gap-y-1 rounded-lg bg-paper-2 p-3 text-sm">
          {rows.map(([label, value, cls]) => (
            <div key={label} className="contents">
              <dt className="text-ink-2">{label}</dt>
              <dd className={`text-right tabular-nums ${cls ?? ""}`}>{value}</dd>
            </div>
          ))}
        </dl>
        {order.paymentDueAt && !closed && (
          <p className={`rounded-lg px-3 py-2 text-sm ${Date.parse(order.paymentDueAt) - Date.now() < 2 * 3_600_000 ? "bg-warn-soft" : "bg-paper-2"}`}>
            Chờ khách chuyển {formatVnd(order.amountDue)}, hạn {formatDateTime(order.paymentDueAt)} ({dueText(order.paymentDueAt)}). Quá hạn chưa nhận đủ thì hệ thống tự huỷ đơn.
          </p>
        )}
        {editable && !closed && remaining > 0 && (
          <Button variant={order.amountDue > 0 ? "primary" : "outline"} onClick={() => setPayOpen(true)} block>
            Ghi nhận tiền
          </Button>
        )}
        {editable && refundDue && (
          <Button variant="outline" onClick={markRefunded} loading={submitting} block>
            Đã hoàn {formatVnd(order.refundVnd)} cho khách
          </Button>
        )}
      </div>
      {payOpen && <PayModal order={order} onClose={() => setPayOpen(false)} onDone={onDone} />}
    </Panel>
  );
}

function PayModal({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState<number | null>(order.amountDue > 0 ? order.amountDue : order.totalVnd - order.paidVnd);
  const [note, setNote] = useState("");
  const { submitting, errors, run } = useSubmit();

  function submit() {
    run(async () => {
      await api.post(`/orders/${order.id}/payment`, { amountVnd: amount ?? 0, note });
      showToast(`Đã ghi nhận ${formatVnd(amount ?? 0)}.`);
      onClose();
      onDone();
    }, "Chưa ghi nhận được tiền");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Ghi nhận tiền đã nhận"
      locked={submitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Để sau</Button>
          <Button onClick={submit} loading={submitting}>Ghi nhận</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div data-field="amountVnd">
          <Field label="Số tiền" hint={`Đã nhận ${formatVnd(order.paidVnd)} trên ${formatVnd(order.totalVnd)}. Nhận đủ cọc hoặc đủ tiền thì hệ thống thôi đếm hạn.`} error={errors.amountVnd}>
            <MoneyInput value={amount} onChange={setAmount} disabled={submitting} />
          </Field>
        </div>
        <Field label="Ghi chú" optional>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Vietcombank, 14:05" maxLength={300} disabled={submitting} />
        </Field>
      </div>
    </Modal>
  );
}
