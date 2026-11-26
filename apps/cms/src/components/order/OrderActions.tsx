import { useState } from "react";
import { Button } from "../ui/Button";
import { Field, Input, MoneyInput, Textarea } from "../ui/Field";
import { confirmDialog, Modal } from "../ui/Modal";
import { Panel } from "../ui/Page";
import { Select } from "../ui/Select";
import { showToast } from "../ui/Toast";
import { api } from "../../lib/api";
import { formatVnd } from "../../lib/format";
import { cancelActor, cancelReasons, carriers, orderStatus, transitionAction, type OrderStatus } from "../../lib/labels";
import type { Order } from "../../lib/types";
import { useSubmit } from "../../lib/use-submit";

// Nút hành động theo trạng thái đơn. Mỗi lúc một nút chính; luật chuyển do API quyết (order-flow.ts)
export function OrderActions({ order, onDone, editable }: { order: Order; onDone: () => void; editable: boolean }) {
  const [shipOpen, setShipOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const { submitting, run } = useSubmit();

  const move = (to: OrderStatus, extra: Record<string, unknown> = {}) =>
    run(async () => {
      await api.post(`/orders/${order.id}/transition`, { to, ...extra });
      showToast(`Đơn ${order.code}: ${orderStatus[to].label.toLowerCase()}.`);
      setShipOpen(false);
      setReturnOpen(false);
      onDone();
    }, "Chưa đổi được trạng thái");

  async function onAction(to: OrderStatus) {
    if (to === "SHIPPING") return setShipOpen(true);
    if (to === "RETURNED") return setReturnOpen(true);
    if (to === "CONFIRMED" && order.amountDue > 0) {
      const ok = await confirmDialog({
        title: "Khách chưa chuyển đủ tiền",
        desc: `Đơn còn ${formatVnd(order.amountDue)} chưa nhận. Xác nhận thì hệ thống thôi đếm hạn và không tự huỷ đơn. Nếu đã nhận tiền, bạn ghi nhận tiền ở mục Thanh toán trước.`,
        confirmLabel: "Vẫn xác nhận",
        cancelLabel: "Để sau",
      });
      if (!ok) return;
    }
    move(to);
  }

  // Hoàn hàng ở đơn đã giao là việc hiếm, không làm nút chính
  const primary = order.next.find((to) => to !== "RETURNED");
  const secondary = order.next.filter((to) => to !== primary);
  const closed = order.next.length === 0 && !order.canCancel;

  return (
    <Panel title="Xử lý đơn">
      <div className="flex flex-col gap-3">
        {order.status === "CANCELLED" && (
          <p className="rounded-lg bg-paper-2 px-3 py-2 text-sm">
            {order.cancelledBy ? cancelActor[order.cancelledBy] : "Đã huỷ"}
            {order.cancelReason ? `: ${order.cancelReason}` : ""}
          </p>
        )}
        {primary && editable && (
          <Button onClick={() => onAction(primary)} loading={submitting} block>
            {transitionAction[primary]?.label ?? orderStatus[primary].label}
          </Button>
        )}
        {primary && transitionAction[primary] && <p className="-mt-1 text-sm text-ink-3">{transitionAction[primary]!.desc}</p>}
        {editable && secondary.map((to) => (
          <Button key={to} variant="outline" onClick={() => onAction(to)} disabled={submitting} block>
            {transitionAction[to]?.label ?? orderStatus[to].label}
          </Button>
        ))}
        {editable && order.canCancel && (
          <button type="button" onClick={() => setCancelOpen(true)} disabled={submitting} className="min-h-10 self-start text-sm font-medium text-err underline-offset-4 hover:underline disabled:opacity-60">
            Huỷ đơn
          </button>
        )}
        {closed && <p className="text-sm text-ink-3">Đơn đã đóng, không còn bước xử lý.</p>}
        {order.status === "SHIPPING" && <p className="text-sm text-ink-3">Đang giao không huỷ được. Khách không nhận thì chọn Hoàn hàng.</p>}
      </div>

      {shipOpen && <ShipModal order={order} submitting={submitting} onClose={() => setShipOpen(false)} onSubmit={(extra) => move("SHIPPING", extra)} />}
      {returnOpen && <ReturnModal order={order} submitting={submitting} onClose={() => setReturnOpen(false)} onSubmit={(note) => move("RETURNED", { note })} />}
      {cancelOpen && <CancelModal order={order} onClose={() => setCancelOpen(false)} onDone={onDone} />}
    </Panel>
  );
}

function ShipModal({ order, submitting, onClose, onSubmit }: { order: Order; submitting: boolean; onClose: () => void; onSubmit: (extra: { carrier: string; trackingCode: string }) => void }) {
  const [carrier, setCarrier] = useState(order.carrier ?? carriers[0]);
  const [trackingCode, setTrackingCode] = useState(order.trackingCode ?? "");
  return (
    <Modal
      open
      onClose={onClose}
      title="Giao cho vận chuyển"
      locked={submitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Để sau</Button>
          <Button onClick={() => onSubmit({ carrier, trackingCode })} loading={submitting}>Ghi đang giao</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Đơn vị vận chuyển">
          <Select value={carrier} onChange={setCarrier} options={carriers.map((c) => ({ value: c, label: c }))} />
        </Field>
        <Field label="Mã vận đơn" optional hint="Khách tra cứu đơn sẽ thấy mã này.">
          <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} maxLength={80} disabled={submitting} />
        </Field>
      </div>
    </Modal>
  );
}

function ReturnModal({ order, submitting, onClose, onSubmit }: { order: Order; submitting: boolean; onClose: () => void; onSubmit: (note: string) => void }) {
  const [note, setNote] = useState("");
  return (
    <Modal
      open
      onClose={onClose}
      title="Ghi hoàn hàng"
      locked={submitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Để sau</Button>
          <Button variant="danger" onClick={() => onSubmit(note)} loading={submitting}>Ghi hoàn hàng</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <p>
          Kho được cộng lại theo đơn.
          {order.paidVnd > 0 ? ` Khách đã trả ${formatVnd(order.paidVnd)}: gợi ý hoàn ${formatVnd(Math.max(0, order.paidVnd - order.shippingVnd))} (trừ phí giao), sửa ở mục Thanh toán.` : " Khách chưa trả tiền nên không có tiền hoàn."}
        </p>
        <Field label="Lý do" optional>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Khách không nghe máy khi giao" maxLength={300} disabled={submitting} />
        </Field>
      </div>
    </Modal>
  );
}

function CancelModal({ order, onClose, onDone }: { order: Order; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [refund, setRefund] = useState<number | null>(order.suggestedRefund);
  const { submitting, errors, run } = useSubmit();
  const kept = order.paidVnd - order.suggestedRefund;

  function submit() {
    run(async () => {
      await api.post(`/orders/${order.id}/cancel`, { reason, refundVnd: order.paidVnd > 0 ? (refund ?? 0) : undefined });
      showToast(`Đã huỷ đơn ${order.code}.`, { desc: "Kho đã được cộng lại." });
      onClose();
      onDone();
    }, "Chưa huỷ được đơn");
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Huỷ đơn ${order.code}`}
      locked={submitting}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Giữ đơn</Button>
          <Button variant="danger" onClick={submit} loading={submitting}>Huỷ đơn</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div data-field="reason">
          <Field label="Lý do huỷ" error={errors.reason}>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={300} disabled={submitting} />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            {cancelReasons.map((r) => (
              <button key={r} type="button" onClick={() => setReason(r)} disabled={submitting} className="min-h-9 rounded-full border border-line px-3 text-sm hover:border-wood hover:text-wood aria-pressed:border-wood aria-pressed:text-wood" aria-pressed={reason === r}>
                {r}
              </button>
            ))}
          </div>
        </div>
        {order.paidVnd > 0 ? (
          <div data-field="refundVnd">
            <Field
              label="Tiền phải hoàn cho khách"
              hint={kept > 0 ? `Theo chính sách: đơn có hàng làm riêng đã xác nhận nên giữ ${formatVnd(kept)} tiền cọc. Bạn sửa được nếu thoả thuận khác.` : `Khách đã trả ${formatVnd(order.paidVnd)}, hoàn đủ theo chính sách.`}
              error={errors.refundVnd}
            >
              <MoneyInput value={refund} onChange={setRefund} disabled={submitting} />
            </Field>
          </div>
        ) : (
          <p className="text-sm text-ink-3">Khách chưa trả tiền nên không có tiền hoàn. Kho được cộng lại.</p>
        )}
      </div>
    </Modal>
  );
}
