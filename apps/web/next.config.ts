import type { NextConfig } from "next";

// Chỉ tối ưu ảnh từ tên miền đã khai báo, để /_next/image không thành proxy ảnh cho bất kỳ ai
const imageHosts = (process.env.IMAGE_HOSTNAMES ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

// HSTS chỉ khi site chạy https, để bản LAN, dev qua http không bị trình duyệt ép sang https
const https = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(https ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
  // Trình duyệt và bot vẫn gọi /favicon.ico dù trang đã khai báo icon.svg
  redirects: async () => [{ source: "/favicon.ico", destination: "/icon.svg", permanent: true }],
  // Mỗi lần build trên VPS có mã riêng (scripts/update.sh đặt). Tab đang mở bản cũ bấm sang trang khác
  // sẽ tải lại hẳn trang thay vì ghép JS mới với HTML cũ
  // start.cmd lan đặt LAN_HOST để máy khác trong mạng tải được JS lúc chạy dev
  allowedDevOrigins: process.env.LAN_HOST ? [process.env.LAN_HOST] : undefined,
  deploymentId: process.env.DEPLOYMENT_ID || undefined,
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https", hostname })),
    // Ảnh trang chủ có ?v= theo lần tải; ảnh tĩnh khác không có query
    localPatterns: [{ pathname: "/api/site-images/**" }, { pathname: "/**", search: "" }],
  },
  experimental: {
    // Trên ổ ExFAT, macOS sinh file ._* trong thư mục cache và Turbopack không đọc được,
    // khiến từ lần chạy thứ hai trở đi bị lỗi "Failed to open database".
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
