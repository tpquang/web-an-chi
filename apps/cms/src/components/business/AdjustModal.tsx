import { useState, type FormEvent } from "react";
import { api } from "../../lib/api";
import { writeOffReasons } from "../../lib/inventory";
import { useSubmit } from "../../lib/use-submit";
import { Button } from "../ui/Button";
import { Field, Input, NumberInput } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { showToast } from "../ui/Toast";

type Target = { kind: "materials" | "products"; id: string; name: string; unit: string; stock: number };

// Ghi hao hụt (trừ kho) hoặc điều chỉnh sau kiểm kê (cộng hoặc trừ) cho nguyên liệu hay thành phẩm
export function AdjustModal({ target, onClose, onDone }: { target: Target | null; onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState<"WRITE_OFF" | "ADJUST">("WRITE_OFF");
  const [quantity, setQuantity] = useState<number | null>(null);
  const [reason, setReason] = useState(writeOffReasons[0]);
  const { submitting, errors, run } = useSubmit();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!target) return;
    run(async () => {
      await api.post(`/${target.kind}/${target.id}/adjust`, { type, quantity, reason });
      showToast(type === "WRITE_OFF" ? "Đã ghi hao hụt." : "Đã điều chỉnh kho.");
      onDone();
      onClose();
    }, "Chưa ghi được");
  }

  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      locked={submitting}
      title={target ? `Kho: ${target.name}` : ""}
      footer={<><Button variant="secondary" onClick={onClose} disabled={submitting}>Huỷ</Button><Button type="submit" form="adjust-form" loading={submitting}>Ghi vào sổ kho</Button></>}
    >
      {target && (
        <form id="adjust-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <p className="text-sm text-ink-2">Tồn hiện tại: {target.stock} {target.unit}</p>
          <Field label="Loại">
            <Select value={type} onChange={(v) => setType(v as typeof type)} options={[{ value: "WRITE_OFF", label: "Hao hụt, tiêu huỷ (trừ kho)" }, { value: "ADJUST", label: "Điều chỉnh sau kiểm kê (cộng hoặc trừ)" }]} disabled={submitting} />
          </Field>
          <Field label={type === "WRITE_OFF" ? `Số lượng hao hụt (${target.unit})` : `Số lượng điều chỉnh (${target.unit}), số âm để trừ`} error={errors.quantity}>
            <NumberInput value={quantity} onChange={setQuantity} decimals={0} disabled={submitting} />
          </Field>
          <Field label="Lý do" error={errors.reason}>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} list="adjust-reasons" disabled={submitting} />
          </Field>
          <datalist id="adjust-reasons">{writeOffReasons.map((r) => <option key={r} value={r} />)}</datalist>
        </form>
      )}
    </Modal>
  );
}
