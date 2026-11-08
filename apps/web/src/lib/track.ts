type TrackWindow = Window & { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };

// Sự kiện thương mại điện tử theo chuẩn GA4.
// - Có gtag (nạp thẳng GA4): gửi qua gtag.
// - Có dataLayer (GTM): đẩy { event, ecommerce }, trong GTM tạo trigger Custom Event cùng tên.
// - Chưa nạp gì (bản test): bỏ qua.
// Chỉ gửi mã sản phẩm, số lượng, giá: không gửi tên, số điện thoại, địa chỉ khách
export function trackEvent(name: "add_to_cart" | "begin_checkout" | "purchase", params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as TrackWindow;
  const ecommerce = { currency: "VND", ...params };
  if (w.gtag) w.gtag("event", name, ecommerce);
  else if (w.dataLayer) {
    // Xoá ecommerce cũ để sự kiện sau không mang dữ liệu sự kiện trước (khuyến nghị của Google)
    w.dataLayer.push({ ecommerce: null });
    w.dataLayer.push({ event: name, ecommerce });
  }
}
