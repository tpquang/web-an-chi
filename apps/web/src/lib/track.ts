type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

// Sự kiện thương mại điện tử cho GA4. Chưa nạp GA (bản test, chưa có mã) thì bỏ qua.
// Chỉ gửi mã sản phẩm, số lượng, giá: không gửi tên, số điện thoại, địa chỉ khách
export function trackEvent(name: "add_to_cart" | "begin_checkout" | "purchase", params: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  (window as GtagWindow).gtag?.("event", name, { currency: "VND", ...params });
}
