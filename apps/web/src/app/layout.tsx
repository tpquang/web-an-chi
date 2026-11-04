import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Noto_Serif } from "next/font/google";
import type { ReactNode } from "react";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/toast";
import { site } from "@/lib/site";
import "./globals.css";

const serif = Noto_Serif({
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
  // Bản test, dev: noindex toàn site theo biến môi trường
  robots: site.indexable ? undefined : { index: false, follow: false },
};

// Metadata không đọc được biến CSS nên phải ghi giá trị của --paper
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f3" }, // allow-color
    { media: "(prefers-color-scheme: dark)", color: "#15100c" }, // allow-color
  ],
};

const themeScript = `try{var t=localStorage.getItem("anchi-theme");document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        {children}
        <ChatLauncher />
        <Toaster />
      </body>
    </html>
  );
}
