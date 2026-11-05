import { ProductType, PublishStatus, type Prisma } from "../generated/prisma/client.js";
import { braceletRules } from "../modules/bracelet/bracelet.service.js";

// Sản phẩm khách mua được: đã đăng, có giá, không phải hàng phát sinh nội bộ như hộp ship
export const sellableProduct = {
  status: PublishStatus.PUBLISHED,
  priceVnd: { gt: 0 },
  type: { not: ProductType.SUPPLY },
} satisfies Prisma.ProductWhereInput;

// Làm tròn lên bội 1.000đ để giá bán gọn
export const roundPrice = (vnd: number) => Math.ceil(vnd / 1000) * 1000;

// Giá theo % lãi trên giá vốn. Chưa có giá vốn thì chưa có giá
export function markupPrice(costVnd: number, markupPct: number) {
  return costVnd > 0 ? roundPrice(costVnd * (1 + markupPct / 100)) : 0;
}

type BraceletComponent = { quantity: number; material: { beads: { priceVnd: number }[] } };

// Vòng xâu hạt: giá từng hạt trong bảng giá nhân số hạt, cộng phí công, cùng cách tính với vòng tự thiết kế.
// Nguyên liệu không phải hạt (dây, chặn) chưa có giá bán nên không cộng. Hạt chưa có giá thì trả 0
export function customBraceletPrice(components: BraceletComponent[]) {
  let total = braceletRules.feeVnd;
  for (const c of components) {
    const bead = c.material.beads[0];
    if (!bead) continue;
    if (bead.priceVnd <= 0) return 0;
    total += bead.priceVnd * c.quantity;
  }
  return total;
}
