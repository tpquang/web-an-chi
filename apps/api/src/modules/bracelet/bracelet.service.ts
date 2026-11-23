import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

// Quy cách vòng tự thiết kế. Giá vòng chỉ gồm giá hạt và phí công; dây là vật tư tiêu hao, không tính vào giá
export const braceletRules = {
  wristCm: { min: 15, max: 25 },
  maxLengthMm: 300,
  minBeads: 8,
  maxBeads: 60,
  // Chuỗi 108 hạt quấn 4 vòng: đúng 108 hạt trầm, gắn thêm vài charm.
  // Kèm hạt chủ, nút chặn và hai dây tua mỗi dây 3 hạt cùng loại trầm
  // accentBeads: tuỳ chọn hạt chủ và tua (1 hạt chủ + 2 dây × 3 hạt) tính thêm chừng này hạt trầm chính
  mala: { beads: 108, wraps: [4], maxCharms: 12, maxLengthMm: 1400, accentBeads: 7 },
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

export const braceletDesign = z
  .object({
    beads: z.array(z.string().min(1).max(80)).min(braceletRules.minBeads).max(braceletRules.mala.beads + braceletRules.mala.maxCharms),
    cord: z.enum(cordIds),
    fit: z.enum(fitIds),
    wristCm: z.number().min(braceletRules.wristCm.min).max(braceletRules.wristCm.max),
    wraps: z.literal(4).optional(),
    // Chuỗi có hạt chủ và hai dây tua
    accent: z.boolean().optional(),
  })
  .refine((d) => (d.wraps ? d.beads.length >= braceletRules.mala.beads : d.beads.length <= braceletRules.maxBeads), {
    message: "Số hạt không hợp với kiểu vòng",
    path: ["beads"],
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

export type TextureRef = { id: string; version: number; roughness: number; brightness: number; thumb: boolean };

// Ảnh vân theo chất liệu, không kèm dữ liệu ảnh. version đổi mỗi lần thay ảnh để web tải lại
export async function beadTextures() {
  const rows = await prisma.beadTexture.findMany({ select: { id: true, material: true, roughness: true, brightness: true, thumbMime: true, updatedAt: true } });
  return new Map<string, TextureRef>(
    rows.map((row) => [row.material, { id: row.id, version: row.updatedAt.getTime(), roughness: row.roughness, brightness: row.brightness, thumb: Boolean(row.thumbMime) }]),
  );
}

// Hạt chủ và hạt tua dùng loại hạt nhiều nhất trên chuỗi
function accentSlug(design: BraceletDesign) {
  if (!design.wraps || !design.accent) return null;
  const counts = new Map<string, number>();
  for (const slug of design.beads) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// Số hạt mỗi loại cần để làm vòng, kể cả hạt chủ và hạt tua
export function countBeads(design: BraceletDesign) {
  const counts = new Map<string, number>();
  for (const slug of design.beads) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  const accent = accentSlug(design);
  if (accent) counts.set(accent, (counts.get(accent) ?? 0) + braceletRules.mala.accentBeads);
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
  const accent = accentSlug(design);
  if (accent) beadsVnd += (bySlug.get(accent)?.priceVnd ?? 0) * braceletRules.mala.accentBeads;
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
  if (design.wraps) return `Chuỗi ${braceletRules.mala.beads} hạt ${main ? `${main.material.toLowerCase()} ` : ""}quấn ${design.wraps} vòng${design.accent ? " có hạt chủ và tua" : ""}`;
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
