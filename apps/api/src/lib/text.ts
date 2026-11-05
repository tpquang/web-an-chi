import { z } from "zod";

// Chữ thường, không dấu, nối bằng gạch ngang. "Đ" không tách được dấu nên đổi riêng
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const slugField = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .transform(slugify)
  .refine((value) => value.length > 0, "Slug cần có chữ hoặc số");

// Chuỗi rỗng từ form coi như chưa nhập
export const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? value : null));

export const optionalUrl = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || /^https?:\/\//.test(value), "Link cần bắt đầu bằng http:// hoặc https://");

// Ảnh tải lên CMS lưu dạng /api/media/<id> (web phục vụ qua proxy cùng tên miền), hoặc link ảnh ngoài
export const MEDIA_PATH = /^\/api\/media\/[a-z0-9]{10,40}$/i;
const isImageUrl = (value: string) => MEDIA_PATH.test(value) || /^https?:\/\//.test(value);
const IMAGE_MESSAGE = "Ảnh cần tải lên hoặc là link http(s).";
export const imageUrl = z.string().trim().refine(isImageUrl, IMAGE_MESSAGE);
export const optionalImageUrl = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || isImageUrl(value), IMAGE_MESSAGE);

export const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};
