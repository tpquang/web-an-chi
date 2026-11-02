import { Router } from "express";
import { z } from "zod";
import { PublishStatus, type Prisma } from "../../generated/prisma/client.js";
import { pageQuery } from "../../lib/text.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";

export const catalogRouter = Router();

const published = { status: PublishStatus.PUBLISHED };

export const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: { position: "asc" } },
} as const satisfies Prisma.ProductInclude;

catalogRouter.get("/categories", async (_req, res) => {
  const data = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: published } } } },
  });
  res.json({ data });
});

catalogRouter.get("/categories/:slug", async (req, res) => {
  const data = await prisma.category.findUnique({ where: { slug: req.params.slug } });
  if (!data) throw new HttpError(404, "Không tìm thấy danh mục");
  res.json({ data });
});

const listQuery = z.object({
  ...pageQuery,
  category: z.string().optional(),
  featured: z.stringbool().optional(),
  // Danh sách slug cách nhau bằng dấu phẩy, dùng cho giỏ hàng
  slugs: z.string().optional(),
  exclude: z.string().optional(),
});

catalogRouter.get("/products", async (req, res) => {
  const { page, limit, category, featured, slugs, exclude } = listQuery.parse(req.query);
  const where: Prisma.ProductWhereInput = {
    ...published,
    ...(category ? { category: { slug: category } } : {}),
    ...(featured !== undefined ? { featured } : {}),
    ...(slugs ? { slug: { in: slugs.split(",") } } : {}),
    ...(exclude ? { NOT: { slug: exclude } } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: productInclude,
      // id làm khoá phụ để phân trang không lặp hay sót khi trùng createdAt
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

catalogRouter.get("/products/:slug", async (req, res) => {
  const data = await prisma.product.findFirst({
    where: { slug: req.params.slug, ...published },
    include: {
      ...productInclude,
      posts: {
        where: published,
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: { title: true, slug: true, excerpt: true, publishedAt: true },
      },
    },
  });
  if (!data) throw new HttpError(404, "Không tìm thấy sản phẩm");
  res.json({ data });
});
