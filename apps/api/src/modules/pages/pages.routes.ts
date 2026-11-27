import { Router } from "express";
import { PublishStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";

export const pagesRouter = Router();

// Danh sách trang đã đăng: footer lấy trang có showInFooter, sitemap lấy trang không noindex
pagesRouter.get("/pages", async (_req, res) => {
  const data = await prisma.page.findMany({
    where: { status: PublishStatus.PUBLISHED },
    select: { title: true, slug: true, showInFooter: true, noindex: true, updatedAt: true },
    orderBy: [{ position: "asc" }, { title: "asc" }],
  });
  res.json({ data });
});

pagesRouter.get("/pages/:slug", async (req, res) => {
  const data = await prisma.page.findFirst({
    where: { slug: req.params.slug, status: PublishStatus.PUBLISHED },
    omit: { id: true, status: true, showInFooter: true, position: true, focusKeyword: true, createdAt: true },
  });
  if (!data) throw new HttpError(404, "Không tìm thấy trang");
  res.json({ data });
});
