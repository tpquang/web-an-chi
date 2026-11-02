// Nhãn hiển thị cho khách, dùng chung giữa trang đơn hàng và tra cứu
export const orderStatusLabel = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  COMPLETED: "Đã giao",
  CANCELLED: "Đã huỷ",
} as const;

export const paymentMethodLabel = {
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
} as const;

export const paymentStatusLabel = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUNDED: "Đã hoàn tiền",
} as const;

export const paymentOptions = [
  {
    value: "COD",
    label: paymentMethodLabel.COD,
    desc: "Trả tiền mặt cho người giao hàng. Bạn được xem hàng trước khi trả.",
  },
  {
    value: "BANK_TRANSFER",
    label: paymentMethodLabel.BANK_TRANSFER,
    desc: "Shop gửi số tài khoản ở bước sau. Đơn được giao khi shop nhận tiền.",
  },
] as const;

export type PaymentMethod = (typeof paymentOptions)[number]["value"];
