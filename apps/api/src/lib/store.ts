import { z } from "zod";
import { prisma } from "./prisma.js";

const storeSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  openingHours: z.string().optional(),
  shopeeUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  zaloUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  shipping: z.object({
    flatFeeVnd: z.number().int().min(0),
    freeFromVnd: z.number().int().min(0).nullable(),
    eta: z.string(),
  }),
  returnPolicy: z.string(),
  bank: z
    .object({ bankName: z.string(), accountNumber: z.string(), accountName: z.string() })
    .optional(),
});

export type Store = z.infer<typeof storeSchema>;

// Link trống hoặc https. Đọc thì nới (dữ liệu cũ không làm hỏng phí giao), ghi từ CMS thì kiểm chặt
const link = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Link phải bắt đầu bằng https://")
  .optional();

export const storeInput = storeSchema.extend({
  name: z.string().trim().min(1, "Nhập tên cửa hàng"),
  phone: z.string().trim(),
  email: z.string().trim().refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Email chưa đúng"),
  address: z.string().trim(),
  shopeeUrl: link,
  tiktokUrl: link,
  facebookUrl: link,
  zaloUrl: link,
  youtubeUrl: link,
});

// Dùng khi chưa có cấu hình trong database, để đặt hàng vẫn tính được phí giao
const fallback: Store = {
  name: "An Chi Trầm Hương",
  phone: "",
  email: "",
  address: "",
  shipping: { flatFeeVnd: 30_000, freeFromVnd: 1_000_000, eta: "2–4 ngày làm việc" },
  returnPolicy: "",
};

export async function getStore(): Promise<Store> {
  const row = await prisma.setting.findUnique({ where: { key: "store" } });
  const parsed = storeSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : fallback;
}

export function shippingFee(store: Store, subtotalVnd: number) {
  const { flatFeeVnd, freeFromVnd } = store.shipping;
  if (subtotalVnd === 0) return 0;
  return freeFromVnd !== null && subtotalVnd >= freeFromVnd ? 0 : flatFeeVnd;
}
