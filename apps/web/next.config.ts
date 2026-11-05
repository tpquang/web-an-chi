import type { NextConfig } from "next";

// Chỉ tối ưu ảnh từ tên miền đã khai báo, để /_next/image không thành proxy ảnh cho bất kỳ ai
const imageHosts = (process.env.IMAGE_HOSTNAMES ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Mỗi lần build trên VPS có mã riêng (scripts/update.sh đặt). Tab đang mở bản cũ bấm sang trang khác
  // sẽ tải lại hẳn trang thay vì ghép JS mới với HTML cũ
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
