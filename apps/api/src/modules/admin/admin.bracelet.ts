import express, { Router } from "express";
import { z } from "zod";
import { imageInfo } from "../../lib/image.js";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/errors.js";

export const adminBraceletRouter = Router();

// Quy cách ảnh vân, CMS cũng kiểm theo đúng các số này trước khi gửi
export const TEXTURE_SPEC = { side: 1024, maxBytes: 3_000_000 } as const;

// Mỗi chất liệu đang có trong kho hạt kèm ảnh vân nếu đã tải
adminBraceletRouter.get("/bead-textures", async (_req, res) => {
  const [groups, textures] = await Promise.all([
    prisma.bead.groupBy({ by: ["material", "finish"], _count: { _all: true }, _min: { sizeMm: true }, _max: { sizeMm: true } }),
    prisma.beadTexture.findMany({ select: { id: true, material: true, roughness: true, updatedAt: true } }),
  ]);
  const byMaterial = new Map(textures.map((t) => [t.material, t]));
  const materials = new Map<string, { material: string; finish: string; beads: number; minMm: number; maxMm: number }>();
  for (const g of groups) {
    const row = materials.get(g.material);
    const count = g._count._all;
    if (!row || count > row.beads) materials.set(g.material, { material: g.material, finish: g.finish, beads: (row?.beads ?? 0) + count, minMm: Math.min(row?.minMm ?? Infinity, g._min.sizeMm ?? 0), maxMm: Math.max(row?.maxMm ?? 0, g._max.sizeMm ?? 0) });
    else row.beads += count;
  }
  const data = [...materials.values()]
    .sort((a, b) => a.material.localeCompare(b.material, "vi"))
    .map((m) => {
      const t = byMaterial.get(m.material);
      return { ...m, texture: t ? { id: t.id, version: t.updatedAt.getTime(), roughness: t.roughness, updatedAt: t.updatedAt } : null };
    });
  res.json({ data });
});

async function knownMaterial(material: string) {
  const [bead, raw] = await Promise.all([prisma.bead.findFirst({ where: { material }, select: { id: true } }), prisma.material.findFirst({ where: { beadMaterial: material }, select: { id: true } })]);
  if (!bead && !raw) throw new HttpError(404, "Chưa có hạt nào thuộc chất liệu này.", "NOT_FOUND");
}

const roughnessQuery = z.coerce.number().min(0).max(1);

adminBraceletRouter.put(
  "/bead-textures/:material",
  express.raw({ type: ["image/webp", "image/png"], limit: TEXTURE_SPEC.maxBytes }),
  async (req, res) => {
    const material = String(req.params.material);
    await knownMaterial(material);
    if (!Buffer.isBuffer(req.body) || !req.body.length) throw new HttpError(400, "Chưa nhận được ảnh. Ảnh cần là WebP hoặc PNG.", "BAD_IMAGE");
    const info = imageInfo(req.body);
    if (!info) throw new HttpError(400, "File không phải ảnh WebP hoặc PNG hợp lệ.", "BAD_IMAGE");
    if (info.width !== info.height || info.width !== TEXTURE_SPEC.side) throw new HttpError(400, `Ảnh vân cần đúng ${TEXTURE_SPEC.side}×${TEXTURE_SPEC.side} px.`, "BAD_IMAGE_SIZE");
    const roughness = roughnessQuery.parse(req.query.roughness ?? 0.5);
    const image = new Uint8Array(req.body);
    const saved = await prisma.beadTexture.upsert({
      where: { material },
      update: { image, mime: info.mime, roughness },
      create: { material, image, mime: info.mime, roughness },
      select: { id: true, material: true, roughness: true, updatedAt: true },
    });
    res.json({ data: { ...saved, version: saved.updatedAt.getTime() } });
  },
);

adminBraceletRouter.patch("/bead-textures/:material", async (req, res) => {
  const { roughness } = z.object({ roughness: roughnessQuery }).parse(req.body);
  const saved = await prisma.beadTexture.update({ where: { material: String(req.params.material) }, data: { roughness }, select: { id: true, roughness: true, updatedAt: true } });
  res.json({ data: { ...saved, version: saved.updatedAt.getTime() } });
});

adminBraceletRouter.delete("/bead-textures/:material", async (req, res) => {
  await prisma.beadTexture.deleteMany({ where: { material: String(req.params.material) } });
  res.status(204).end();
});
