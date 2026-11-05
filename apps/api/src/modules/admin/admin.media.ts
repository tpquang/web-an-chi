import express, { Router } from "express";
import { imageInfo } from "../../lib/image.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";

// Ảnh sản phẩm, ảnh bài viết. CMS nén sang WebP trước khi gửi; người dùng bỏ chọn nén thì gửi ảnh gốc PNG hoặc JPEG.
export const MEDIA_SPEC = { maxBytes: 8_000_000 } as const;

export const adminMediaRouter = Router();

adminMediaRouter.post("/media", express.raw({ type: ["image/webp", "image/png", "image/jpeg"], limit: MEDIA_SPEC.maxBytes }), async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new HttpError(400, "Chưa nhận được ảnh. Ảnh cần là WebP, PNG hoặc JPEG.", "BAD_IMAGE");
  const info = imageInfo(req.body);
  if (!info) throw new HttpError(400, "File không phải ảnh WebP, PNG hoặc JPEG hợp lệ.", "BAD_IMAGE");
  const image = new Uint8Array(req.body);
  const fileName = typeof req.query.name === "string" ? req.query.name.slice(0, 160) : null;
  const saved = await prisma.mediaImage.create({
    data: { image, mime: info.mime, width: info.width, height: info.height, size: image.length, fileName },
    select: { id: true, mime: true, width: true, height: true, size: true },
  });
  // Đường dẫn proxy của web (apps/web/src/app/api/media), dạng lưu trong sản phẩm, bài viết
  res.status(201).json({ data: { ...saved, path: `/api/media/${saved.id}` } });
});
