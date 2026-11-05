import { MovementType, ProductType, type Prisma } from "../generated/prisma/client.js";
import { HttpError } from "../middleware/errors.js";
import { customBraceletPrice } from "./pricing.js";
import { prisma } from "./prisma.js";

// Tồn kho khi bán:
// - Sản phẩm kinh doanh đã đóng gói: trừ Product.stock.
// - Vòng xâu hạt đóng sẵn và vòng tự thiết kế: trừ thẳng hạt trong kho nguyên liệu.
//   Hạt chỉ có một tồn kho là Material.stock; số vòng còn bán được tính từ số hạt.

type Db = Prisma.TransactionClient | typeof prisma;

export type StockItem = { productId?: string | null; beads?: string[] | null; quantity: number; label: string };

type Needs = { materials: Map<string, number>; products: Map<string, number> };

const add = (map: Map<string, number>, key: string, qty: number) => map.set(key, (map.get(key) ?? 0) + qty);

// Quy mỗi dòng ra số nguyên liệu và thành phẩm cần
export async function stockNeeds(db: Db, items: StockItem[]): Promise<Needs> {
  const needs: Needs = { materials: new Map(), products: new Map() };
  const slugs = [...new Set(items.flatMap((i) => i.beads ?? []))];
  const productIds = [...new Set(items.flatMap((i) => (i.productId && !i.beads ? [i.productId] : [])))];
  const [beads, products] = await Promise.all([
    slugs.length ? db.bead.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true, materialId: true } }) : [],
    productIds.length
      ? db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, type: true, components: { select: { materialId: true, quantity: true } } } })
      : [],
  ]);
  const beadMaterial = new Map(beads.map((b) => [b.slug, b]));
  const productById = new Map(products.map((p) => [p.id, p]));

  for (const item of items) {
    if (item.beads) {
      for (const slug of item.beads) {
        const bead = beadMaterial.get(slug);
        if (!bead?.materialId) throw new HttpError(409, `Hạt trong "${item.label}" chưa gắn với nguyên liệu trong kho.`, "BEAD_NO_STOCK");
        add(needs.materials, bead.materialId, item.quantity);
      }
      continue;
    }
    const product = item.productId ? productById.get(item.productId) : null;
    if (!product) continue;
    if (product.type === ProductType.CUSTOM) for (const c of product.components) add(needs.materials, c.materialId, c.quantity * item.quantity);
    else add(needs.products, product.id, item.quantity);
  }
  return needs;
}

// direction -1 là trừ kho khi bán, +1 là trả lại khi huỷ. Trừ có điều kiện để hai đơn cùng lúc không làm kho âm
export async function applyStock(tx: Prisma.TransactionClient, needs: Needs, direction: 1 | -1, ref: { orderId: string; note: string }) {
  const type = direction < 0 ? MovementType.SALE : MovementType.RETURN;
  for (const [id, qty] of needs.materials) {
    const where = direction < 0 ? { id, stock: { gte: qty } } : { id };
    const { count } = await tx.material.updateMany({ where, data: { stock: { increment: qty * direction } } });
    if (count === 0) {
      const m = await tx.material.findUnique({ where: { id }, select: { name: true, stock: true, unit: true } });
      throw new HttpError(409, `Không đủ ${m?.name ?? "nguyên liệu"}: cần ${qty} ${m?.unit ?? ""}, kho còn ${m?.stock ?? 0}.`, "NOT_ENOUGH_STOCK");
    }
    const m = await tx.material.findUniqueOrThrow({ where: { id }, select: { avgCostVnd: true } });
    await tx.stockMovement.create({ data: { type, materialId: id, quantity: qty * direction, unitCostVnd: m.avgCostVnd, orderId: ref.orderId, note: ref.note } });
  }
  for (const [id, qty] of needs.products) {
    const where = direction < 0 ? { id, stock: { gte: qty } } : { id };
    const { count } = await tx.product.updateMany({ where, data: { stock: { increment: qty * direction } } });
    if (count === 0) {
      const p = await tx.product.findUnique({ where: { id }, select: { name: true, stock: true } });
      throw new HttpError(409, `"${p?.name ?? "Sản phẩm"}" chỉ còn ${p?.stock ?? 0}.`, "NOT_ENOUGH_STOCK");
    }
    const p = await tx.product.findUniqueOrThrow({ where: { id }, select: { unitCostVnd: true } });
    await tx.stockMovement.create({ data: { type, productId: id, quantity: qty * direction, unitCostVnd: p.unitCostVnd ?? 0, orderId: ref.orderId, note: ref.note } });
  }
}

// Giá vốn một đơn vị lúc bán: thành phẩm lấy giá vốn bình quân, vòng xâu hạt và vòng tự thiết kế cộng giá vốn từng hạt
export async function unitCosts(db: Db, items: StockItem[]) {
  const costs: number[] = [];
  for (const item of items) {
    const needs = await stockNeeds(db, [{ ...item, quantity: 1 }]);
    const [materials, products] = await Promise.all([
      db.material.findMany({ where: { id: { in: [...needs.materials.keys()] } }, select: { id: true, avgCostVnd: true } }),
      db.product.findMany({ where: { id: { in: [...needs.products.keys()] } }, select: { id: true, unitCostVnd: true } }),
    ]);
    costs.push(
      materials.reduce((sum, m) => sum + m.avgCostVnd * (needs.materials.get(m.id) ?? 0), 0) +
        products.reduce((sum, p) => sum + (p.unitCostVnd ?? 0) * (needs.products.get(p.id) ?? 0), 0),
    );
  }
  return costs;
}

// Vòng xâu hạt đóng sẵn: số còn bán được tính từ số hạt trong kho
export async function withLiveStock<T extends { id: string; type: ProductType; stock: number }>(db: Db, products: T[]): Promise<T[]> {
  const custom = products.filter((p) => p.type === ProductType.CUSTOM).map((p) => p.id);
  if (custom.length === 0) return products;
  const rows = await db.productComponent.findMany({ where: { productId: { in: custom } }, select: { productId: true, quantity: true, material: { select: { stock: true } } } });
  const stock = new Map<string, number>();
  for (const r of rows) stock.set(r.productId, Math.min(stock.get(r.productId) ?? Infinity, Math.floor(r.material.stock / r.quantity)));
  return products.map((p) => (p.type === ProductType.CUSTOM ? { ...p, stock: Number.isFinite(stock.get(p.id)) ? stock.get(p.id)! : 0 } : p));
}

// Giá vòng xâu hạt theo bảng giá hạt hiện tại. Gọi sau mỗi lần giá hạt đổi (nhập kho có % lãi, seed)
export async function syncCustomPrices(db: Db) {
  const products = await db.product.findMany({
    where: { type: ProductType.CUSTOM },
    select: { id: true, priceVnd: true, components: { select: { quantity: true, material: { select: { beads: { select: { priceVnd: true }, take: 1 } } } } } },
  });
  for (const p of products) {
    const priceVnd = customBraceletPrice(p.components);
    if (priceVnd !== p.priceVnd) await db.product.update({ where: { id: p.id }, data: { priceVnd } });
  }
}
