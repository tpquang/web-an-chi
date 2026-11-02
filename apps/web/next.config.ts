import type { NextConfig } from "next";

// Chỉ tối ưu ảnh từ tên miền đã khai báo, để /_next/image không thành proxy ảnh cho bất kỳ ai
const imageHosts = (process.env.IMAGE_HOSTNAMES ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: imageHosts.map((hostname) => ({ protocol: "https", hostname })),
  },
  experimental: {
    // Trên ổ ExFAT, macOS sinh file ._* trong thư mục cache và Turbopack không đọc được,
    // khiến từ lần chạy thứ hai trở đi bị lỗi "Failed to open database".
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
