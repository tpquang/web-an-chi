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
