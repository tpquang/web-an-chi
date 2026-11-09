import express, { Router } from "express";
import { z } from "zod";
import { FEATURED_LIMIT, getHome, HOME_IMAGE, homeImageIds, homeSchema } from "../../lib/home.js";
import { imageInfo } from "../../lib/image.js";
import { prisma } from "../../lib/prisma.js";
import { adminSeoPages, isSeoPageKey, saveSeoPage, seoPageInput } from "../../lib/seo-pages.js";
import { HttpError } from "../../middleware/errors.js";

export const adminHomeRouter = Router();

// Cấu hình banner và slide trang chủ, kèm ảnh đang dùng để CMS xem trước
adminHomeRouter.get("/home", async (_req, res) => {
  const home = await getHome();
  const images = await prisma.siteImage.findMany({ where: { id: { in: homeImageIds(home) } }, select: { id: true, width: true, height: true } });
  res.json({ data: { home, images } });
});

adminHomeRouter.put("/home", async (req, res) => {
  const home = homeSchema.parse(req.body);
  const ids = homeImageIds(home);
  const found = await prisma.siteImage.count({ where: { id: { in: ids } } });
  if (found !== new Set(ids).size) throw new HttpError(400, "Có ảnh chưa tải lên xong hoặc đã bị xoá. Tải lại ảnh rồi lưu.", "BAD_IMAGE");
  await prisma.$transaction([
    prisma.setting.upsert({ where: { key: "home" }, update: { value: home }, create: { key: "home", value: home } }),
    // Ảnh không còn dùng thì xoá. Chừa ảnh vừa tải trong một giờ vì có thể đang chờ lưu ở tab khác
    prisma.siteImage.deleteMany({ where: { id: { notIn: ids }, createdAt: { lt: new Date(Date.now() - 3_600_000) } } }),
  ]);
  res.json({ data: home });
});

adminHomeRouter.post("/site-images", express.raw({ type: ["image/webp", "image/png"], limit: HOME_IMAGE.maxBytes }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new HttpError(400, "Chưa nhận được ảnh. Ảnh cần là WebP hoặc PNG.", "BAD_IMAGE");
  const info = imageInfo(req.body);
  if (!info) throw new HttpError(400, "File không phải ảnh WebP hoặc PNG hợp lệ.", "BAD_IMAGE");
  const saved = await prisma.siteImage.create({
    data: { image: new Uint8Array(req.body), mime: info.mime, width: info.width, height: info.height },
    select: { id: true, width: true, height: true },
  });
  res.status(201).json({ data: saved });
});

// Bật tắt nổi bật ngay ở danh sách. Form sửa sản phẩm, bài viết cũng kiểm theo hàm này
export async function assertFeaturedRoom(kind: "products" | "posts", exceptId?: string) {
  const where = { featured: true, ...(exceptId ? { NOT: { id: exceptId } } : {}) };
  const count = kind === "products" ? await prisma.product.count({ where }) : await prisma.post.count({ where });
  const limit = FEATURED_LIMIT[kind];
  if (count >= limit) {
    const noun = kind === "products" ? "sản phẩm" : "bài viết";
    throw new HttpError(409, `Trang chủ đã đủ ${limit} ${noun} nổi bật. Bỏ nổi bật một ${noun} khác trước.`, "FEATURED_FULL");
  }
}

const featuredInput = z.object({ featured: z.boolean() });

adminHomeRouter.patch("/products/:id/featured", async (req, res) => {
  const { featured } = featuredInput.parse(req.body);
  if (featured) await assertFeaturedRoom("products", req.params.id);
  const data = await prisma.product.update({ where: { id: req.params.id }, data: { featured }, select: { id: true, featured: true } });
  res.json({ data });
});

adminHomeRouter.patch("/posts/:id/featured", async (req, res) => {
  const { featured } = featuredInput.parse(req.body);
  if (featured) await assertFeaturedRoom("posts", req.params.id);
  const data = await prisma.post.update({ where: { id: req.params.id }, data: { featured }, select: { id: true, featured: true } });
  res.json({ data });
});

// Danh sách đang nổi bật để CMS cho biết còn mấy chỗ
adminHomeRouter.get("/featured", async (_req, res) => {
  const [products, posts] = await Promise.all([
    prisma.product.findMany({ where: { featured: true }, select: { id: true, name: true, status: true }, orderBy: { updatedAt: "desc" } }),
    prisma.post.findMany({ where: { featured: true }, select: { id: true, title: true, status: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  res.json({ data: { products, posts, limit: FEATURED_LIMIT } });
});

// ---- SEO trang không có slug: trang chủ, danh sách sản phẩm, bài viết, trang tĩnh

adminHomeRouter.get("/seo-pages", async (_req, res) => {
  res.json({ data: await adminSeoPages() });
});

adminHomeRouter.put("/seo-pages/:key", async (req, res) => {
  const key = req.params.key;
  if (!isSeoPageKey(key)) throw new HttpError(404, "Không có trang này trong cài đặt SEO.", "NOT_FOUND");
  await saveSeoPage(key, seoPageInput.parse(req.body));
  res.json({ data: await adminSeoPages() });
});
