const vnd = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const number = new Intl.NumberFormat("vi-VN");
const date = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTime = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const formatVnd = (value: number) => vnd.format(value);
export const formatNumber = (value: number) => number.format(value);
export const formatDate = (value: string) => date.format(new Date(value));
export const formatDateTime = (value: string) => dateTime.format(new Date(value));

// Chữ thường, không dấu, nối gạch ngang. Cùng quy tắc với API
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// So khớp không dấu cho ô tìm của Select
export function plain(value: string) {
  return slugify(value).replace(/-/g, " ");
}

// Ô ngày nhập chữ dạng ngày/tháng/năm (không dùng input date native). Đổi qua lại với YYYY-MM-DD gửi API
// Ngày lưu ở API là 12:00 giờ Việt Nam nên cắt 10 ký tự đầu của ISO vẫn đúng ngày
export const isoToDay = (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
export function dayToIso(text: string) {
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}
export const todayDay = () => isoToDay(new Date(Date.now() + 7 * 3600_000).toISOString());
