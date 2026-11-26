import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Cormorant_SC } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@/components/analytics";
import { CartLayer } from "@/components/cart/cart-drawer";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { LaunchProvider } from "@/components/launch/launch-clock";
import { SiteHeader } from "@/components/site-header";
import { getCategories, getStore } from "@/lib/api";
import { isPreLaunch, launchAtOf } from "@/lib/launch";
import { Toaster } from "@/components/ui/toast";
import { site } from "@/lib/site";
import "./globals.css";

// Chữ serif: 400 cho tiêu đề, 600 cho tiêu đề thẻ bài viết và số cần nhấn, xem .claude/skills/anchi-ui-ux/references/foundations.md
const serif = Cormorant_SC({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600"],
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
  const [categories, store] = await Promise.all([
    getCategories().then((list) => list.map(({ name, slug }) => ({ name, slug })), () => []),
    // API lỗi thì coi như đã mở bán, không khoá nút mua vì lỗi cấu hình
    getStore().catch(() => null),
  ]);
  const launchAt = launchAtOf(store);
  return (
    <html lang="vi" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <LaunchProvider at={launchAt} initialOpen={!isPreLaunch(launchAt)}>
          <SiteHeader categories={categories} />
          {children}
          <CartLayer />
          <ChatLauncher />
        </LaunchProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
