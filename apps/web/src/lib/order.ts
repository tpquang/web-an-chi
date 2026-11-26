import { formatVnd } from "./site";

export type OrderStatus = "PREORDER" | "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED" | "RETURNED";

// Nhãn hiển thị cho khách, dùng chung giữa trang đơn hàng, tra cứu và tài khoản
export const orderStatusLabel: Record<OrderStatus, string> = {
  PREORDER: "Chờ chuẩn bị",
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đang chuẩn bị hàng",
  SHIPPING: "Đang giao",
  COMPLETED: "Đã giao",
  CANCELLED: "Đã huỷ",
  RETURNED: "Đã hoàn hàng",
};

// Trạng thái theo lời khách: đơn còn tiền phải chuyển thì là "Chờ chuyển khoản"
export function customerStatus(order: { status: OrderStatus; amountDue: number }) {
  if ((order.status === "PENDING" || order.status === "PREORDER") && order.amountDue > 0) return "Chờ chuyển khoản";
  return orderStatusLabel[order.status];
}

export const paymentMethodLabel = {
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
} as const;

export const paymentStatusLabel = {
  UNPAID: "Chưa thanh toán",
  DEPOSITED: "Đã nhận cọc",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
} as const;

export type PaymentMethod = keyof typeof paymentMethodLabel;

type Payment = {
  bankTransfer: boolean;
  deposit: { percent: number; amountVnd: number; reasons: string[] } | null;
  holdHours: number;
};

// Cách thanh toán theo cài đặt cửa hàng: chưa có tài khoản ngân hàng thì chỉ trả khi nhận hàng.
// Đơn cần cọc (CMS > Thông tin cửa hàng) thì trả khi nhận hàng phải chuyển khoản cọc trước, nói rõ lý do và hạn
export function paymentOptions(payment: Payment, totalVnd: number) {
  const { deposit, holdHours } = payment;
  return [
    deposit
      ? {
          value: "COD" as const,
          label: `Đặt cọc ${deposit.percent}%, còn lại trả khi nhận hàng`,
          desc: `Cọc ${formatVnd(deposit.amountVnd)} vì ${deposit.reasons.join(", ")}. Chuyển trong ${holdHours} giờ, shop gửi số tài khoản ở bước sau. Còn ${formatVnd(totalVnd - deposit.amountVnd)} trả khi nhận hàng.`,
        }
      : { value: "COD" as const, label: paymentMethodLabel.COD, desc: "Trả tiền mặt cho người giao hàng. Bạn được xem hàng trước khi trả." },
    ...(payment.bankTransfer
      ? [{ value: "BANK_TRANSFER" as const, label: paymentMethodLabel.BANK_TRANSFER, desc: `Chuyển cả đơn trong ${holdHours} giờ, shop gửi số tài khoản ở bước sau.` }]
      : []),
  ];
}

// Các bước khách thấy trên trang đơn
export const orderSteps = [
  { status: "PENDING", label: "Đặt hàng" },
  { status: "CONFIRMED", label: "Shop xác nhận" },
  { status: "SHIPPING", label: "Đang giao" },
  { status: "COMPLETED", label: "Đã giao" },
] as const;

export function stepIndex(status: OrderStatus) {
  if (status === "PREORDER" || status === "PENDING") return 0;
  if (status === "CONFIRMED") return 1;
  if (status === "SHIPPING") return 2;
  if (status === "COMPLETED") return 3;
  return -1;
}

// Câu chính sách huỷ theo trạng thái hiện tại, xem docs/web/plans/order-flow-2026-11.md mục 2
export function cancelPolicyText(order: { status: OrderStatus; canCancel: boolean; madeToOrder: boolean; paidVnd: number }) {
  if (order.canCancel) return order.paidVnd > 0 ? "Bạn huỷ được tới khi shop xác nhận, shop hoàn lại đủ tiền đã chuyển." : "Bạn huỷ được tới khi shop xác nhận đơn.";
  if (order.status === "CONFIRMED") {
    return order.madeToOrder
      ? "Shop đã xác nhận và bắt đầu làm hàng riêng cho bạn. Muốn huỷ, bạn nhắn hoặc gọi shop; tiền cọc không được hoàn."
      : "Shop đã xác nhận đơn. Muốn huỷ, bạn nhắn hoặc gọi shop trước khi hàng được giao đi.";
  }
  if (order.status === "SHIPPING") return "Đơn đang được giao nên không huỷ được nữa.";
  return null;
}
