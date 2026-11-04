export type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type PaymentMethod = "COD" | "BANK_TRANSFER";
export type Tone = "neutral" | "wood" | "ok" | "warn" | "err" | "info";

export const publishStatus: Record<PublishStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Bản nháp", tone: "neutral" },
  PUBLISHED: { label: "Đang hiện", tone: "ok" },
  ARCHIVED: { label: "Đã ẩn", tone: "warn" },
};

export const orderStatus: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Chờ xác nhận", tone: "warn" },
  CONFIRMED: { label: "Đã xác nhận", tone: "info" },
  SHIPPING: { label: "Đang giao", tone: "info" },
  COMPLETED: { label: "Hoàn tất", tone: "ok" },
  CANCELLED: { label: "Đã huỷ", tone: "neutral" },
};

export const paymentStatus: Record<PaymentStatus, { label: string; tone: Tone }> = {
  UNPAID: { label: "Chưa thanh toán", tone: "warn" },
  PAID: { label: "Đã thanh toán", tone: "ok" },
  REFUNDED: { label: "Đã hoàn tiền", tone: "neutral" },
};

export const paymentMethod: Record<PaymentMethod, string> = {
  COD: "Khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản",
};

export function options<K extends string>(map: Record<K, { label: string } | string>) {
  return (Object.keys(map) as K[]).map((value) => {
    const entry = map[value];
    return { value, label: typeof entry === "string" ? entry : entry.label };
  });
}

export const batchStatus: Record<"PLANNED" | "ORDERED" | "RECEIVED", { label: string; tone: Tone }> = {
  PLANNED: { label: "Đang tính", tone: "neutral" },
  ORDERED: { label: "Đã đặt hàng", tone: "info" },
  RECEIVED: { label: "Đã nhận hàng", tone: "ok" },
};
