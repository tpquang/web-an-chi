import { BatchStatus, MovementType, type Prisma } from "../generated/prisma/client.js";
import { HttpError } from "../middleware/errors.js";
import { batchMaterialCosts, movingAverage } from "./inventory.js";
import { markupPrice } from "./pricing.js";
import { syncCustomPrices } from "./stock.js";

export const batchInclude = {
  lines: { orderBy: { position: "asc" } },
  extras: { orderBy: { position: "asc" } },
  writeOffs: { orderBy: { position: "asc" } },
  plans: true,
  supplier: { select: { id: true, name: true } },
} as const satisfies Prisma.PurchaseBatchInclude;

// Nhập kho một đợt: cộng nguyên liệu đã trừ hao hụt, cập nhật giá vốn bình quân, ghi sổ kho, cập nhật giá
// hạt và charm theo % lãi, giá vòng xâu hạt. Chỉ làm được một lần. CMS (nút Nhập kho) và seed cùng gọi hàm này
export async function receiveBatch(tx: Prisma.TransactionClient, id: string) {
  const batch = await tx.purchaseBatch.findUniqueOrThrow({ where: { id }, include: batchInclude });
  if (batch.status === BatchStatus.RECEIVED) throw new HttpError(409, "Đợt này đã nhập kho rồi.", "ALREADY_RECEIVED");
  if (batch.lines.length === 0) throw new HttpError(400, "Đợt nhập chưa có nguyên liệu nào.", "EMPTY");

  const extrasVnd = batch.extras.filter((e) => e.allocate).reduce((sum, e) => sum + e.amountVnd, 0);
  const costs = batchMaterialCosts(batch.lines, extrasVnd, batch.writeOffs);
  for (const cost of costs) {
    const material = await tx.material.findUniqueOrThrow({ where: { id: cost.materialId } });
    const avgCostVnd = movingAverage(material.stock, material.avgCostVnd, cost.received, cost.unitCostVnd);
    await tx.material.update({ where: { id: material.id }, data: { stock: { increment: cost.received }, avgCostVnd } });
    // Hạt, charm có % lãi: giá bán theo giá vốn mới, có giá rồi mới hiện ở trang thiết kế vòng
    const priceVnd = material.markupPct === null ? 0 : markupPrice(avgCostVnd, material.markupPct);
    if (priceVnd > 0) await tx.bead.updateMany({ where: { materialId: material.id }, data: { priceVnd, active: true } });
    await tx.stockMovement.create({
      data: { type: MovementType.PURCHASE, materialId: material.id, quantity: cost.quantityIn, unitCostVnd: cost.unitCostVnd, batchId: batch.id, note: batch.name },
    });
  }
  for (const wo of batch.writeOffs) {
    await tx.stockMovement.create({
      data: { type: MovementType.WRITE_OFF, materialId: wo.materialId, quantity: -wo.quantity, batchId: batch.id, note: `${wo.reason} (khi nhận ${batch.name})` },
    });
  }
  await syncCustomPrices(tx);
  return tx.purchaseBatch.update({ where: { id: batch.id }, data: { status: BatchStatus.RECEIVED, receivedAt: new Date() }, include: batchInclude });
}
