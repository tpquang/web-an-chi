import { Router } from "express";
import { z } from "zod";
import { StaffRole } from "../../generated/prisma/client.js";
import type { StaffContext } from "../../lib/auth.js";
import { hashPassword } from "../../lib/password.js";
import { normalize, permissionsInput } from "../../lib/permissions.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";

export const adminStaffRouter = Router();

const password = z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.");
const staffInput = z.object({
  email: z.email("Email chưa đúng định dạng.").transform((v) => v.toLowerCase()),
  name: z.string().trim().min(2, "Nhập tên nhân viên."),
  role: z.enum(StaffRole),
  active: z.boolean().default(true),
  // Chỉ dùng cho nhân viên, chủ shop luôn đủ quyền
  permissions: permissionsInput.optional(),
});

adminStaffRouter.get("/staff", async (_req, res) => {
  const rows = await prisma.staffUser.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
  res.json({ data: rows.map((s) => ({ ...s, permissions: normalize(s.permissions) })) });
});

adminStaffRouter.post("/staff", async (req, res) => {
  const input = staffInput.extend({ password }).parse(req.body);
  const { password: plain, ...data } = input;
  res.status(201).json({ data: await prisma.staffUser.create({ data: { ...data, passwordHash: await hashPassword(plain) } }) });
});

adminStaffRouter.put("/staff/:id", async (req, res) => {
  const input = staffInput.extend({ password: password.optional().or(z.literal("")) }).parse(req.body);
  const me = res.locals.staff as StaffContext;
  // Không tự khoá hay tự hạ quyền mình, tránh mất quyền chủ shop
  if (req.params.id === me.id && (!input.active || input.role !== "OWNER")) throw new HttpError(409, "Bạn không thể tự khoá hoặc tự hạ quyền tài khoản của mình.", "SELF_LOCK");
  const { password: plain, ...data } = input;
  const updated = await prisma.staffUser.update({
    where: { id: req.params.id },
    data: { ...data, ...(plain ? { passwordHash: await hashPassword(plain) } : {}) },
  });
  res.json({ data: updated });
});

// Xoá hẳn tài khoản, ví dụ tài khoản chủ shop cũ sau khi đổi ADMIN_EMAIL. Hội thoại và việc được giao
// giữ lại, chỉ bỏ người phụ trách. Không tự xoá mình nên luôn còn ít nhất một chủ shop đang đăng nhập
adminStaffRouter.delete("/staff/:id", async (req, res) => {
  const me = res.locals.staff as StaffContext;
  if (req.params.id === me.id) throw new HttpError(409, "Bạn không thể tự xoá tài khoản đang đăng nhập.", "SELF_DELETE");
  await prisma.staffUser.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
