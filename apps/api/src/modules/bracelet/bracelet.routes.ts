import { Router } from "express";
import { activeBeads, braceletRules } from "./bracelet.service.js";

export const braceletRouter = Router();

// Kho hạt và quy cách cho trang tự thiết kế; giá, tồn kho luôn tính lại khi báo giá giỏ
braceletRouter.get("/bracelet", async (_req, res) => {
  res.json({ data: { rules: braceletRules, beads: await activeBeads() } });
});
