import { Router } from "express";
import { z } from "zod";
import { env } from "../../env.js";
import { issueToken, requireCustomer } from "../../lib/auth.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { failureLimiter } from "../../lib/rate-limit.js";
import { HttpError } from "../../middleware/errors.js";
import { phoneField } from "../orders/orders.service.js";

export const accountRouter = Router();

// Khách giữ đăng nhập 30 ngày
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const session = (customerId: string) => issueToken(customerId, "customer", SESSION_SECONDS);

// Request đi qua server của web nên IP đều giống nhau; đếm theo số điện thoại để chặn dò mật khẩu từng tài khoản
const limiter = failureLimiter({ max: 8, windowMs: 15 * 60 * 1000, message: "Bạn đã nhập sai nhiều lần. Vui lòng thử lại sau 15 phút." });

const passwordField = z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.").max(100);

const registerInput = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ tên.").max(80),
  phone: phoneField,
  password: passwordField,
  // Số đã từng đặt hàng: cần một mã đơn của số đó để chứng minh là chủ số, tránh người khác xem lịch sử mua
  orderCode: z.string().trim().optional(),
});

accountRouter.post("/register", async (req, res) => {
  const input = registerInput.parse(req.body);
  const existing = await prisma.customer.findUnique({ where: { phone: input.phone }, omit: { passwordHash: false } });

  if (existing?.passwordHash) {
    throw new HttpError(409, "Số điện thoại này đã có tài khoản. Bạn đăng nhập bằng mật khẩu đã tạo.", "ACCOUNT_EXISTS");
  }
  if (existing) {
    const owns = input.orderCode
      ? await prisma.order.count({ where: { customerId: existing.id, code: input.orderCode.toUpperCase() } })
      : 0;
    if (!owns) {
      throw new HttpError(
        409,
        "Số này đã từng đặt hàng tại shop. Bạn nhập mã một đơn đã đặt để xác nhận là chủ số điện thoại.",
        "NEEDS_ORDER_CODE",
      );
    }
  }

  const passwordHash = await hashPassword(input.password);
  const customer = existing
    ? await prisma.customer.update({ where: { id: existing.id }, data: { passwordHash, name: input.name } })
    : await prisma.customer.create({ data: { name: input.name, phone: input.phone, passwordHash } });
  res.status(201).json({ data: session(customer.id) });
});

accountRouter.post("/login", async (req, res) => {
  const { phone, password } = z.object({ phone: phoneField, password: z.string() }).parse(req.body);
  limiter.check(phone);
  const customer = await prisma.customer.findUnique({ where: { phone }, omit: { passwordHash: false } });
  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    limiter.fail(phone);
    throw new HttpError(401, "Số điện thoại hoặc mật khẩu chưa đúng.", "BAD_CREDENTIALS");
  }
  limiter.reset(phone);
  res.json({ data: session(customer.id) });
});

if (env.DEV_LOGIN === "on" && env.NODE_ENV !== "production") {
  // Đăng nhập thành một khách có sẵn để test giao diện; mặc định là khách đầu tiên trong dữ liệu mẫu
  accountRouter.post("/dev-login", async (req, res) => {
    const { phone } = z.object({ phone: z.string().optional() }).parse(req.body ?? {});
    const customer = phone
      ? await prisma.customer.findUnique({ where: { phone } })
      : await prisma.customer.findFirst({ orderBy: { createdAt: "asc" } });
    if (!customer) throw new HttpError(404, "Chưa có khách hàng nào. Chạy npm run db:seed trước.");
    res.json({ data: session(customer.id) });
  });
}

accountRouter.use(requireCustomer);

accountRouter.get("/me", async (_req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: res.locals.customerId },
    select: {
      name: true,
      phone: true,
      email: true,
      address: true,
      marketingConsent: true,
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          code: true,
          createdAt: true,
          status: true,
          paymentMethod: true,
          paymentStatus: true,
          totalVnd: true,
          items: { select: { productName: true, quantity: true } },
        },
      },
    },
  });
  if (!customer) throw new HttpError(401, "Bạn cần đăng nhập lại.", "UNAUTHORIZED");
  res.json({ data: customer });
});

const profileInput = z.object({
  name: z.string().trim().min(2, "Vui lòng nhập họ tên.").max(80),
  email: z
    .union([z.literal(""), z.email("Email chưa đúng định dạng, ví dụ ten@gmail.com.")])
    .optional()
    .transform((value) => value || null),
  address: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) => value || null),
  marketingConsent: z.boolean(),
});

accountRouter.patch("/me", async (req, res) => {
  const data = profileInput.parse(req.body);
  await prisma.customer.update({ where: { id: res.locals.customerId }, data });
  res.json({ data: { ok: true } });
});
