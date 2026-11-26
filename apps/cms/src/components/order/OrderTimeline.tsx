import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { Panel } from "../ui/Page";
import { showToast } from "../ui/Toast";
import { api } from "../../lib/api";
import { formatDateTime, formatVnd } from "../../lib/format";
import { orderStatus } from "../../lib/labels";
import type { OrderEvent } from "../../lib/types";
import { useSubmit } from "../../lib/use-submit";

function describe(event: OrderEvent) {
  switch (event.type) {
    case "CREATED":
      return `Tạo đơn${event.toStatus ? `, ${orderStatus[event.toStatus].label.toLowerCase()}` : ""}`;
    case "STATUS":
      return `${event.fromStatus ? orderStatus[event.fromStatus].label : ""} → ${event.toStatus ? orderStatus[event.toStatus].label : ""}`;
    case "PAYMENT":
      return `Nhận ${formatVnd(event.amountVnd ?? 0)}`;
    case "REFUND":
      return `Đã hoàn ${formatVnd(event.amountVnd ?? 0)} cho khách`;
    case "NOTE":
      return "Ghi chú";
  }
}

// Lịch sử đơn mới nhất lên đầu, kèm ô ghi chú nội bộ (đã gọi khách, hẹn giờ giao...)
export function OrderTimeline({ orderId, events, onDone, editable }: { orderId: string; events: OrderEvent[]; onDone: () => void; editable: boolean }) {
  const [note, setNote] = useState("");
  const { submitting, errors, run } = useSubmit();

  function submit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await api.post(`/orders/${orderId}/notes`, { note });
      setNote("");
      showToast("Đã thêm ghi chú.");
      onDone();
    }, "Chưa thêm được ghi chú");
  }

  return (
    <Panel title="Lịch sử đơn">
      {editable && (
        <form onSubmit={submit} className="mb-4 flex gap-2" data-field="note">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú nội bộ, VD: Đã gọi, khách hẹn chiều mai" maxLength={500} disabled={submitting} aria-label="Ghi chú nội bộ" aria-invalid={errors.note ? true : undefined} />
          <Button type="submit" variant="outline" loading={submitting}>Thêm</Button>
        </form>
      )}
      <ol className="flex flex-col">
        {events.map((event) => (
          <li key={event.id} className="relative border-l border-line pb-4 pl-4 last:pb-0">
            <span aria-hidden className={`absolute top-1.5 -left-1 size-2 rounded-full ${event.type === "NOTE" ? "bg-line-strong" : "bg-wood"}`} />
            <p className="text-sm font-medium">{describe(event)}</p>
            {event.note && <p className="text-sm text-ink-2">{event.note}</p>}
            <p className="text-xs text-ink-3">
              {event.actor} · {formatDateTime(event.createdAt)}
            </p>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
