import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, RequestHandler } from "express";
import { env } from "../env.js";
import { HttpError } from "../middleware/errors.js";
import { prisma } from "./prisma.js";

const TOKEN_TTL_SECONDS = 60 * 60 * 12;

function sign(payload: string) {
  return createHmac("sha256", env.AUTH_SECRET).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function checkCredentials(email: string, password: string) {
  // So cả hai để thời gian trả lời không lộ trường nào sai
  const emailOk = safeEqual(email.trim().toLowerCase(), env.ADMIN_EMAIL.toLowerCase());
  const passwordOk = safeEqual(password, env.ADMIN_PASSWORD);
  return emailOk && passwordOk;
}

// kind tách token quản trị và token khách: token khách không mở được API quản trị
type TokenKind = "admin" | "customer";

export function issueToken(sub: string, kind: TokenKind = "admin", ttlSeconds = TOKEN_TTL_SECONDS) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = Buffer.from(JSON.stringify({ sub, kind, exp })).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, expiresAt: new Date(exp * 1000).toISOString() };
}

function verifyToken(token: string, kind: TokenKind): { sub: string } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp * 1000 < Date.now() || data.kind !== kind) return null;
    return { sub: String(data.sub) };
  } catch {
    return null;
  }
}

export type StaffContext = { id: string; email: string; name: string; role: "OWNER" | "SALES" };

// Token quản trị mang id nhân viên. Nhân viên bị khoá thì token cũ hết hiệu lực ngay
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const header = req.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? verifyToken(header.slice(7), "admin") : null;
  const staff = token ? await prisma.staffUser.findUnique({ where: { id: token.sub }, select: { id: true, email: true, name: true, role: true, active: true } }) : null;
  if (!staff?.active) throw new HttpError(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", "UNAUTHORIZED");
  res.locals.staff = staff satisfies StaffContext;
  next();
};

export const requireOwner: RequestHandler = (_req, res, next) => {
  if ((res.locals.staff as StaffContext | undefined)?.role !== "OWNER") throw new HttpError(403, "Chỉ chủ shop xem được mục này.", "FORBIDDEN");
  next();
};

// Khách đăng nhập là tuỳ chọn: không có token hoặc token sai thì coi như khách vãng lai
export function customerIdFrom(req: Request): string | null {
  const header = req.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? (verifyToken(header.slice(7), "customer")?.sub ?? null) : null;
}

export const requireCustomer: RequestHandler = (req, res, next) => {
  const id = customerIdFrom(req);
  if (!id) throw new HttpError(401, "Bạn cần đăng nhập lại.", "UNAUTHORIZED");
  res.locals.customerId = id;
  next();
};
