import "server-only";
import { getSeoPages, type SeoPage } from "./api";
import { pageMeta } from "./seo";

// SEO của trang không có slug, sửa ở CMS > Cài đặt SEO. Bản dưới đây là mặc định trong code,
// dùng khi API lỗi để trang vẫn có title. Phải khớp SEO_PAGES trong apps/api/src/lib/seo-pages.ts
// Mặc định không có chữ, ảnh chia sẻ riêng: dùng title, description và ảnh OG mặc định của site
const noOg = { ogTitle: null, ogDescription: null, ogImageUrl: null };

export const PAGE_SEO_DEFAULTS = {
  home: {
    title: "Trầm hương tự nhiên Hương Khê, Hà Tĩnh | An Chi Trầm Hương",
    description:
      "Nhang trầm, nụ trầm và vòng tay trầm hương tự nhiên từ vùng Phúc Trạch, Hương Khê, Hà Tĩnh. Ghi rõ thành phần, kích thước, cách dùng. Giao hàng toàn quốc.",
    absoluteTitle: true,
    noindex: false,
    ...noOg,
  },
  products: {
    title: "Sản phẩm trầm hương",
    description:
      "Tất cả sản phẩm trầm hương tại An Chi: vòng tay, nhang, nụ trầm, trầm miếng và lư xông. Mỗi sản phẩm ghi rõ kích thước, xuất xứ và giá.",
    absoluteTitle: false,
    noindex: false,
    ...noOg,
  },
  posts: {
    title: "Bài viết về trầm hương",
    description:
      "Kiến thức trầm hương, cách phân biệt trầm thật, hướng dẫn đốt nhang, xông nụ, bảo quản vòng tay và chuẩn bị trầm cho các dịp lễ trong năm.",
    absoluteTitle: false,
    noindex: false,
    ...noOg,
  },
  bracelet: {
    title: "Tự thiết kế vòng tay trầm hương",
    description:
      "Chọn từng hạt trầm tốc, trầm sánh, trầm chìm nước, charm bạc, vàng và hạt đá, xếp vòng 3D theo cỡ cổ tay, xem giá ngay và đặt hàng tại An Chi Trầm Hương.",
    absoluteTitle: false,
    noindex: false,
    ...noOg,
  },
  about: {
    title: "Giới thiệu An Chi Trầm Hương",
    description:
      "An Chi Trầm Hương bán vòng tay, nhang, nụ trầm và trầm miếng. Mỗi sản phẩm ghi rõ kích thước, xuất xứ, cách dùng; không hứa công dụng chữa bệnh hay tâm linh.",
    absoluteTitle: true,
    noindex: false,
    ...noOg,
  },
} satisfies Record<string, SeoPage>;

export type PageSeoKey = keyof typeof PAGE_SEO_DEFAULTS;

// API lỗi thì dùng mặc định: thiếu cài đặt SEO không đáng làm trang 500
export async function pageSeo(key: PageSeoKey): Promise<SeoPage> {
  const pages = await getSeoPages().catch(() => null);
  return pages?.[key] ?? PAGE_SEO_DEFAULTS[key];
}

// Metadata cho trang tĩnh. page > 1 là trang phân trang của danh sách
export async function staticPageMeta(key: PageSeoKey, path: string, page = 1) {
  const seo = await pageSeo(key);
  return pageMeta({
    title: page > 1 ? `${seo.title}, trang ${page}` : seo.title,
    absoluteTitle: seo.absoluteTitle,
    description: seo.description,
    path,
    noindex: seo.noindex,
    image: seo.ogImageUrl,
    ogTitle: seo.ogTitle,
    ogDescription: seo.ogDescription,
  });
}
