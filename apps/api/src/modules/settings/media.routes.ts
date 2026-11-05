import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";

// Ảnh sản phẩm, bài viết tải lên từ CMS. Không bao giờ sửa ảnh cũ nên cache vĩnh viễn
export const mediaRouter = Router();

mediaRouter.get("/:id", async (req, res) => {
  const image = await prisma.mediaImage.findUnique({ where: { id: req.params.id }, select: { image: true, mime: true } });
  if (!image) throw new HttpError(404, "Không tìm thấy ảnh.", "NOT_FOUND");
  res.set({ "content-type": image.mime, "cache-control": "public, max-age=31536000, immutable", "cross-origin-resource-policy": "cross-origin" });
  res.send(Buffer.from(image.image));
});
