import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { OrderActions } from "../components/order/OrderActions";
import { OrderPayment } from "../components/order/OrderPayment";
import { OrderTimeline } from "../components/order/OrderTimeline";
import { PreorderConvert } from "../components/PreorderConvert";
import { Button } from "../components/ui/Button";
import { Field, Input, MoneyInput } from "../components/ui/Field";
import { DataTable, PageHeader, Panel, td, tdMoney, th } from "../components/ui/Page";
import { ErrorState, Skeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDateTime, formatVnd } from "../lib/format";
import { orderStatus, salesChannel } from "../lib/labels";
import type { BraceletDesignSnapshot, Order } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { refreshOrderCounts } from "../lib/order-counts";
import { useSubmit } from "../lib/use-submit";

// Chi tiết đơn: trái là hàng, giao hàng, lịch sử; phải là xử lý đơn, thanh toán, đối soát.
// Trạng thái chỉ đổi qua nút hành động, không có ô chọn tự do (luật ở API order-flow.ts)
export function OrderDetailPage() {
  const { id } = useParams();
  const { state, slow, reload } = useLoad(() => api.get<Order>(`/orders/${id}`), [id]);
  const { can } = useAuth();
  const editable = can("orders", "edit");

  if (state.status === "error") return <ErrorState title="Chưa tải được đơn hàng" desc={state.error} onRetry={reload} />;
  if (state.status === "loading") return <Skeleton className={`h-96 ${slow ? "" : "invisible"}`} />;
  const order = state.data;
  // Thao tác xong: tải lại đơn và số đơn trên menu, tab
  const done = async () => {
    refreshOrderCounts();
    await reload();
  };
  const returned = order.customerHistory.RETURNED ?? 0;
  const cancelled = order.customerHistory.CANCELLED ?? 0;
  const delivered = order.customerHistory.COMPLETED ?? 0;

  return (
    <>
      <PageHeader
        title={`Đơn ${order.code}`}
        back={{ to: "/orders", label: "Danh sách đơn hàng" }}
        desc={
          <span className="flex flex-wrap items-center gap-2">
            Đặt lúc {formatDateTime(order.createdAt)} <Tag tone={salesChannel[order.channel].tone}>{salesChannel[order.channel].label}</Tag>{" "}
            <Tag tone={orderStatus[order.status].tone}>{orderStatus[order.status].label}</Tag>
          </span>
        }
      />
      <div className="grid gap-6 xl:grid-cols-12 [&>*]:min-w-0">
        <div className="flex flex-col gap-6 xl:col-span-8">
          <DataTable head={<tr><th className={th}>Sản phẩm</th><th className={`${th} text-right`}>Đơn giá</th><th className={`${th} text-right`}>Số lượng</th><th className={`${th} text-right`}>Thành tiền</th></tr>}>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className={td}>
                  {item.productName}
                  {(item.design || item.product?.requiresDeposit) && <span className="ml-2"><Tag tone="wood">Làm riêng</Tag></span>}
                  {item.design && <DesignDetails design={item.design} />}
                </td>
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
            {(returned > 0 || cancelled > 1) && (
              <p role="alert" className="mb-4 rounded-lg bg-warn-soft px-3 py-2 text-sm">
                Khách này từng {[returned > 0 && `không nhận ${returned} đơn`, cancelled > 0 && `huỷ ${cancelled} đơn`].filter(Boolean).join(", ")}. Nên gọi xác nhận kỹ hoặc yêu cầu chuyển khoản trước.
              </p>
            )}
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[160px_1fr]">
              <dt className="text-ink-3">Người nhận</dt>
              <dd>
                {order.customerId ? <Link to={`/customers/${order.customerId}`} className="font-medium hover:text-wood">{order.customerName}</Link> : order.customerName}
                {delivered > 0 && <span className="ml-2 text-ink-3">đã nhận {delivered} đơn trước</span>}
              </dd>
              <dt className="text-ink-3">Điện thoại</dt>
              <dd><a href={`tel:${order.customerPhone}`} className="hover:text-wood">{order.customerPhone}</a></dd>
              {order.customerEmail && (<><dt className="text-ink-3">Email</dt><dd>{order.customerEmail}</dd></>)}
              <dt className="text-ink-3">Địa chỉ</dt>
              <dd>{order.address || <span className="text-ink-3">Chưa có. Đơn đặt chờ cũ chỉ có tên và số điện thoại, gọi khách để hỏi địa chỉ.</span>}</dd>
              {order.note && (<><dt className="text-ink-3">Khách ghi chú</dt><dd>{order.note}</dd></>)}
              {(order.carrier || order.trackingCode) && (<><dt className="text-ink-3">Vận chuyển</dt><dd>{[order.carrier, order.trackingCode].filter(Boolean).join(" · ")}</dd></>)}
            </dl>
          </Panel>
          <OrderTimeline orderId={order.id} events={order.events} onDone={done} editable={editable} />
        </div>
        <div className="flex flex-col gap-6 xl:col-span-4">
          {order.status === "PREORDER" && !order.address && <PreorderConvert order={order} onDone={done} disabled={!editable} />}
          <OrderActions order={order} onDone={done} editable={editable} />
          <OrderPayment order={order} onDone={done} editable={editable} />
          <Reconcile order={order} onDone={done} editable={editable} />
        </div>
      </div>
    </>
  );
}

// Đối soát nhập tay: phí sàn, ship thực trả, mã vận đơn, tiền cọc (khi chưa xác nhận). Lãi tính ngay khi gõ
function Reconcile({ order, onDone, editable }: { order: Order; onDone: () => Promise<void> | void; editable: boolean }) {
  const initial = () => ({
    platformFeeVnd: order.platformFeeVnd as number | null,
    shippingCostVnd: order.shippingCostVnd as number | null,
    depositVnd: order.depositVnd as number | null,
    externalCode: order.externalCode ?? "",
    trackingCode: order.trackingCode ?? "",
  });
  const [fees, setFees] = useState(initial);
  const { submitting, errors, run } = useSubmit();
  useEffect(() => setFees(initial()), [order]); // eslint-disable-line react-hooks/exhaustive-deps

  const depositEditable = order.paymentMethod === "COD" && (order.status === "PENDING" || order.status === "PREORDER");
  const changed =
    (fees.platformFeeVnd ?? 0) !== order.platformFeeVnd ||
    (fees.shippingCostVnd ?? 0) !== order.shippingCostVnd ||
    (fees.depositVnd ?? 0) !== order.depositVnd ||
    fees.externalCode !== (order.externalCode ?? "") ||
    fees.trackingCode !== (order.trackingCode ?? "");
  const costVnd = order.items.reduce((sum, i) => sum + i.unitCostVnd * i.quantity, 0);
  const profitVnd = order.subtotalVnd - costVnd - (fees.platformFeeVnd ?? 0) + order.shippingVnd - (fees.shippingCostVnd ?? 0);

  function save() {
    run(async () => {
      await api.patch(`/orders/${order.id}`, {
        platformFeeVnd: fees.platformFeeVnd ?? 0,
        shippingCostVnd: fees.shippingCostVnd ?? 0,
        ...(depositEditable ? { depositVnd: fees.depositVnd ?? 0 } : {}),
        externalCode: fees.externalCode,
        trackingCode: fees.trackingCode,
      });
      showToast("Đã lưu đối soát.");
      await onDone();
    }, "Chưa lưu được");
  }

  const disabled = submitting || !editable;
  return (
    <Panel title="Đối soát">
      <div className="flex flex-col gap-4">
        {depositEditable && (
          <div data-field="depositVnd">
            <Field label="Tiền cọc" optional hint="Sửa khi thoả thuận lại với khách. Để 0 là không cọc." error={errors.depositVnd}>
              <MoneyInput value={fees.depositVnd} onChange={(v) => setFees({ ...fees, depositVnd: v })} disabled={disabled} />
            </Field>
          </div>
        )}
        <Field label="Phí sàn, phí thanh toán" optional><MoneyInput value={fees.platformFeeVnd} onChange={(v) => setFees({ ...fees, platformFeeVnd: v })} disabled={disabled} /></Field>
        <Field label="Tiền ship thực trả" optional hint={`Thu của khách ${formatVnd(order.shippingVnd)}.`}><MoneyInput value={fees.shippingCostVnd} onChange={(v) => setFees({ ...fees, shippingCostVnd: v })} disabled={disabled} /></Field>
        <Field label="Mã vận đơn" optional><Input value={fees.trackingCode} onChange={(e) => setFees({ ...fees, trackingCode: e.target.value })} maxLength={80} disabled={disabled} /></Field>
        <Field label="Mã đơn bên sàn" optional><Input value={fees.externalCode} onChange={(e) => setFees({ ...fees, externalCode: e.target.value })} disabled={disabled} /></Field>
        <dl className="grid grid-cols-2 gap-y-1 rounded-lg bg-paper-2 p-3 text-sm">
          <dt className="text-ink-2">Giá vốn</dt><dd className="text-right tabular-nums">{formatVnd(costVnd)}</dd>
          <dt className="text-ink-2">Lãi của đơn</dt><dd className={`text-right font-semibold tabular-nums ${profitVnd < 0 ? "text-err" : ""}`}>{formatVnd(profitVnd)}</dd>
        </dl>
        {editable && <Button variant="outline" onClick={save} loading={submitting} disabled={!changed}>Lưu đối soát</Button>}
      </div>
    </Panel>
  );
}

// Chi tiết vòng tự thiết kế dưới tên sản phẩm: cỡ, dây, quà tặng, lời nhắn thiệp, yêu cầu của khách
function DesignDetails({ design }: { design: BraceletDesignSnapshot }) {
  const parts = [
    design.wristCm && `Cổ tay ${design.wristCm.toLocaleString("vi-VN")} cm`,
    design.lengthMm && `dài ${(design.lengthMm / 10).toLocaleString("vi-VN")} cm`,
    design.wraps && `quấn ${design.wraps} vòng`,
    design.accent && "có hạt chủ và tua",
    design.fitName,
    design.cordName,
  ].filter(Boolean);
  const gift = [design.gift?.box && "Hộp quà", design.gift?.wrap && "Bọc quà", design.gift && design.gift.card !== undefined && "Kèm thiệp"].filter(Boolean);
  return (
    <div className="mt-1 flex flex-col gap-0.5 text-sm text-ink-3">
      {parts.length > 0 && <p>{parts.join(" · ")}</p>}
      {gift.length > 0 && <p className="font-medium text-ink">{gift.join(" · ")}</p>}
      {design.gift?.card && <p>Lời nhắn trên thiệp: “{design.gift.card}”</p>}
      {design.note && <p>Yêu cầu: {design.note}</p>}
    </div>
  );
}
