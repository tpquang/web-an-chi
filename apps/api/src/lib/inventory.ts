// Giá vốn nguyên liệu của một đợt nhập. CMS có bản sao cùng công thức ở apps/cms/src/lib/batch.ts để xem trước;
// sửa ở đây thì sửa cả bên đó.
//
// - Chi phí phát sinh chia cho từng dòng theo tỉ lệ thành tiền (chưa có tiền hàng thì chia đều).
// - Hao hụt không vào kho; chi phí của phần hao hụt dồn vào phần còn lại, nên giá vốn mỗi đơn vị tăng.

export type CostLine = { materialId: string; quantity: number; totalCostVnd: number };
export type CostWriteOff = { materialId: string; quantity: number };

export type MaterialCost = {
  materialId: string;
  quantityIn: number;
  writeOff: number;
  received: number;
  costVnd: number;
  unitCostVnd: number;
};

export function batchMaterialCosts(lines: CostLine[], extrasVnd: number, writeOffs: CostWriteOff[]) {
  const goods = lines.reduce((sum, line) => sum + line.totalCostVnd, 0);
  const byMaterial = new Map<string, MaterialCost>();
  for (const line of lines) {
    const share = goods > 0 ? line.totalCostVnd / goods : 1 / lines.length;
    const entry = byMaterial.get(line.materialId) ?? { materialId: line.materialId, quantityIn: 0, writeOff: 0, received: 0, costVnd: 0, unitCostVnd: 0 };
    entry.quantityIn += line.quantity;
    entry.costVnd += line.totalCostVnd + extrasVnd * share;
    byMaterial.set(line.materialId, entry);
  }
  for (const wo of writeOffs) {
    const entry = byMaterial.get(wo.materialId);
    if (entry) entry.writeOff += wo.quantity;
  }
  for (const entry of byMaterial.values()) {
    entry.received = Math.max(0, entry.quantityIn - entry.writeOff);
    entry.unitCostVnd = entry.received > 0 ? entry.costVnd / entry.received : 0;
  }
  return [...byMaterial.values()];
}

// Giá vốn bình quân sau khi nhập thêm
export function movingAverage(stock: number, avg: number, addQty: number, addUnitCost: number) {
  const total = Math.max(0, stock) + addQty;
  return total > 0 ? (Math.max(0, stock) * avg + addQty * addUnitCost) / total : addUnitCost;
}
