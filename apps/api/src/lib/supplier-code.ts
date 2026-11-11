import { randomInt } from "node:crypto";

// Bỏ 0, O, 1, I, L cho khỏi đọc nhầm khi gửi mã qua điện thoại
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const SUPPLIER_CODE_LENGTH = 10;

export function newSupplierCode() {
  return Array.from({ length: SUPPLIER_CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

// Khách gõ có dấu cách, gạch ngang hay chữ thường đều nhận
export const normalizeSupplierCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
