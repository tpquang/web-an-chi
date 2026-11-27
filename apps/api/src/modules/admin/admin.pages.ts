import { Router } from "express";
import { z } from "zod";
import { PublishStatus } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { recordSlugChange } from "../../lib/redirects.js";
import { optionalImageUrl, optionalText, slugField } from "../../lib/text.js";
import { HttpError } from "../../middleware/errors.js";

export const adminPagesRouter = Router();

// Trang tự soạn nằm ở /<slug> nên slug không được trùng đoạn đầu của route tĩnh trên web (apps/web/src/app)
// và thư mục trong apps/web/public. Thêm route tĩnh mới ở web thì thêm vào đây
export const RESERVED_PAGE_SLUGS = new Set([
  "api", "bai-viet", "chinh-sach", "chu-de", "countdown", "dang-ky", "dang-nhap", "danh-muc", "don-hang", "gio-hang",
  "gioi-thieu", "nha-cung-cap", "san-pham", "tai-khoan", "thanh-toan", "thiet-ke-vong-tay", "tra-cuu-don-hang",
  "brand", "data", "models",
]);

// Nút cuối trang dẫn tới trang trong site, link ngoài https, số điện thoại, email, hoặc "#chat" để mở khung chat với shop
const ctaHref = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || value === "#chat" || /^(\/(?!\/)|https:\/\/|tel:|mailto:)/.test(value), "Link nút cần bắt đầu bằng /, https://, tel:, mailto: hoặc là #chat.");

const pageInput = z
  .object({
    title: z.string().trim().min(3, "Tiêu đề cần ít nhất 3 ký tự.").max(160),
    slug: slugField.refine((slug) => !RESERVED_PAGE_SLUGS.has(slug), "Đường dẫn này website đã dùng. Bạn chọn slug khác."),
    summary: optionalText,
    content: z.string().trim().min(1, "Trang cần có nội dung."),
    status: z.enum(PublishStatus),
    showInFooter: z.boolean().default(false),
    position: z.number().int().min(0).max(999).default(0),
    ctaLabel: optionalText,
    ctaHref,
    focusKeyword: optionalText,
    metaTitle: optionalText,
    metaDescription: optionalText,
    noindex: z.boolean().default(false),
    ogTitle: optionalText,
    ogDescription: optionalText,
    ogImageUrl: optionalImageUrl,
  })
  .refine((page) => !page.ctaLabel === !page.ctaHref, { path: ["ctaHref"], message: "Nút cần có cả chữ và link, hoặc bỏ trống cả hai." });

adminPagesRouter.get("/pages", async (_req, res) => {
  const data = await prisma.page.findMany({
    select: { id: true, title: true, slug: true, status: true, showInFooter: true, position: true, noindex: true, updatedAt: true },
    orderBy: [{ position: "asc" }, { title: "asc" }],
  });
  res.json({ data });
});

adminPagesRouter.get("/pages/:id", async (req, res) => {
  res.json({ data: await prisma.page.findUniqueOrThrow({ where: { id: req.params.id } }) });
});

adminPagesRouter.post("/pages", async (req, res) => {
  res.status(201).json({ data: await prisma.page.create({ data: pageInput.parse(req.body) }) });
});

adminPagesRouter.put("/pages/:id", async (req, res) => {
  const input = pageInput.parse(req.body);
  const before = await prisma.page.findUnique({ where: { id: req.params.id }, select: { slug: true } });
  if (!before) throw new HttpError(404, "Không tìm thấy trang.");
  const data = await prisma.page.update({ where: { id: req.params.id }, data: input });
  await recordSlugChange("page", before.slug, data.slug);
  res.json({ data });
});

adminPagesRouter.delete("/pages/:id", async (req, res) => {
  await prisma.page.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
