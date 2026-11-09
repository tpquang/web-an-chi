import type { RequestHandler } from "express";
import { z } from "zod";
import { HttpError } from "../middleware/errors.js";
import type { StaffContext } from "./auth.js";

// Ma trận quyền nhân viên: mỗi mục một mức none / view / edit. Chủ shop luôn đủ quyền.
// Đọc (GET) cần view, ghi cần edit. CMS dùng cùng danh sách để vẽ bảng quyền và ẩn menu.
export const PERMISSION_MODULES = [
  { key: "dashboard", label: "Tổng quan", paths: ["dashboard"] },
  { key: "orders", label: "Đơn hàng, khách hàng", paths: ["orders", "customers"] },
  { key: "products", label: "Sản phẩm, danh mục, hạt", paths: ["products", "categories", "featured", "bead-textures"] },
  { key: "inventory", label: "Kho, đóng gói, kiểm kho", paths: ["materials", "recipes", "pack", "pack-runs", "movements"] },
  { key: "batches", label: "Đợt nhập hàng", paths: ["batches"] },
  { key: "finance", label: "Chi phí, lợi nhuận", paths: ["expenses", "reports"] },
  { key: "posts", label: "Bài viết", paths: ["posts", "post-categories"] },
  { key: "home", label: "Trang chủ, cài đặt SEO", paths: ["home", "site-images", "seo-pages"] },
  { key: "inbox", label: "Hộp thư", paths: ["inbox"] },
] as const;

export type PermissionKey = (typeof PERMISSION_MODULES)[number]["key"];
export type Level = "none" | "view" | "edit";
export type Permissions = Record<PermissionKey, Level>;

const keys = PERMISSION_MODULES.map((m) => m.key) as [PermissionKey, ...PermissionKey[]];
const level = z.enum(["none", "view", "edit"]);
export const permissionsInput = z.partialRecord(z.enum(keys), level).transform((value) => normalize(value));

// Quyền mặc định của nhân viên bán hàng, giống quyền SALES trước khi có ma trận
export const SALES_DEFAULT: Permissions = {
  dashboard: "view",
  orders: "edit",
  products: "edit",
  inventory: "none",
  batches: "none",
  finance: "none",
  posts: "edit",
  home: "none",
  inbox: "edit",
};

export function normalize(raw: unknown): Permissions {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(keys.map((k) => [k, level.safeParse(source[k]).data ?? SALES_DEFAULT[k]])) as Permissions;
}

const ALL_EDIT = Object.fromEntries(keys.map((k) => [k, "edit"])) as Permissions;
export const effectivePermissions = (staff: { role: string; permissions: unknown }) => (staff.role === "OWNER" ? ALL_EDIT : normalize(staff.permissions));

const byPath = new Map<string, PermissionKey>(PERMISSION_MODULES.flatMap((m) => m.paths.map((p) => [p, m.key] as const)));
const rank: Record<Level, number> = { none: 0, view: 1, edit: 2 };

// Ảnh tải lên dùng chung cho sản phẩm và bài viết: cần quyền sửa một trong hai
const MEDIA: PermissionKey[] = ["products", "posts", "home"];

export const requirePermission: RequestHandler = (req, res, next) => {
  const staff = res.locals.staff as StaffContext;
  if (staff.role === "OWNER") return next();
  const segment = req.path.split("/")[1] ?? "";
  const need: Level = req.method === "GET" || req.method === "HEAD" ? "view" : "edit";
  // Tài khoản nhân viên và phân quyền: chỉ chủ shop, để nhân viên không tự nâng quyền
  // Thông tin cửa hàng có tài khoản ngân hàng nhận tiền: chỉ chủ shop
  if (segment === "store") throw new HttpError(403, "Chỉ chủ shop sửa thông tin cửa hàng.", "FORBIDDEN");
  if (segment === "staff") throw new HttpError(403, "Chỉ chủ shop quản lý tài khoản nhân viên.", "FORBIDDEN");
  if (segment === "media") {
    if (MEDIA.some((k) => rank[staff.permissions[k]] >= rank[need])) return next();
    throw new HttpError(403, "Bạn chưa có quyền tải ảnh.", "FORBIDDEN");
  }
  const key = byPath.get(segment);
  if (!key || rank[staff.permissions[key]] >= rank[need]) return next();
  throw new HttpError(403, need === "view" ? "Bạn chưa có quyền xem mục này." : "Bạn chỉ có quyền xem mục này.", "FORBIDDEN");
};
