import { z } from "zod";
import { prisma } from "./prisma.js";
import { optionalImageUrl, optionalText } from "./text.js";

// SEO của các trang không có slug (trang chủ, danh sách, trang tĩnh), lưu ở Setting "seo-pages".
// Trang có slug (sản phẩm, danh mục, bài viết, chủ đề) cài SEO ngay trong form của nó.
// Mặc định dưới đây phải khớp apps/web/src/lib/page-seo.ts: web dùng bản đó khi không gọi được API.

type PageDef = {
  key: string;
  path: string;
  label: string;
  // true: tiêu đề đã gồm tên site, web không gắn thêm " | An Chi Trầm Hương"
  absoluteTitle: boolean;
  title: string;
  description: string;
};

export const SEO_PAGES = [
  {
    key: "home",
    path: "/",
    label: "Trang chủ",
    absoluteTitle: true,
    title: "Trầm hương tự nhiên Hương Khê, Hà Tĩnh | An Chi Trầm Hương",
    description:
      "Nhang trầm, nụ trầm và vòng tay trầm hương tự nhiên từ vùng Phúc Trạch, Hương Khê, Hà Tĩnh. Ghi rõ thành phần, kích thước, cách dùng. Giao hàng toàn quốc.",
  },
  {
    key: "products",
    path: "/san-pham",
    label: "Sản phẩm",
    absoluteTitle: false,
    title: "Sản phẩm trầm hương",
    description:
      "Tất cả sản phẩm trầm hương tại An Chi: vòng tay, nhang, nụ trầm, trầm miếng và lư xông. Mỗi sản phẩm ghi rõ kích thước, xuất xứ và giá.",
  },
  {
    key: "posts",
    path: "/bai-viet",
    label: "Bài viết",
    absoluteTitle: false,
    title: "Bài viết về trầm hương",
    description:
      "Kiến thức trầm hương, cách phân biệt trầm thật, hướng dẫn đốt nhang, xông nụ, bảo quản vòng tay và chuẩn bị trầm cho các dịp lễ trong năm.",
  },
  {
    key: "bracelet",
    path: "/thiet-ke-vong-tay",
    label: "Tự thiết kế vòng tay",
    absoluteTitle: false,
    title: "Tự thiết kế vòng tay trầm hương",
    description:
      "Chọn từng hạt trầm tốc, trầm sánh, trầm chìm nước, charm bạc, vàng và hạt đá, xếp vòng 3D theo cỡ cổ tay, xem giá ngay và đặt hàng tại An Chi Trầm Hương.",
  },
  {
    key: "about",
    path: "/gioi-thieu",
    label: "Giới thiệu",
    absoluteTitle: true,
    title: "Giới thiệu An Chi Trầm Hương",
    description:
      "An Chi Trầm Hương bán vòng tay, nhang, nụ trầm và trầm miếng. Mỗi sản phẩm ghi rõ kích thước, xuất xứ, cách dùng; không hứa công dụng chữa bệnh hay tâm linh.",
  },
] as const satisfies readonly PageDef[];

export type SeoPageKey = (typeof SEO_PAGES)[number]["key"];

// Trang riêng tư luôn noindex trong code, CMS chỉ liệt kê để chủ shop biết, không cho bật
export const PRIVATE_PAGES = [
  { path: "/gio-hang", label: "Giỏ hàng" },
  { path: "/thanh-toan", label: "Thanh toán" },
  { path: "/don-hang/<mã>", label: "Đơn hàng đã đặt" },
  { path: "/tra-cuu-don-hang", label: "Tra cứu đơn hàng" },
  { path: "/dang-nhap", label: "Đăng nhập" },
  { path: "/dang-ky", label: "Đăng ký" },
  { path: "/tai-khoan", label: "Tài khoản" },
] as const;

export const seoPageInput = z.object({
  metaTitle: optionalText.refine((v) => v === null || v.length <= 120, "Tiêu đề tối đa 120 ký tự"),
  metaDescription: optionalText.refine((v) => v === null || v.length <= 300, "Mô tả tối đa 300 ký tự"),
  noindex: z.boolean().default(false),
  // Chia sẻ mạng xã hội. Trống thì dùng tiêu đề, mô tả trên Google và ảnh mặc định của site
  ogTitle: optionalText.refine((v) => v === null || v.length <= 120, "Tiêu đề chia sẻ tối đa 120 ký tự"),
  ogDescription: optionalText.refine((v) => v === null || v.length <= 300, "Mô tả chia sẻ tối đa 300 ký tự"),
  ogImageUrl: optionalImageUrl,
});

type Override = z.infer<typeof seoPageInput>;
const stored = z.record(z.string(), seoPageInput);

const KEY = "seo-pages";

export function isSeoPageKey(key: string): key is SeoPageKey {
  return SEO_PAGES.some((page) => page.key === key);
}

async function readOverrides(): Promise<Record<string, Override>> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  const parsed = stored.safeParse(row?.value ?? {});
  return parsed.success ? parsed.data : {};
}

const blank: Override = { metaTitle: null, metaDescription: null, noindex: false, ogTitle: null, ogDescription: null, ogImageUrl: null };

// Cho CMS: mặc định để làm placeholder, kèm giá trị đã sửa. Gộp với blank để bản lưu trước khi có trường OG vẫn đủ trường
export async function adminSeoPages() {
  const overrides = await readOverrides();
  return {
    pages: SEO_PAGES.map((page) => ({ ...page, ...blank, ...overrides[page.key] })),
    privatePages: PRIVATE_PAGES,
  };
}

export async function saveSeoPage(key: SeoPageKey, input: Override) {
  const overrides = await readOverrides();
  const value = { ...overrides, [key]: input };
  await prisma.setting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
}

// Cho web: giá trị đã gộp, trường trống thì dùng mặc định
export async function publicSeoPages() {
  const overrides = await readOverrides();
  return Object.fromEntries(
    SEO_PAGES.map((page) => {
      const o = { ...blank, ...overrides[page.key] };
      return [
        page.key,
        {
          title: o.metaTitle ?? page.title,
          description: o.metaDescription ?? page.description,
          absoluteTitle: page.absoluteTitle,
          noindex: o.noindex,
          ogTitle: o.ogTitle,
          ogDescription: o.ogDescription,
          ogImageUrl: o.ogImageUrl,
        },
      ];
    }),
  );
}
