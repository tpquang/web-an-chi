import { z } from "zod";
import { prisma } from "./prisma.js";

export const DEPOSIT_MIN = 30;
export const DEPOSIT_MAX = 50;
// Hạn chuyển khoản (cả đơn hoặc tiền cọc), giờ
export const HOLD_HOURS_DEFAULT = 24;
const HOLD_MIN = 2;
const HOLD_MAX = 72;

// Đặt cọc theo từng điều kiện. Dạng cũ { enabled, percent, scope: "ALL" | "SPECIAL" } vẫn đọc được
const depositShape = (percent: z.ZodNumber) =>
  z.preprocess(
    (value) => {
      if (!value || typeof value !== "object" || !("scope" in value)) return value;
      const old = value as { enabled: boolean; percent: number; scope: string };
      return { enabled: old.enabled, percent: old.percent, forCustom: true, forPreorder: true, forMarked: true, minOrderVnd: old.scope === "ALL" ? 0 : null };
    },
    z.object({
      enabled: z.boolean(),
      percent,
      // Đơn có vòng tự thiết kế
      forCustom: z.boolean(),
      // Đơn đặt chờ trước ngày mở bán
      forPreorder: z.boolean(),
      // Đơn có sản phẩm bật "Cần đặt cọc" ở CMS
      forMarked: z.boolean(),
      // Đơn có tạm tính từ mức này. null là không xét theo giá trị
      minOrderVnd: z.number().int().min(0).nullable(),
    }),
  );

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
  // Nhận đơn đặt chờ trước ngày mở bán. Chưa lưu lần nào thì coi như bật
  preorderEnabled: z.boolean().optional(),
  // Giờ mở bán (ISO có múi giờ). Trước giờ này web hiện đếm ngược và đơn là đơn đặt chờ. Trống là đã mở bán.
  // Đọc thì nới: ngày sai coi như đã mở bán, để lỗi cấu hình không khoá việc đặt hàng
  launchAt: z.string().nullable().optional(),
  // Trước giờ mở bán, chuyển tạm mọi trang sản phẩm, danh mục về /countdown. Hại SEO khi site đã index
  countdownRedirect: z.boolean().optional(),
  // Đặt cọc: khách chọn trả khi nhận hàng thì chuyển khoản trước một phần tiền hàng
  deposit: depositShape(z.number().int().min(DEPOSIT_MIN).max(DEPOSIT_MAX)).optional(),
  // Hạn chuyển khoản tính từ lúc đặt. Quá hạn chưa nhận tiền thì hệ thống huỷ đơn, trả kho
  paymentHoldHours: z.number().int().min(HOLD_MIN).max(HOLD_MAX).optional(),
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
  launchAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Ngày giờ mở bán chưa đúng")
    .nullable()
    .optional(),
  deposit: depositShape(
    z.number({ error: "Nhập phần trăm cọc" }).int("Phần trăm cọc là số nguyên").min(DEPOSIT_MIN, `Cọc tối thiểu ${DEPOSIT_MIN}%`).max(DEPOSIT_MAX, `Cọc tối đa ${DEPOSIT_MAX}%`),
  ).optional(),
  paymentHoldHours: z
    .number({ error: "Nhập số giờ" })
    .int("Số giờ là số nguyên")
    .min(HOLD_MIN, `Hạn thanh toán ít nhất ${HOLD_MIN} giờ`)
    .max(HOLD_MAX, `Hạn thanh toán tối đa ${HOLD_MAX} giờ`)
    .optional(),
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

export const preorderOn = (store: Store) => store.preorderEnabled !== false;

// Giờ mở bán dạng mili giây, null khi đã mở bán hoặc ngày sai
function launchTime(store: Store) {
  const time = store.launchAt ? Date.parse(store.launchAt) : Number.NaN;
  return Number.isNaN(time) ? null : time;
}

export function isPreLaunch(store: Store, now = Date.now()) {
  const time = launchTime(store);
  return time !== null && now < time;
}

// Tiền cọc của đơn trả khi nhận hàng, làm tròn lên nghìn đồng, kèm lý do để web nói rõ với khách.
// null khi đơn không cần cọc. Cần có tài khoản ngân hàng, vì khách phải chuyển khoản tiền cọc
export function depositFor(store: Store, order: { subtotalVnd: number; preorder: boolean; custom: boolean; marked: boolean }) {
  const { deposit } = store;
  if (!deposit?.enabled || !store.bank || order.subtotalVnd === 0) return null;
  const reasons = [
    deposit.forCustom && order.custom && "đơn có vòng tự thiết kế",
    deposit.forPreorder && order.preorder && "đơn đặt chờ trước ngày mở bán",
    deposit.forMarked && order.marked && "đơn có hàng đặt làm",
    deposit.minOrderVnd !== null && order.subtotalVnd >= deposit.minOrderVnd && (deposit.minOrderVnd > 0 ? "đơn có giá trị lớn" : "mọi đơn trả khi nhận hàng"),
  ].filter((reason): reason is string => Boolean(reason));
  if (reasons.length === 0) return null;
  const amountVnd = Math.min(order.subtotalVnd, Math.ceil((order.subtotalVnd * deposit.percent) / 100 / 1000) * 1000);
  return { percent: deposit.percent, amountVnd, reasons };
}

export const holdHours = (store: Store) => store.paymentHoldHours ?? HOLD_HOURS_DEFAULT;

export function shippingFee(store: Store, subtotalVnd: number) {
  const { flatFeeVnd, freeFromVnd } = store.shipping;
  if (subtotalVnd === 0) return 0;
  return freeFromVnd !== null && subtotalVnd >= freeFromVnd ? 0 : flatFeeVnd;
}
