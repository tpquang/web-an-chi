export const site = {
  name: "An Chi Trầm Hương",
  shortName: "An Chi",
  description: "Trầm hương tự nhiên Hương Khê, Hà Tĩnh: nhang trầm, nụ trầm và vòng tay.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  // Mặc định noindex. Chỉ bản chính thức đặt SITE_INDEXING=on
  indexable: process.env.SITE_INDEXING === "on",
};

const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

export function formatVnd(value: number) {
  return vnd.format(value);
}

const dateFormat = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" });

export function formatDate(value: string | Date) {
  return dateFormat.format(new Date(value));
}
