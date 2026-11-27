import { Router } from "express";
import { z } from "zod";
import { env } from "../../env.js";
import { customerIdFrom, issueToken, requireCustomer } from "../../lib/auth.js";
import { clientIp } from "../../lib/client-ip.js";
import { exchangeGoogleCode, googleEnabled } from "../../lib/google.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { failureLimiter } from "../../lib/rate-limit.js";
import { HttpError } from "../../middleware/errors.js";
import { phoneField } from "../orders/orders.service.js";

export const accountRouter = Router();

// Khách giữ đăng nhập 30 ngày
const SESSION_SECONDS = 60 * 60 * 24 * 30;
const session = (customer: { id: string; sessionVersion: number }) => issueToken(customer.id, "customer", SESSION_SECONDS, customer.sessionVersion);

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
  res.status(201).json({ data: session(customer) });
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
  res.json({ data: session(customer) });
});

if (env.DEV_LOGIN === "on" && env.NODE_ENV !== "production") {
  // Đăng nhập thành một khách có sẵn để test giao diện; mặc định là khách đầu tiên trong dữ liệu mẫu
  accountRouter.post("/dev-login", async (req, res) => {
    const { phone } = z.object({ phone: z.string().optional() }).parse(req.body ?? {});
    const customer = phone
      ? await prisma.customer.findUnique({ where: { phone } })
      : await prisma.customer.findFirst({ orderBy: { createdAt: "asc" } });
    if (!customer) throw new HttpError(404, "Chưa có khách hàng nào. Chạy npm run db:seed trước.");
    res.json({ data: session(customer) });
  });
}

// ---- Đăng nhập Google. Web hỏi client id để dựng link sang Google; 404 thì web ẩn nút
accountRouter.get("/google", (_req, res) => {
  if (!googleEnabled) throw new HttpError(404, "Chưa bật đăng nhập Google.");
  res.json({ data: { clientId: env.GOOGLE_CLIENT_ID } });
});

const googleLimiter = failureLimiter({ max: 20, windowMs: 15 * 60 * 1000, message: "Bạn thử đăng nhập Google nhiều lần quá. Đợi 15 phút rồi thử lại." });

const googleInput = z.object({
  code: z.string().min(1).max(2000),
  codeVerifier: z.string().min(43).max(128),
  redirectUri: z.url(),
});

// Đã có khách gắn sub này: đăng nhập vào khách đó. Đang đăng nhập bằng số điện thoại: gắn Google vào chính tài khoản đó.
// Còn lại tạo khách mới chưa có số điện thoại. Không gộp với khách khác chỉ vì trùng email
accountRouter.post("/google", async (req, res) => {
  const input = googleInput.parse(req.body);
  const ip = clientIp(req);
  googleLimiter.check(ip);
  let profile;
  try {
    profile = await exchangeGoogleCode(input.code, input.codeVerifier, input.redirectUri);
  } catch (error) {
    googleLimiter.fail(ip);
    throw error;
  }

  const linked = await prisma.customer.findUnique({ where: { googleSub: profile.sub }, select: { id: true, sessionVersion: true } });
  const currentId = await customerIdFrom(req);
  if (linked) {
    if (currentId && currentId !== linked.id) {
      throw new HttpError(409, "Tài khoản Google này đã gắn với một tài khoản khác ở shop. Bạn đăng xuất rồi đăng nhập bằng Google.", "GOOGLE_LINKED_ELSEWHERE");
    }
    return res.json({ data: session(linked) });
  }

  if (currentId) {
    const current = await prisma.customer.findUniqueOrThrow({ where: { id: currentId }, select: { email: true } });
    const updated = await prisma.customer.update({
      where: { id: currentId },
      data: { googleSub: profile.sub, ...(current.email || !profile.email ? {} : { email: profile.email }) },
      select: { id: true, sessionVersion: true },
    });
    return res.json({ data: session(updated) });
  }

  const created = await prisma.customer.create({
    data: { name: profile.name ?? "Khách Google", email: profile.email, googleSub: profile.sub },
    select: { id: true, sessionVersion: true },
  });
  res.status(201).json({ data: session(created) });
});

accountRouter.use(requireCustomer);

accountRouter.get("/me", async (_req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: res.locals.customerId },
    select: {
      name: true,
      phone: true,
      passwordHash: true,
      googleSub: true,
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
  const { passwordHash, googleSub, ...rest } = customer;
  // Tài khoản chưa có mật khẩu (tạo qua Google) thì trang tài khoản hiện "Đặt mật khẩu" thay vì "Đổi"
  res.json({ data: { ...rest, hasPassword: Boolean(passwordHash), google: Boolean(googleSub) } });
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
  // Chỉ nhận khi tài khoản chưa có số (tạo qua Google). Số đã có là tên đăng nhập, không đổi ở đây
  phone: z.union([z.literal(""), phoneField]).optional(),
});

accountRouter.patch("/me", async (req, res) => {
  const { phone, ...data } = profileInput.parse(req.body);
  const id: string = res.locals.customerId;
  const current = await prisma.customer.findUniqueOrThrow({ where: { id }, select: { phone: true } });
  if (phone && !current.phone) {
    const owner = await prisma.customer.findUnique({ where: { phone }, select: { id: true } });
    // Số đã có hồ sơ (từng đặt hàng hoặc có tài khoản): không tự gộp vì chưa xác minh được chủ số
    if (owner) throw new HttpError(409, "Số này đã có hồ sơ ở shop. Bạn nhắn shop để gộp hai tài khoản.", "PHONE_TAKEN");
  }
  await prisma.customer.update({ where: { id }, data: { ...data, ...(phone && !current.phone ? { phone } : {}) } });
  res.json({ data: { ok: true } });
});

const passwordInput = z.object({
  // Bỏ trống khi tài khoản chưa có mật khẩu
  currentPassword: z.string().max(100).optional(),
  newPassword: passwordField,
});

// Đổi hoặc đặt mật khẩu. Tăng sessionVersion để đăng xuất mọi thiết bị khác, phiên hiện tại nhận token mới
accountRouter.post("/password", async (req, res) => {
  const input = passwordInput.parse(req.body);
  const id: string = res.locals.customerId;
  limiter.check(id);
  const customer = await prisma.customer.findUnique({ where: { id }, select: { passwordHash: true } });
  if (!customer) throw new HttpError(401, "Bạn cần đăng nhập lại.", "UNAUTHORIZED");
  if (customer.passwordHash && !(await verifyPassword(input.currentPassword ?? "", customer.passwordHash))) {
    limiter.fail(id);
    throw new HttpError(400, "Mật khẩu hiện tại chưa đúng.", "BAD_CURRENT_PASSWORD");
  }
  limiter.reset(id);
  const updated = await prisma.customer.update({
    where: { id },
    data: { passwordHash: await hashPassword(input.newPassword), sessionVersion: { increment: 1 } },
    select: { id: true, sessionVersion: true },
  });
  res.json({ data: session(updated) });
});
