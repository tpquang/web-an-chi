import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

// Quy cách vòng tự thiết kế. Giá dịch vụ là giá tạm, chốt rồi chuyển vào Setting để sửa trong CMS
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
  extras: {
    engraving: { name: "Khắc chữ lên hạt", priceVnd: 50000, maxLength: 12 },
    giftBox: { name: "Hộp quà", priceVnd: 60000 },
    card: { name: "Thiệp viết tay", priceVnd: 20000, maxLength: 200 },
    giftWrap: { name: "Gói quà", priceVnd: 0 },
  },
} as const;

type CordId = (typeof braceletRules.cords)[number]["id"];
type FitId = (typeof braceletRules.fits)[number]["id"];
const cordIds = braceletRules.cords.map((c) => c.id) as [CordId, ...CordId[]];
const fitIds = braceletRules.fits.map((f) => f.id) as [FitId, ...FitId[]];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

export const braceletDesign = z.object({
  beads: z.array(z.string().min(1).max(80)).min(braceletRules.minBeads).max(braceletRules.maxBeads),
  cord: z.enum(cordIds),
  fit: z.enum(fitIds),
  wristCm: z.number().min(braceletRules.wristCm.min).max(braceletRules.wristCm.max),
  engraving: optionalText(braceletRules.extras.engraving.maxLength),
  giftBox: z.boolean().default(false),
  card: optionalText(braceletRules.extras.card.maxLength),
  giftWrap: z.boolean().default(false),
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
  stock: true,
  color: true,
  finish: true,
  note: true,
} as const;

export async function activeBeads(slugs?: string[]) {
  return prisma.bead.findMany({
    where: { active: true, ...(slugs ? { slug: { in: slugs } } : {}) },
    orderBy: [{ position: "asc" }, { sizeMm: "asc" }],
    select: beadSelect,
  });
}

type Bead = Awaited<ReturnType<typeof activeBeads>>[number];

export function countBeads(design: BraceletDesign) {
  const counts = new Map<string, number>();
  for (const slug of design.beads) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  return counts;
}

export function extrasVnd(design: BraceletDesign) {
  const { extras } = braceletRules;
  return (
    (design.engraving ? extras.engraving.priceVnd : 0) +
    (design.giftBox ? extras.giftBox.priceVnd : 0) +
    (design.card ? extras.card.priceVnd : 0) +
    (design.giftWrap ? extras.giftWrap.priceVnd : 0)
  );
}

// Giá một vòng: cộng giá từng hạt, phí công, dịch vụ thêm. Hạt thiếu thì trả null để báo không còn bán
export function priceBracelet(design: BraceletDesign, bySlug: Map<string, Bead>) {
  let beadsVnd = 0;
  let lengthMm = 0;
  for (const slug of design.beads) {
    const bead = bySlug.get(slug);
    if (!bead) return null;
    beadsVnd += bead.priceVnd;
    lengthMm += bead.sizeMm;
  }
  return { beadsVnd, lengthMm, unitPriceVnd: beadsVnd + braceletRules.feeVnd + extrasVnd(design) };
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
