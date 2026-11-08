import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { getStore, storeInput } from "../../lib/store.js";

// Thông tin cửa hàng: liên hệ, link mạng xã hội, phí giao, đổi trả, tài khoản ngân hàng. Chỉ chủ shop sửa
export const adminStoreRouter = Router();

adminStoreRouter.get("/store", async (_req, res) => {
  res.json({ data: await getStore() });
});

adminStoreRouter.put("/store", async (req, res) => {
  const store = storeInput.parse(req.body);
  await prisma.setting.upsert({ where: { key: "store" }, update: { value: store }, create: { key: "store", value: store } });
  res.json({ data: store });
});
