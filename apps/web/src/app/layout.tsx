import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Cormorant_SC } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@/components/analytics";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { SiteHeader } from "@/components/site-header";
import { getCategories } from "@/lib/api";
import { Toaster } from "@/components/ui/toast";
import { site } from "@/lib/site";
import "./globals.css";

const serif = Cormorant_SC({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--next-serif",
});
const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--next-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, locale: "vi_VN", type: "website" },
  // Mã xác minh Search Console dạng thẻ meta, khi không xác minh được qua DNS
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  // Bản test, dev: noindex toàn site theo biến môi trường
  robots: site.indexable ? undefined : { index: false, follow: false },
};

// Metadata không đọc được biến CSS nên phải ghi giá trị của --paper
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f1ea" }, // allow-color
    { media: "(prefers-color-scheme: dark)", color: "#15100c" }, // allow-color
  ],
};

const themeScript = `try{var t=localStorage.getItem("anchi-theme");document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  // Menu sổ xuống không được làm hỏng cả trang khi API lỗi, lỗi thì chỉ còn link "Tất cả sản phẩm"
  const categories = await getCategories().then((list) => list.map(({ name, slug }) => ({ name, slug })), () => []);
  return (
    <html lang="vi" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader categories={categories} />
        {children}
        <ChatLauncher />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
