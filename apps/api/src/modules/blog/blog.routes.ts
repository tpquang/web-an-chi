import { Router } from "express";
import { z } from "zod";
import { PublishStatus, type Prisma } from "../../generated/prisma/client.js";
import { pageQuery } from "../../lib/text.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";
import { productInclude } from "../catalog/catalog.routes.js";

export const blogRouter = Router();

// Bài hẹn giờ chưa tới ngày đăng thì chưa hiện
function livePosts(): Prisma.PostWhereInput {
  return { status: PublishStatus.PUBLISHED, publishedAt: { lte: new Date() } };
}

const postListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverUrl: true,
  authorName: true,
  publishedAt: true,
  updatedAt: true,
  category: { select: { name: true, slug: true } },
} as const satisfies Prisma.PostSelect;

blogRouter.get("/post-categories", async (_req, res) => {
  const data = await prisma.postCategory.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { posts: { where: livePosts() } } } },
  });
  res.json({ data });
});

blogRouter.get("/post-categories/:slug", async (req, res) => {
  const data = await prisma.postCategory.findUnique({ where: { slug: req.params.slug } });
  if (!data) throw new HttpError(404, "Không tìm thấy chủ đề");
  res.json({ data });
});

const listQuery = z.object({
  ...pageQuery,
  category: z.string().optional(),
  featured: z.stringbool().optional(),
  exclude: z.string().optional(),
});

blogRouter.get("/posts", async (req, res) => {
  const { page, limit, category, featured, exclude } = listQuery.parse(req.query);
  const where: Prisma.PostWhereInput = {
    ...livePosts(),
    ...(featured !== undefined ? { featured } : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(exclude ? { NOT: { slug: exclude } } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      select: postListSelect,
      orderBy: [{ publishedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

blogRouter.get("/posts/:slug", async (req, res) => {
  const data = await prisma.post.findFirst({
    where: { slug: req.params.slug, ...livePosts() },
    include: {
      category: { select: { name: true, slug: true } },
      products: {
        where: { status: PublishStatus.PUBLISHED },
        include: productInclude,
        take: 3,
      },
    },
  });
  if (!data) throw new HttpError(404, "Không tìm thấy bài viết");
  res.json({ data });
});
