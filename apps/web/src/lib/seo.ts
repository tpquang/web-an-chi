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
  image?: string;
};

export function pageMeta({ title, description, path, noindex, absoluteTitle, image }: PageMeta): Metadata {
  const desc = description ? clampDescription(description) : undefined;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    alternates: { canonical: absoluteUrl(path) },
    robots: noindex || !site.indexable ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description: desc,
      url: absoluteUrl(path),
      images: [{ url: image ?? "/brand/default-og.png", width: 1200, height: 630 }],
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
