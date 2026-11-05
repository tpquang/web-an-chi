export type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type PaymentMethod = "COD" | "BANK_TRANSFER";
export type ProductType = "RETAIL" | "SUPPLY" | "CUSTOM";
export type MaterialGroup = "PACKAGING" | "BEAD" | "CONE" | "STICK" | "PRODUCT" | "CONSUMABLE";
export type SalesChannel = "WEB" | "SHOPEE" | "TIKTOK" | "REFERRAL" | "OTHER";
export type Tone = "neutral" | "wood" | "ok" | "warn" | "err" | "info";

export const publishStatus: Record<PublishStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Bản nháp", tone: "neutral" },
  PUBLISHED: { label: "Đang hiện", tone: "ok" },
  ARCHIVED: { label: "Đã ẩn", tone: "warn" },
};

export const productType: Record<ProductType, { label: string; tone: Tone }> = {
  RETAIL: { label: "Kinh doanh", tone: "ok" },
  SUPPLY: { label: "Phát sinh, không bán", tone: "neutral" },
  CUSTOM: { label: "Vòng xâu hạt", tone: "wood" },
};

export const materialGroup: Record<MaterialGroup, { label: string; tone: Tone }> = {
  PACKAGING: { label: "Bao bì", tone: "neutral" },
  BEAD: { label: "Vòng hạt", tone: "wood" },
  CONE: { label: "Nụ", tone: "info" },
  STICK: { label: "Nhang", tone: "info" },
  PRODUCT: { label: "Sản phẩm", tone: "ok" },
  CONSUMABLE: { label: "Vật tư tiêu hao", tone: "warn" },
};

export const salesChannel: Record<SalesChannel, { label: string; tone: Tone }> = {
  WEB: { label: "Web", tone: "info" },
  SHOPEE: { label: "Shopee", tone: "warn" },
  TIKTOK: { label: "TikTok", tone: "neutral" },
  REFERRAL: { label: "Giới thiệu", tone: "ok" },
  OTHER: { label: "Khác", tone: "neutral" },
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
