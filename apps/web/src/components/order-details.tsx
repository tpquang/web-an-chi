import type { OrderSummary } from "@/lib/api";
import { orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from "@/lib/order";
import { formatDate, formatVnd } from "@/lib/site";
import { Tag, type Tone } from "./ui/tag";

const statusTone: Record<OrderSummary["status"], Tone> = {
  PENDING: "warn",
  CONFIRMED: "info",
  SHIPPING: "info",
  COMPLETED: "ok",
  CANCELLED: "neutral",
};

export function BankTransferBox({ payment, totalVnd }: { payment: NonNullable<OrderSummary["payment"]>; totalVnd: number }) {
  const rows = [
    ["Ngân hàng", payment.bankName],
    ["Số tài khoản", payment.accountNumber],
    ["Chủ tài khoản", payment.accountName],
    ["Số tiền", formatVnd(totalVnd)],
    ["Nội dung chuyển khoản", payment.transferNote],
  ];
  return (
    <section aria-labelledby="chuyen-khoan" className="rounded-2xl border border-wood bg-surface p-5 md:p-6">
      <h2 id="chuyen-khoan" className="font-serif text-2xl leading-tight">
        Thông tin chuyển khoản
      </h2>
      <p className="mt-2 text-sm text-ink-2">Bạn ghi đúng nội dung để shop đối chiếu nhanh. Đơn được giao sau khi shop nhận tiền.</p>
      <dl className="mt-4 flex flex-col gap-2 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[minmax(120px,40%)_1fr] gap-4">
            <dt className="text-ink-3">{label}</dt>
            <dd className="font-medium break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function OrderDetails({ order }: { order: OrderSummary & { customerName?: string; address?: string } }) {
  return (
    <section aria-labelledby="chi-tiet-don" className="rounded-3xl border border-edge bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="chi-tiet-don" className="font-serif text-2xl leading-tight">
          Đơn {order.code}
        </h2>
        <Tag tone={statusTone[order.status]}>{orderStatusLabel[order.status]}</Tag>
      </div>
      <p className="mt-1 text-sm text-ink-3">Đặt ngày {formatDate(order.createdAt)}</p>

      <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
        {order.items.map((item, index) => (
          <li key={index} className="flex justify-between gap-4">
            <span className="min-w-0">
              {item.productName} × {item.quantity}
            </span>
            <span className="whitespace-nowrap tabular-nums">{formatVnd(item.unitPriceVnd * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Tạm tính</dt>
          <dd className="tabular-nums">{formatVnd(order.subtotalVnd)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Phí giao hàng</dt>
          <dd className="tabular-nums">{order.shippingVnd === 0 ? "Miễn phí" : formatVnd(order.shippingVnd)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="font-medium">Tổng cộng</dt>
          <dd className="font-serif text-2xl whitespace-nowrap">{formatVnd(order.totalVnd)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-2">Thanh toán</dt>
          <dd className="text-right">
            {paymentMethodLabel[order.paymentMethod]}, {paymentStatusLabel[order.paymentStatus].toLowerCase()}
          </dd>
        </div>
        {order.customerName && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Người nhận</dt>
            <dd className="text-right">{order.customerName}</dd>
          </div>
        )}
        {order.address && (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-2">Địa chỉ</dt>
            <dd className="text-right">{order.address}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
