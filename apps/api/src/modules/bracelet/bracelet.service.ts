import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

// Quy cách vòng tự thiết kế. Giá vòng chỉ gồm giá hạt và phí công; dây là vật tư tiêu hao, không tính vào giá
export const braceletRules = {
  wristCm: { min: 15, max: 25 },
  maxLengthMm: 300,
  minBeads: 8,
  maxBeads: 60,
  feeVnd: 0,
  leadTime: "Khoảng 2 tuần làm vòng, chưa tính thời gian giao",
  cords: [
    { id: "thun", name: "Dây thun" },
    { id: "du", name: "Dây dù thắt nút rút" },
    { id: "cuoc", name: "Dây cước bọc" },
  ],
  fits: [
    { id: "om", name: "Ôm tay", easeCm: 1 },
    { id: "vua", name: "Vừa tay", easeCm: 1.5 },
    { id: "rong", name: "Rộng", easeCm: 2 },
  ],
} as const;

type CordId = (typeof braceletRules.cords)[number]["id"];
type FitId = (typeof braceletRules.fits)[number]["id"];
const cordIds = braceletRules.cords.map((c) => c.id) as [CordId, ...CordId[]];
const fitIds = braceletRules.fits.map((f) => f.id) as [FitId, ...FitId[]];

export const braceletDesign = z.object({
  beads: z.array(z.string().min(1).max(80)).min(braceletRules.minBeads).max(braceletRules.maxBeads),
  cord: z.enum(cordIds),
  fit: z.enum(fitIds),
  wristCm: z.number().min(braceletRules.wristCm.min).max(braceletRules.wristCm.max),
});

export type BraceletDesign = z.infer<typeof braceletDesign>;

export const beadSelect = {
  id: true,
  name: true,
  slug: true,
  kind: true,
  material: true,
  sizeMm: true,
  priceVnd: true,
  stockItem: { select: { stock: true } },
  color: true,
  finish: true,
  note: true,
} as const;

// Tồn kho hạt là tồn kho nguyên liệu tương ứng trong kho. Hạt chưa gắn nguyên liệu coi như hết
export async function activeBeads(slugs?: string[]) {
  const rows = await prisma.bead.findMany({
    where: { active: true, ...(slugs ? { slug: { in: slugs } } : {}) },
    orderBy: [{ position: "asc" }, { sizeMm: "asc" }],
    select: beadSelect,
  });
  return rows.map(({ stockItem, ...bead }) => ({ ...bead, stock: stockItem?.stock ?? 0 }));
}

type Bead = Awaited<ReturnType<typeof activeBeads>>[number];

export type TextureRef = { id: string; version: number; roughness: number };

// Ảnh vân theo chất liệu, không kèm dữ liệu ảnh. version đổi mỗi lần thay ảnh để web tải lại
export async function beadTextures() {
  const rows = await prisma.beadTexture.findMany({ select: { id: true, material: true, roughness: true, updatedAt: true } });
  return new Map<string, TextureRef>(rows.map((row) => [row.material, { id: row.id, version: row.updatedAt.getTime(), roughness: row.roughness }]));
}

export function countBeads(design: BraceletDesign) {
  const counts = new Map<string, number>();
  for (const slug of design.beads) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  return counts;
}

// Giá một vòng: cộng giá từng hạt và phí công. Hạt thiếu thì trả null để báo không còn bán
export function priceBracelet(design: BraceletDesign, bySlug: Map<string, Bead>) {
  let beadsVnd = 0;
  let lengthMm = 0;
  for (const slug of design.beads) {
    const bead = bySlug.get(slug);
    if (!bead) return null;
    beadsVnd += bead.priceVnd;
    lengthMm += bead.sizeMm;
  }
  return { beadsVnd, lengthMm, unitPriceVnd: beadsVnd + braceletRules.feeVnd };
}

// Số vòng làm được tối đa theo tồn kho từng loại hạt, sau khi trừ phần các vòng khác trong giỏ đã giữ
export function maxBuildable(design: BraceletDesign, bySlug: Map<string, Bead>, reserved: Map<string, number>) {
  let max = Infinity;
  for (const [slug, count] of countBeads(design)) {
    const left = (bySlug.get(slug)?.stock ?? 0) - (reserved.get(slug) ?? 0);
    max = Math.min(max, Math.floor(Math.max(0, left) / count));
  }
  return max === Infinity ? 0 : max;
}

export function braceletName(design: BraceletDesign, bySlug: Map<string, Bead>) {
  const main = [...countBeads(design)]
    .map(([slug, count]) => ({ bead: bySlug.get(slug), count }))
    .filter((item) => item.bead?.kind === "BEAD")
    .sort((a, b) => b.count - a.count)[0]?.bead;
  return `Vòng tự thiết kế ${main ? `${main.material.toLowerCase()} ` : ""}${design.beads.length} hạt`;
}

// Bản lưu vào đơn: đủ để thợ làm lại đúng vòng kể cả khi hạt đổi tên hay ngừng bán sau này
export function designSnapshot(design: BraceletDesign, bySlug: Map<string, Bead>) {
  return {
    ...design,
    beadDetails: design.beads.map((slug) => {
      const bead = bySlug.get(slug)!;
      return { slug, name: bead.name, sizeMm: bead.sizeMm, priceVnd: bead.priceVnd };
    }),
    cordName: braceletRules.cords.find((c) => c.id === design.cord)?.name,
    fitName: braceletRules.fits.find((f) => f.id === design.fit)?.name,
  };
}
