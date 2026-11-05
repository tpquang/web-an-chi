import { Router } from "express";
import { getHome, publicHome } from "../../lib/home.js";
import { prisma } from "../../lib/prisma.js";
import { getStore } from "../../lib/store.js";
import { HttpError } from "../../middleware/errors.js";

export const settingsRouter = Router();

settingsRouter.get("/store", async (_req, res) => {
  res.json({ data: await getStore() });
});

settingsRouter.get("/home", async (_req, res) => {
  res.json({ data: await publicHome(await getHome()) });
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
