import { Router } from "express";
import { z } from "zod";
import { StaffRole } from "../../generated/prisma/client.js";
import type { StaffContext } from "../../lib/auth.js";
import { hashPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";

export const adminStaffRouter = Router();

const password = z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự.");
const staffInput = z.object({
  email: z.email("Email chưa đúng định dạng.").transform((v) => v.toLowerCase()),
  name: z.string().trim().min(2, "Nhập tên nhân viên."),
  role: z.enum(StaffRole),
  active: z.boolean().default(true),
});

adminStaffRouter.get("/staff", async (_req, res) => {
  res.json({ data: await prisma.staffUser.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] }) });
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
