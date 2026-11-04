import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";
import { activeBeads, beadTextures, braceletRules } from "./bracelet.service.js";

export const braceletRouter = Router();

// Kho hạt và quy cách cho trang tự thiết kế; giá, tồn kho luôn tính lại khi báo giá giỏ
braceletRouter.get("/bracelet", async (_req, res) => {
  const [beads, textures] = await Promise.all([activeBeads(), beadTextures()]);
  res.json({ data: { rules: braceletRules, beads: beads.map((bead) => ({ ...bead, texture: textures.get(bead.material) ?? null })) } });
});

// Ảnh vân vật liệu. Link có ?v= theo lần sửa nên cache được lâu
braceletRouter.get("/bead-textures/:id", async (req, res) => {
  const texture = await prisma.beadTexture.findUnique({ where: { id: req.params.id }, select: { image: true, mime: true } });
  if (!texture) throw new HttpError(404, "Không tìm thấy ảnh vân.", "NOT_FOUND");
  res.set({
    "content-type": texture.mime,
    "cache-control": "public, max-age=31536000, immutable",
    // CMS và web mở ảnh từ tên miền khác API khi chạy thử ở máy
    "cross-origin-resource-policy": "cross-origin",
  });
  res.send(Buffer.from(texture.image));
});
