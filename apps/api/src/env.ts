import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean)),
  // Một tài khoản quản trị cho CMS tới khi có bảng người dùng
  ADMIN_EMAIL: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  // Đăng nhập CMS không cần mật khẩu để test giao diện. Luôn tắt ở production
  DEV_LOGIN: z.enum(["on", "off"]).default("off"),
  // Đăng nhập Google cho khách (OAuth client loại Web application). Thiếu một trong hai thì tính năng tự tắt
  GOOGLE_CLIENT_ID: z.string().trim().optional().transform((v) => v || undefined),
  GOOGLE_CLIENT_SECRET: z.string().trim().optional().transform((v) => v || undefined),
});

export const env = schema.parse(process.env);
