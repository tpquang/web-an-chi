import { useState } from "react";
import { api } from "../lib/api";
import { formatVnd } from "../lib/format";
import { paymentMethod, type PaymentMethod } from "../lib/labels";
import type { Order } from "../lib/types";
import { useSubmit } from "../lib/use-submit";
import { Button } from "./ui/Button";
import { Field, MoneyInput, Textarea } from "./ui/Field";
import { Panel } from "./ui/Page";
import { Select } from "./ui/Select";
import { showToast } from "./ui/Toast";

// Đơn đặt chờ: sau khi gọi khách, nhập địa chỉ, phí giao, cách thanh toán rồi chuyển thành đơn chính.
// API chuyển sang "Chờ xác nhận" và trừ kho cùng lúc; thiếu hàng thì báo lỗi và đơn giữ nguyên
export function PreorderConvert({ order, onDone, disabled }: { order: Order; onDone(): Promise<void>; disabled?: boolean }) {
  const [address, setAddress] = useState(order.address);
  const [shippingVnd, setShippingVnd] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(order.paymentMethod);
  const { submitting, errors, setErrors, run } = useSubmit();

  function submit() {
    if (address.trim().length < 10) return setErrors({ address: "Nhập địa chỉ đủ số nhà, đường, phường, tỉnh." });
    run(async () => {
      await api.post(`/orders/${order.id}/convert`, { address, paymentMethod: method, ...(shippingVnd !== null ? { shippingVnd } : {}) });
      showToast("Đã chuyển thành đơn chính và trừ kho.");
      await onDone();
    }, "Chưa chuyển được đơn");
  }

  return (
    <Panel title="Chuyển thành đơn chính">
      <p className="-mt-2 mb-4 text-sm text-ink-2">
        Đơn đặt chờ chỉ có tên và số điện thoại, chưa trừ kho. Gọi khách chốt địa chỉ, phí giao rồi chuyển thành đơn chính: đơn sang “Chờ xác nhận” và kho bị trừ.
      </p>
      <div className="flex flex-col gap-4">
        <div data-field="address">
          <Field label="Địa chỉ giao" error={errors.address}>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} rows={3} placeholder="VD: 12 Lê Lợi, phường Hương Khê, Hà Tĩnh" disabled={submitting || disabled} />
          </Field>
        </div>
        <div data-field="shippingVnd">
          <Field label="Phí giao thu của khách" optional hint="Để trống thì tính theo phí giao trong cài đặt cửa hàng." error={errors.shippingVnd}>
            <MoneyInput value={shippingVnd} onChange={setShippingVnd} disabled={submitting || disabled} />
          </Field>
        </div>
        <Field label="Thanh toán">
          <Select
            value={method}
            onChange={(v) => setMethod(v as PaymentMethod)}
            options={(Object.keys(paymentMethod) as PaymentMethod[]).map((value) => ({ value, label: paymentMethod[value] }))}
            disabled={submitting || disabled}
          />
        </Field>
        <p className="text-sm text-ink-2">
          Tiền hàng {formatVnd(order.subtotalVnd)}
          {shippingVnd !== null && `, tổng ${formatVnd(order.subtotalVnd + shippingVnd)}`}.
        </p>
        {!disabled && (
          <Button onClick={submit} loading={submitting}>
            Chuyển thành đơn chính
          </Button>
        )}
      </div>
    </Panel>
  );
}
