import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Field } from "../components/ui/Field";
import { confirmDialog } from "../components/ui/Modal";
import { DataTable, PageHeader, Panel, td, tdMoney, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { ErrorState, Skeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { formatDateTime, formatVnd } from "../lib/format";
import { options, orderStatus, paymentMethod, paymentStatus, type OrderStatus, type PaymentStatus } from "../lib/labels";
import type { Order } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

export function OrderDetailPage() {
  const { id } = useParams();
  const { state, slow, reload } = useLoad(() => api.get<Order>(`/orders/${id}`), [id]);
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [payment, setPayment] = useState<PaymentStatus>("UNPAID");
  const { submitting, run } = useSubmit();

  useEffect(() => {
    if (state.status !== "ready") return;
    setStatus(state.data.status);
    setPayment(state.data.paymentStatus);
  }, [state]);

  if (state.status === "error") return <ErrorState title="Chưa tải được đơn hàng" desc={state.error} onRetry={reload} />;
  if (state.status === "loading") return <Skeleton className={`h-96 ${slow ? "" : "invisible"}`} />;
  const order = state.data;
  const changed = status !== order.status || payment !== order.paymentStatus;

  async function save() {
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      const ok = await confirmDialog({ title: "Huỷ đơn hàng", desc: `Huỷ đơn ${order.code}? Số lượng trong đơn sẽ được cộng lại vào tồn kho.`, confirmLabel: "Huỷ đơn", cancelLabel: "Giữ đơn", danger: true });
      if (!ok) return;
    }
    run(async () => {
      await api.patch(`/orders/${order.id}`, { status, paymentStatus: payment });
      showToast("Đã cập nhật đơn hàng.");
      await reload();
    }, "Chưa cập nhật được đơn");
  }

  return (
    <>
      <PageHeader
        title={`Đơn ${order.code}`}
        back={{ to: "/orders", label: "Danh sách đơn hàng" }}
        desc={<span className="flex flex-wrap items-center gap-2">Đặt lúc {formatDateTime(order.createdAt)} <Tag tone={orderStatus[order.status].tone}>{orderStatus[order.status].label}</Tag></span>}
      />
      <div className="grid gap-6 xl:grid-cols-12 [&>*]:min-w-0">
        <div className="flex flex-col gap-6 xl:col-span-8">
          <DataTable head={<tr><th className={th}>Sản phẩm</th><th className={`${th} text-right`}>Đơn giá</th><th className={`${th} text-right`}>Số lượng</th><th className={`${th} text-right`}>Thành tiền</th></tr>}>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className={td}>{item.productName}</td>
                <td className={tdMoney}>{formatVnd(item.unitPriceVnd)}</td>
                <td className={tdMoney}>{item.quantity}</td>
                <td className={tdMoney}>{formatVnd(item.unitPriceVnd * item.quantity)}</td>
              </tr>
            ))}
            <tr><td className={td} colSpan={3}>Tạm tính</td><td className={tdMoney}>{formatVnd(order.subtotalVnd)}</td></tr>
            <tr><td className={td} colSpan={3}>Phí giao hàng</td><td className={tdMoney}>{order.shippingVnd === 0 ? "Miễn phí" : formatVnd(order.shippingVnd)}</td></tr>
            <tr><td className={`${td} font-semibold`} colSpan={3}>Tổng cộng</td><td className={`${tdMoney} font-serif text-xl font-semibold lining-nums`}>{formatVnd(order.totalVnd)}</td></tr>
          </DataTable>
          <Panel title="Giao hàng">
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[160px_1fr]">
              <dt className="text-ink-3">Người nhận</dt>
              <dd>{order.customerId ? <Link to={`/customers/${order.customerId}`} className="font-medium hover:text-wood">{order.customerName}</Link> : order.customerName}</dd>
              <dt className="text-ink-3">Điện thoại</dt>
              <dd><a href={`tel:${order.customerPhone}`} className="hover:text-wood">{order.customerPhone}</a></dd>
              {order.customerEmail && (<><dt className="text-ink-3">Email</dt><dd>{order.customerEmail}</dd></>)}
              <dt className="text-ink-3">Địa chỉ</dt>
              <dd>{order.address}</dd>
              {order.note && (<><dt className="text-ink-3">Ghi chú</dt><dd>{order.note}</dd></>)}
            </dl>
          </Panel>
        </div>
        <div className="xl:col-span-4">
          <Panel title="Xử lý đơn">
            <div className="flex flex-col gap-4">
              <Field label="Trạng thái đơn"><Select value={status} onChange={(v) => setStatus(v as OrderStatus)} options={options(orderStatus)} disabled={submitting} /></Field>
              <Field label={`Thanh toán: ${paymentMethod[order.paymentMethod]}`}><Select value={payment} onChange={(v) => setPayment(v as PaymentStatus)} options={options(paymentStatus)} disabled={submitting} /></Field>
              <Button onClick={save} loading={submitting} disabled={!changed} className="mt-2">Cập nhật đơn</Button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
