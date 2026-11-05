import { Router } from "express";
import { z } from "zod";
import { env } from "../../env.js";
import { checkCredentials, issueToken, requireAdmin, requireOwner, type StaffContext } from "../../lib/auth.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { failureLimiter } from "../../lib/rate-limit.js";
import { HttpError } from "../../middleware/errors.js";
import { adminBlogRouter } from "./admin.blog.js";
import { adminBraceletRouter } from "./admin.bracelet.js";
import { adminBusinessRouter } from "./admin.business.js";
import { adminCatalogRouter } from "./admin.catalog.js";
import { adminHomeRouter } from "./admin.home.js";
import { adminInboxRouter } from "./admin.inbox.js";
import { adminInventoryRouter } from "./admin.inventory.js";
import { adminSalesRouter } from "./admin.sales.js";
import { adminStaffRouter } from "./admin.staff.js";

export const adminRouter = Router();

// Chặn dò mật khẩu: tối đa 10 lần sai mỗi IP trong 15 phút
const limiter = failureLimiter({ max: 10, windowMs: 15 * 60 * 1000, message: "Bạn đã nhập sai nhiều lần. Vui lòng thử lại sau 15 phút." });

// Tài khoản trong .env là chủ shop: lần đầu đăng nhập thì tạo bản ghi nhân viên tương ứng
async function ensureOwner() {
  const email = env.ADMIN_EMAIL.toLowerCase();
  const existing = await prisma.staffUser.findUnique({ where: { email } });
  if (existing) return existing.active ? existing : null;
  return prisma.staffUser.create({ data: { email, name: "Chủ shop", role: "OWNER", passwordHash: await hashPassword(env.ADMIN_PASSWORD) } });
}

adminRouter.post("/login", async (req, res) => {
  const ip = req.ip ?? "unknown";
  limiter.check(ip);
  const { email, password } = z.object({ email: z.string(), password: z.string() }).parse(req.body);
  const staff = await prisma.staffUser.findUnique({ where: { email: email.trim().toLowerCase() }, omit: { passwordHash: false } });
  let user: { id: string } | null = null;
  if (staff?.active && (await verifyPassword(password, staff.passwordHash))) user = staff;
  else if (checkCredentials(email, password)) user = await ensureOwner();
  if (!user) {
    limiter.fail(ip);
    throw new HttpError(401, "Tài khoản hoặc mật khẩu chưa đúng.", "BAD_CREDENTIALS");
  }
  limiter.reset(ip);
  res.json({ data: issueToken(user.id) });
});

if (env.DEV_LOGIN === "on" && env.NODE_ENV !== "production") {
  adminRouter.post("/dev-login", async (_req, res) => {
    const owner = await ensureOwner();
    if (!owner) throw new HttpError(403, "Tài khoản chủ shop đang bị khoá.");
    res.json({ data: issueToken(owner.id) });
  });
}

adminRouter.use(requireAdmin);

adminRouter.get("/me", (_req, res) => {
  res.json({ data: res.locals.staff as StaffContext });
});

adminRouter.use(adminInboxRouter);
adminRouter.use(adminHomeRouter);
adminRouter.use(adminCatalogRouter);
adminRouter.use(adminBraceletRouter);
adminRouter.use(adminBlogRouter);
adminRouter.use(adminSalesRouter);
// Vốn, kho, nhân viên chỉ chủ shop xem
adminRouter.use(requireOwner, adminBusinessRouter);
adminRouter.use(requireOwner, adminInventoryRouter);
adminRouter.use(requireOwner, adminStaffRouter);
