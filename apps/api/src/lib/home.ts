import { z } from "zod";
import { prisma } from "./prisma.js";

// Cấu hình trang chủ lưu ở Setting "home": banner và slide giới thiệu. Ảnh lưu ở SiteImage, ở đây chỉ giữ id.

export const FEATURED_LIMIT = { products: 4, posts: 3 } as const;
export const HOME_IMAGE = { maxBytes: 3_000_000, maxSlides: 6 } as const;

const text = (max: number) => z.string().trim().max(max);
// Link trong trang bắt đầu bằng "/", link ngoài phải là https
const href = z
  .string()
  .trim()
  .max(300)
  .refine((value) => /^\/(?!\/)/.test(value) || /^https:\/\//.test(value), "Link cần bắt đầu bằng / hoặc https://");
const imageId = z.string().regex(/^[a-z0-9]{10,40}$/i).nullable();
const link = z.object({ label: text(40).min(1), href });

const bannerSchema = z.object({
  eyebrow: text(60),
  title: text(90).min(1, "Banner cần có tiêu đề."),
  text: text(240),
  imageId,
  imageAlt: text(160),
  primary: link,
  secondary: link.nullable(),
});

const slideSchema = z.object({
  eyebrow: text(60),
  title: text(90).min(1, "Slide cần có tiêu đề."),
  text: text(240),
  imageId,
  imageAlt: text(160),
  cta: link.nullable(),
});

export const homeSchema = z.object({
  banner: bannerSchema,
  slides: z.array(slideSchema).min(1, "Cần ít nhất một slide.").max(HOME_IMAGE.maxSlides, `Tối đa ${HOME_IMAGE.maxSlides} slide.`),
});

export type Home = z.infer<typeof homeSchema>;

// Dùng khi chưa cấu hình trong CMS. Chỉ nêu điều shop kiểm chứng được
const fallback: Home = {
  banner: {
    eyebrow: "Trầm hương An Chi",
    title: "Trầm hương cho không gian sống của bạn",
    text: "Vòng tay, nhang, nụ trầm và trầm miếng. Mỗi sản phẩm ghi rõ kích thước, xuất xứ và cách dùng.",
    imageId: null,
    imageAlt: "",
    primary: { label: "Xem sản phẩm", href: "/san-pham" },
    secondary: { label: "Về An Chi", href: "/gioi-thieu" },
  },
  slides: [
    {
      eyebrow: "Giới thiệu trầm hương",
      title: "Trầm hương là gì",
      text: "Phần gỗ cây dó bầu đã tích tụ tinh dầu. Trầm tự nhiên hình thành trong nhiều năm nên hiếm và giá cao, trầm cấy mùi nhẹ hơn và dễ tiếp cận hơn.",
      imageId: null,
      imageAlt: "",
      cta: { label: "Cách phân biệt trầm thật", href: "/bai-viet/cach-phan-biet-tram-huong-that" },
    },
    {
      eyebrow: "Chọn theo cách dùng",
      title: "Vòng tay, nhang và nụ trầm",
      text: "Vòng tay chọn theo cỡ cổ tay. Nhang có tăm cho bàn thờ, không tăm cho phòng kín. Nụ trầm dùng với lư xông hoặc thác khói.",
      imageId: null,
      imageAlt: "",
      cta: { label: "Xem sản phẩm", href: "/san-pham" },
    },
  ],
};

export async function getHome(): Promise<Home> {
  const row = await prisma.setting.findUnique({ where: { key: "home" } });
  const parsed = homeSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : fallback;
}

export function homeImageIds(home: Home) {
  return [home.banner.imageId, ...home.slides.map((slide) => slide.imageId)].filter((id): id is string => !!id);
}

// Ảnh kèm kích thước để web đặt đúng tỉ lệ, link có ?v= để cache vĩnh viễn
export async function publicHome(home: Home) {
  const images = await prisma.siteImage.findMany({ where: { id: { in: homeImageIds(home) } }, select: { id: true, width: true, height: true, createdAt: true } });
  const byId = new Map(images.map((image) => [image.id, image]));
  const resolve = (id: string | null, alt: string) => {
    const image = id ? byId.get(id) : undefined;
    return image ? { id: image.id, version: image.createdAt.getTime(), width: image.width, height: image.height, alt } : null;
  };
  return {
    banner: { ...strip(home.banner), image: resolve(home.banner.imageId, home.banner.imageAlt) },
    slides: home.slides.map((slide) => ({ ...strip(slide), image: resolve(slide.imageId, slide.imageAlt) })),
  };
}

function strip<T extends { imageId: string | null; imageAlt: string }>({ imageId: _id, imageAlt: _alt, ...rest }: T) {
  return rest;
}
