import { Router } from "express";
import { z } from "zod";
import { PublishStatus, type Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { optionalImageUrl, optionalText, pageQuery, slugField } from "../../lib/text.js";
import { HttpError } from "../../middleware/errors.js";
import { assertFeaturedRoom } from "./admin.home.js";

export const adminBlogRouter = Router();

// ---- Chủ đề bài viết

const postCategoryInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugField,
  description: optionalText,
  position: z.number().int().min(0).default(0),
  metaTitle: optionalText,
  metaDescription: optionalText,
});

adminBlogRouter.get("/post-categories", async (_req, res) => {
  const data = await prisma.postCategory.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { posts: true } } },
  });
  res.json({ data });
});

adminBlogRouter.get("/post-categories/:id", async (req, res) => {
  res.json({ data: await prisma.postCategory.findUniqueOrThrow({ where: { id: req.params.id } }) });
});

adminBlogRouter.post("/post-categories", async (req, res) => {
  res.status(201).json({ data: await prisma.postCategory.create({ data: postCategoryInput.parse(req.body) }) });
});

adminBlogRouter.put("/post-categories/:id", async (req, res) => {
  const data = await prisma.postCategory.update({ where: { id: req.params.id }, data: postCategoryInput.parse(req.body) });
  res.json({ data });
});

adminBlogRouter.delete("/post-categories/:id", async (req, res) => {
  const count = await prisma.post.count({ where: { categoryId: req.params.id } });
  if (count > 0) throw new HttpError(409, `Chủ đề còn ${count} bài viết. Chuyển bài sang chủ đề khác trước khi xoá.`, "IN_USE");
  await prisma.postCategory.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ---- Bài viết

const postInput = z.object({
  title: z.string().trim().min(5).max(160),
  slug: slugField,
  excerpt: optionalText,
  content: z.string().trim().min(1, "Bài viết cần có nội dung."),
  coverUrl: optionalImageUrl,
  coverAlt: optionalText,
  focusKeyword: optionalText,
  ogTitle: optionalText,
  ogDescription: optionalText,
  ogImageUrl: optionalImageUrl,
  authorName: z.string().trim().min(2).max(80),
  status: z.enum(PublishStatus),
  publishedAt: z.iso.datetime({ offset: true }).nullish(),
  metaTitle: optionalText,
  metaDescription: optionalText,
  categoryId: z.string().min(1),
  featured: z.boolean().default(false),
  productIds: z.array(z.string()).max(3, "Tối đa 3 sản phẩm liên quan.").default([]),
});

function postData(input: z.infer<typeof postInput>) {
  const { productIds, publishedAt, ...rest } = input;
  return {
    ...rest,
    // Đăng mà chưa chọn ngày thì lấy lúc lưu
    publishedAt: publishedAt ? new Date(publishedAt) : rest.status === PublishStatus.PUBLISHED ? new Date() : null,
    products: { set: productIds.map((id) => ({ id })) },
  };
}

const listQuery = z.object({
  ...pageQuery,
  q: z.string().trim().optional(),
  status: z.enum(PublishStatus).optional(),
  category: z.string().optional(),
});

adminBlogRouter.get("/posts", async (req, res) => {
  const { page, limit, q, status, category } = listQuery.parse(req.query);
  const where: Prisma.PostWhereInput = {
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    ...(status ? { status } : {}),
    ...(category ? { categoryId: category } : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        featured: true,
        publishedAt: true,
        updatedAt: true,
        authorName: true,
        category: { select: { name: true } },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);
  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

adminBlogRouter.get("/posts/:id", async (req, res) => {
  const data = await prisma.post.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { products: { select: { id: true } } },
  });
  const { products, ...post } = data;
  res.json({ data: { ...post, productIds: products.map((product) => product.id) } });
});

adminBlogRouter.post("/posts", async (req, res) => {
  const { products, ...data } = postData(postInput.parse(req.body));
  if (data.featured) await assertFeaturedRoom("posts");
  const created = await prisma.post.create({ data: { ...data, products: { connect: products.set } } });
  res.status(201).json({ data: created });
});

adminBlogRouter.put("/posts/:id", async (req, res) => {
  const input = postData(postInput.parse(req.body));
  if (input.featured) await assertFeaturedRoom("posts", req.params.id);
  const data = await prisma.post.update({ where: { id: req.params.id }, data: input });
  res.json({ data });
});

adminBlogRouter.delete("/posts/:id", async (req, res) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
