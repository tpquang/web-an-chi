import { Router } from "express";
import { z } from "zod";
import { PublishStatus, type Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { optionalText, optionalUrl, pageQuery, slugField } from "../../lib/text.js";
import { HttpError } from "../../middleware/errors.js";

export const adminCatalogRouter = Router();

// ---- Danh mục sản phẩm

const categoryInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugField,
  description: optionalText,
  guide: optionalText,
  position: z.number().int().min(0).default(0),
  metaTitle: optionalText,
  metaDescription: optionalText,
});

adminCatalogRouter.get("/categories", async (_req, res) => {
  const data = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  res.json({ data });
});

adminCatalogRouter.get("/categories/:id", async (req, res) => {
  res.json({ data: await prisma.category.findUniqueOrThrow({ where: { id: req.params.id } }) });
});

adminCatalogRouter.post("/categories", async (req, res) => {
  res.status(201).json({ data: await prisma.category.create({ data: categoryInput.parse(req.body) }) });
});

adminCatalogRouter.put("/categories/:id", async (req, res) => {
  const data = await prisma.category.update({ where: { id: req.params.id }, data: categoryInput.parse(req.body) });
  res.json({ data });
});

adminCatalogRouter.delete("/categories/:id", async (req, res) => {
  const count = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (count > 0) throw new HttpError(409, `Danh mục còn ${count} sản phẩm. Chuyển sản phẩm sang danh mục khác trước khi xoá.`, "IN_USE");
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// ---- Sản phẩm

const vnd = z.number().int().min(0).max(2_000_000_000);

const productInput = z
  .object({
    name: z.string().trim().min(2).max(160),
    slug: slugField,
    summary: optionalText,
    description: optionalText,
    usage: optionalText,
    specs: z
      .array(z.object({ label: z.string().trim().min(1), value: z.string().trim().min(1) }))
      .max(20)
      .default([]),
    priceVnd: vnd,
    compareAtPriceVnd: vnd.nullish().transform((value) => value || null),
    stock: z.number().int().min(0).max(100_000),
    origin: optionalText,
    featured: z.boolean().default(false),
    shopeeUrl: optionalUrl,
    tiktokUrl: optionalUrl,
    status: z.enum(PublishStatus),
    metaTitle: optionalText,
    metaDescription: optionalText,
    categoryId: z.string().min(1),
    images: z
      .array(z.object({ url: z.url(), alt: optionalText }))
      .max(12)
      .default([]),
  })
  .refine((value) => value.compareAtPriceVnd === null || value.compareAtPriceVnd > value.priceVnd, {
    path: ["compareAtPriceVnd"],
    message: "Giá gốc phải cao hơn giá bán, hoặc để trống.",
  });

function productData(input: z.infer<typeof productInput>) {
  const { images, ...rest } = input;
  return {
    data: rest,
    images: images.map((image, position) => ({ ...image, position })),
  };
}

const listQuery = z.object({
  ...pageQuery,
  q: z.string().trim().optional(),
  status: z.enum(PublishStatus).optional(),
  category: z.string().optional(),
});

adminCatalogRouter.get("/products", async (req, res) => {
  const { page, limit, q, status, category } = listQuery.parse(req.query);
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { slug: { contains: q } }] } : {}),
    ...(status ? { status } : {}),
    ...(category ? { categoryId: category } : {}),
  };
  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true } }, images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);
  res.json({ data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});

adminCatalogRouter.get("/products/:id", async (req, res) => {
  const data = await prisma.product.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  res.json({ data });
});

adminCatalogRouter.post("/products", async (req, res) => {
  const { data, images } = productData(productInput.parse(req.body));
  const created = await prisma.product.create({ data: { ...data, images: { create: images } } });
  res.status(201).json({ data: created });
});

adminCatalogRouter.put("/products/:id", async (req, res) => {
  const { data, images } = productData(productInput.parse(req.body));
  // Ảnh gửi lên là danh sách đầy đủ theo thứ tự mới, nên thay toàn bộ
  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { ...data, images: { deleteMany: {}, create: images } },
  });
  res.json({ data: updated });
});

adminCatalogRouter.delete("/products/:id", async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
