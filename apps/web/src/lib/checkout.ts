import type { PaymentMethod } from "./order";

export type CheckoutValues = {
  name: string;
  phone: string;
  email: string;
  // Địa chỉ chia ba ô: tỉnh, phường xã (theo địa giới từ 07/2025), số nhà tên đường. Ghép lại thành một chuỗi khi gửi
  provinceCode: number | null;
  wardCode: number | null;
  street: string;
  note: string;
  paymentMethod: PaymentMethod;
};

export type CheckoutField = "name" | "phone" | "email" | "province" | "ward" | "street" | "note";
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export const emptyCheckout: CheckoutValues = {
  name: "",
  phone: "",
  email: "",
  provinceCode: null,
  wardCode: null,
  street: "",
  note: "",
  paymentMethod: "COD",
};

// Thứ tự để focus ô sai đầu tiên, theo thứ tự hiện trên form
export const fieldOrder: CheckoutField[] = ["name", "phone", "province", "ward", "street", "email", "note"];

export function normalizePhone(value: string) {
  return value.replace(/[\s.-]/g, "").replace(/^\+84/, "0");
}

// Cùng quy tắc với API để báo lỗi ngay, API vẫn kiểm lại
export function validateCheckout(values: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  if (values.name.trim().length < 2) errors.name = "Vui lòng nhập họ tên người nhận.";
  if (!/^0\d{9}$/.test(normalizePhone(values.phone))) errors.phone = "Số điện thoại cần đủ 10 chữ số, bắt đầu bằng 0.";
  if (!values.provinceCode) errors.province = "Chọn tỉnh hoặc thành phố.";
  if (!values.wardCode) errors.ward = "Chọn phường hoặc xã.";
  if (values.street.trim().length < 3) errors.street = "Nhập số nhà, tên đường hoặc thôn, xóm.";
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Email chưa đúng định dạng, ví dụ ten@gmail.com.";
  }
  return errors;
}

// Dữ liệu đang nhập giữ trong tab hiện tại, đóng tab thì mất, không lưu lâu dài
const DRAFT_KEY = "anchi-checkout-draft";

export function loadDraft(): CheckoutValues {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}");
    // Bản nháp cũ có một ô address: bỏ, khách chọn lại theo ba ô mới
    const { address: _old, ...rest } = saved;
    return { ...emptyCheckout, ...rest };
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
