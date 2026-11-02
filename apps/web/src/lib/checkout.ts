import type { PaymentMethod } from "./order";

export type CheckoutValues = {
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
  paymentMethod: PaymentMethod;
};

export type CheckoutField = Exclude<keyof CheckoutValues, "paymentMethod">;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export const emptyCheckout: CheckoutValues = { name: "", phone: "", email: "", address: "", note: "", paymentMethod: "COD" };

// Thứ tự để focus ô sai đầu tiên
export const fieldOrder: CheckoutField[] = ["name", "phone", "email", "address", "note"];

export function normalizePhone(value: string) {
  return value.replace(/[\s.-]/g, "").replace(/^\+84/, "0");
}

// Cùng quy tắc với API để báo lỗi ngay, API vẫn kiểm lại
export function validateCheckout(values: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (values.name.trim().length < 2) errors.name = "Vui lòng nhập họ tên người nhận.";
  if (!/^0\d{9}$/.test(normalizePhone(values.phone))) errors.phone = "Số điện thoại cần đủ 10 chữ số, bắt đầu bằng 0.";
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Email chưa đúng định dạng, ví dụ ten@gmail.com.";
  }
  if (values.address.trim().length < 10) errors.address = "Vui lòng nhập địa chỉ đủ số nhà, đường, phường, tỉnh.";
  return errors;
}

// Dữ liệu đang nhập giữ trong tab hiện tại, đóng tab thì mất, không lưu lâu dài
const DRAFT_KEY = "anchi-checkout-draft";

export function loadDraft(): CheckoutValues {
  try {
    return { ...emptyCheckout, ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}") };
  } catch {
    return emptyCheckout;
  }
}

export function saveDraft(values: CheckoutValues) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {}
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {}
}
