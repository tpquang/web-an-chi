// Dữ liệu cho CMS > Cài đặt SEO. Danh sách trang cố định lấy từ API (apps/api/src/lib/seo-pages.ts)

export type SeoPage = {
  key: string;
  path: string;
  label: string;
  absoluteTitle: boolean;
  // Mặc định trong code
  title: string;
  description: string;
  // Giá trị đã sửa trong CMS, null là dùng mặc định
  metaTitle: string | null;
  metaDescription: string | null;
  noindex: boolean;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
};

export type SeoPages = { pages: SeoPage[]; privatePages: { path: string; label: string }[] };

export const SITE_SUFFIX = " | An Chi Trầm Hương";

// Trang có slug cài SEO trong form của từng mục
export const CONTENT_SEO = [
  { label: "Sản phẩm", pattern: "/san-pham/<slug>", to: "/products" },
  { label: "Danh mục sản phẩm", pattern: "/danh-muc/<slug>", to: "/categories" },
  { label: "Bài viết", pattern: "/bai-viet/<slug>", to: "/posts" },
  { label: "Chủ đề bài viết", pattern: "/chu-de/<slug>", to: "/post-categories" },
] as const;
