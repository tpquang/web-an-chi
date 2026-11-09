import { Router } from "express";
import { getHome, publicHome } from "../../lib/home.js";
import { prisma } from "../../lib/prisma.js";
import { getRedirects } from "../../lib/redirects.js";
import { publicSeoPages } from "../../lib/seo-pages.js";
import { getStore } from "../../lib/store.js";
import { HttpError } from "../../middleware/errors.js";

export const settingsRouter = Router();

settingsRouter.get("/store", async (_req, res) => {
  res.json({ data: await getStore() });
});

// Web tra khi không tìm thấy trang, để URL cũ sau khi đổi slug chuyển 308 sang URL mới
settingsRouter.get("/redirects", async (_req, res) => {
  res.json({ data: await getRedirects() });
});

settingsRouter.get("/home", async (_req, res) => {
  res.json({ data: await publicHome(await getHome()) });
});

// Tiêu đề, mô tả, noindex của trang chủ, trang danh sách, trang tĩnh. Đã gộp với mặc định
settingsRouter.get("/seo-pages", async (_req, res) => {
  res.json({ data: await publicSeoPages() });
});

settingsRouter.get("/images/:id", async (req, res) => {
  const image = await prisma.siteImage.findUnique({ where: { id: req.params.id }, select: { image: true, mime: true } });
  if (!image) throw new HttpError(404, "Không tìm thấy ảnh.", "NOT_FOUND");
  res.set({
    "content-type": image.mime,
    "cache-control": "public, max-age=31536000, immutable",
    "cross-origin-resource-policy": "cross-origin",
  });
  res.send(Buffer.from(image.image));
});
