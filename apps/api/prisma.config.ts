import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Không dùng env() vì nó báo lỗi khi thiếu biến, kể cả với `prisma generate` lúc build
    url: process.env.DATABASE_URL ?? "",
  },
});
