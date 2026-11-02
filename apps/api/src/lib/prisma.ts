import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../env.js";
import { PrismaClient } from "../generated/prisma/client.js";

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  // Không bao giờ trả hash mật khẩu ra ngoài, trừ khi truy vấn ghi rõ omit: { passwordHash: false }
  omit: { customer: { passwordHash: true } },
});
