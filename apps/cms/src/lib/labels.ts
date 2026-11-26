export type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type OrderStatus = "PREORDER" | "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED" | "RETURNED";
export type CancelActor = "CUSTOMER" | "STAFF" | "SYSTEM";
export type OrderEventType = "CREATED" | "STATUS" | "PAYMENT" | "REFUND" | "NOTE";
export type PaymentStatus = "UNPAID" | "DEPOSITED" | "PAID" | "REFUNDED";
export type PaymentMethod = "COD" | "BANK_TRANSFER";
export type ProductType = "RETAIL" | "SUPPLY" | "CUSTOM";

// Mô hình 3D dựng sẵn trên web, thêm mẫu mới thì thêm cả enum Product3DModel ở API
export type Product3DModel = "ROUND_BOX" | "INCENSE_BOX";
export const product3dModels: { value: Product3DModel; label: string }[] = [
  { value: "ROUND_BOX", label: "Hộp tròn nụ trầm" },
  { value: "INCENSE_BOX", label: "Hộp nhang trầm" },
];
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
  // Khách đặt trước ngày mở bán: gọi lại chốt địa chỉ, phí giao. Chuyển sang trạng thái khác thì kho mới bị trừ
  PREORDER: { label: "Chờ chuẩn bị", tone: "wood" },
  PENDING: { label: "Chờ xác nhận", tone: "warn" },
  CONFIRMED: { label: "Đã xác nhận", tone: "info" },
  SHIPPING: { label: "Đang giao", tone: "info" },
  COMPLETED: { label: "Đã giao", tone: "ok" },
  CANCELLED: { label: "Đã huỷ", tone: "neutral" },
  // Khách không nhận hoặc trả lại: kho đã cộng lại, không tính doanh thu
  RETURNED: { label: "Hoàn hàng", tone: "err" },
};

export const cancelActor: Record<CancelActor, string> = { CUSTOMER: "Khách huỷ", STAFF: "Shop huỷ", SYSTEM: "Hệ thống huỷ" };

// Nút chuyển trạng thái ở chi tiết đơn, theo trạng thái đích
export const transitionAction: Partial<Record<OrderStatus, { label: string; desc: string }>> = {
  PENDING: { label: "Chuyển sang chờ xác nhận", desc: "Trừ kho theo đơn." },
  CONFIRMED: { label: "Xác nhận đơn", desc: "Đã gọi khách chốt đơn. Hệ thống thôi đếm hạn thanh toán." },
  SHIPPING: { label: "Giao cho vận chuyển", desc: "Ghi đơn vị vận chuyển và mã vận đơn để khách tra cứu." },
  COMPLETED: { label: "Đã giao xong", desc: "Đơn trả khi nhận hàng được ghi đã thu đủ." },
  RETURNED: { label: "Hoàn hàng", desc: "Khách không nhận hoặc trả lại. Kho được cộng lại." },
};

// Lý do huỷ chọn nhanh, vẫn sửa được
export const cancelReasons = ["Khách đổi ý", "Không liên lạc được khách", "Khách không chuyển khoản", "Hết hàng", "Sai thông tin giao hàng", "Khách đặt trùng đơn"];

// Đơn vị vận chuyển hay dùng, ô vẫn gõ được tên khác
export const carriers = ["Giao Hàng Tiết Kiệm", "Giao Hàng Nhanh", "Viettel Post", "J&T Express", "Ninja Van", "VNPost", "Shop tự giao"];

export const paymentStatus: Record<PaymentStatus, { label: string; tone: Tone }> = {
  UNPAID: { label: "Chưa thanh toán", tone: "warn" },
  DEPOSITED: { label: "Đã nhận cọc", tone: "info" },
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
