import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "./site";

// Escape "<" để chuỗi như "</script>" trong tên sản phẩm không thoát khỏi thẻ script
export function safeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function absoluteUrl(path: string) {
  return `${site.url}${path}`;
}

// Ảnh trong JSON-LD phải là URL tuyệt đối; ảnh từ CDN đã tuyệt đối thì giữ nguyên
export function absoluteImage(url: string) {
  return /^https?:\/\//.test(url) ? url : absoluteUrl(url);
}

export const defaultOgImage = "/brand/default-og.png";

// Đơn vị đăng nội dung dùng chung cho Article và Product
export const publisherLd = {
  "@type": "Organization",
  name: site.name,
  url: absoluteUrl("/"),
  logo: { "@type": "ImageObject", url: absoluteUrl("/brand/logo-square.svg") },
};

// Cắt theo ranh giới từ, tối đa 158 ký tự
export function clampDescription(text: string, max = 158) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:\s]+$/, "")}…`;
}

type PageMeta = {
  title: string;
  description?: string | null;
  path: string;
  noindex?: boolean;
  // Tiêu đề trùng tên site thì không gắn hậu tố
  absoluteTitle?: boolean;
  image?: string | null;
  // Chữ khi chia sẻ mạng xã hội, đặt ở CMS. Trống thì dùng title, description
  ogTitle?: string | null;
  ogDescription?: string | null;
};

export function pageMeta({ title, description, path, noindex, absoluteTitle, image, ogTitle, ogDescription }: PageMeta): Metadata {
  const desc = description ? clampDescription(description) : undefined;
  const ogDesc = ogDescription ? clampDescription(ogDescription, 200) : desc;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    alternates: { canonical: absoluteUrl(path) },
    robots: noindex || !site.indexable ? { index: false, follow: true } : undefined,
    openGraph: {
      title: ogTitle || title,
      description: ogDesc,
      url: absoluteUrl(path),
      // Chỉ ảnh mặc định biết chắc cỡ 1200×630; ảnh tải lên thì để mạng xã hội tự đọc cỡ
      images: [image ? { url: image } : { url: defaultOgImage, width: 1200, height: 630 }],
    },
  };
}

export const privateMeta: Metadata = { robots: { index: false, follow: false } };

// ?trang=N: chữ số dương, trang 1 viết tường minh thì coi là URL khác nên trả 404
export function parsePage(value: string | string[] | undefined) {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d{0,3}$/.test(value) || value === "1") notFound();
  return Number(value);
}

export type Crumb = { name: string; href: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  };
}
