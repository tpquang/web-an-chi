import { api } from "./api";

export type Supplier = { id: string; name: string; phone: string | null; note: string | null; code: string; active: boolean; _count: { batches: number } };

export const loadSuppliers = () => api.get<Supplier[]>("/suppliers");

// Đường dẫn trang nhà cung cấp trên web, lấy từ biến môi trường CMS khi có
export const supplierPortalUrl = `${(import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "")}/nha-cung-cap`;

// Hiện mã theo nhóm 4 ký tự cho dễ đọc qua điện thoại
export const formatCode = (code: string) => code.match(/.{1,4}/g)?.join(" ") ?? code;
