import { Router } from "express";
import { z } from "zod";
import { env } from "../../env.js";
import { checkCredentials, issueToken, requireAdmin } from "../../lib/auth.js";
import { failureLimiter } from "../../lib/rate-limit.js";
import { HttpError } from "../../middleware/errors.js";
import { adminBlogRouter } from "./admin.blog.js";
import { adminCatalogRouter } from "./admin.catalog.js";
import { adminSalesRouter } from "./admin.sales.js";

export const adminRouter = Router();

// Chặn dò mật khẩu: tối đa 10 lần sai mỗi IP trong 15 phút
const limiter = failureLimiter({ max: 10, windowMs: 15 * 60 * 1000, message: "Bạn đã nhập sai nhiều lần. Vui lòng thử lại sau 15 phút." });

adminRouter.post("/login", (req, res) => {
  const ip = req.ip ?? "unknown";
  limiter.check(ip);
  const { email, password } = z.object({ email: z.string(), password: z.string() }).parse(req.body);
  if (!checkCredentials(email, password)) {
    limiter.fail(ip);
    throw new HttpError(401, "Email hoặc mật khẩu chưa đúng.", "BAD_CREDENTIALS");
  }
  limiter.reset(ip);
  res.json({ data: issueToken(email.trim().toLowerCase()) });
});

if (env.DEV_LOGIN === "on" && env.NODE_ENV !== "production") {
  adminRouter.post("/dev-login", (_req, res) => {
    res.json({ data: issueToken(env.ADMIN_EMAIL.toLowerCase()) });
  });
}

adminRouter.use(requireAdmin);

adminRouter.get("/me", (_req, res) => {
  res.json({ data: { email: res.locals.admin.sub } });
});

adminRouter.use(adminCatalogRouter);
adminRouter.use(adminBlogRouter);
adminRouter.use(adminSalesRouter);
