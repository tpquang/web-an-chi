// Xem trước vốn, giá vốn và số thành phẩm của một đợt nhập nguyên liệu thô.
// Công thức chia chi phí giống apps/api/src/lib/inventory.ts (API dùng khi nhập kho thật); sửa thì sửa cả hai.
// Chi phí vận hành ban đầu (setup, lương, mặt bằng) không tính ở đây.

export type BatchStatus = "PLANNED" | "ORDERED" | "RECEIVED";

export type MaterialKind = "GENERAL" | "BEAD" | "CHARM";
export type Material = { id: string; name: string; group: import("./labels").MaterialGroup; kind: MaterialKind; markupPct: number | null; unit: string; unitsPerKg: number | null; beadMaterial: string | null; stock: number; avgCostVnd: number };

export type Recipe = {
  id: string;
  name: string;
  priceVnd: number;
  stock: number;
  components: { quantity: number; material: { id: string; name: string; unit: string } }[];
};

export type LineInput = { materialId: string; quantity: number | null; totalCostVnd: number | null; inputKg: number | null; pricePerKgVnd: number | null };
export type WriteOffInput = { materialId: string; quantity: number | null; reason: string };
export type PlanInput = { productId: string; quantity: number };

export type BatchInput = {
  name: string;
  supplierId: string | null;
  orderedAt: string | null;
  status: BatchStatus;
  capitalVnd: number | null;
  feePct: number;
  note: string | null;
  lines: LineInput[];
  // allocate: chia vào giá vốn. Khấu hao, chi phí khác bỏ chọn: không vào giá vốn, báo cáo tính tỉ lệ riêng
  extras: { label: string; amountVnd: number; allocate: boolean; note: string | null }[];
  writeOffs: WriteOffInput[];
  plans: PlanInput[];
};

export type MaterialCost = { materialId: string; quantityIn: number; writeOff: number; received: number; costVnd: number; unitCostVnd: number };

const num = (value: number | null | undefined) => (Number.isFinite(value) ? (value as number) : 0);

export function materialCosts(batch: BatchInput): MaterialCost[] {
  const lines = batch.lines.filter((l) => l.materialId);
  const goods = lines.reduce((sum, l) => sum + num(l.totalCostVnd), 0);
  const extras = batch.extras.filter((e) => e.allocate !== false).reduce((sum, e) => sum + num(e.amountVnd), 0);
  const map = new Map<string, MaterialCost>();
  for (const line of lines) {
    const share = goods > 0 ? num(line.totalCostVnd) / goods : 1 / lines.length;
    const entry = map.get(line.materialId) ?? { materialId: line.materialId, quantityIn: 0, writeOff: 0, received: 0, costVnd: 0, unitCostVnd: 0 };
    entry.quantityIn += num(line.quantity);
    entry.costVnd += num(line.totalCostVnd) + extras * share;
    map.set(line.materialId, entry);
  }
  for (const wo of batch.writeOffs) {
    const entry = map.get(wo.materialId);
    if (entry) entry.writeOff += num(wo.quantity);
  }
  for (const entry of map.values()) {
    entry.received = Math.max(0, entry.quantityIn - entry.writeOff);
    entry.unitCostVnd = entry.received > 0 ? entry.costVnd / entry.received : 0;
  }
  return [...map.values()];
}

export type PlanResult = {
  productId: string;
  name: string;
  quantity: number;
  max: number;
  unitCostVnd: number;
  priceVnd: number;
  revenueVnd: number;
  costVnd: number;
  feeVnd: number;
  profitVnd: number;
  profitPerUnitVnd: number;
  marginPct: number;
};

export type UsageRow = { materialId: string; name: string; unit: string; available: number; used: number; left: number; unitCostVnd: number; fromStock: boolean };

export type BatchResult = {
  costs: MaterialCost[];
  goodsVnd: number;
  extrasVnd: number;
  writeOffVnd: number;
  capitalNeededVnd: number;
  capitalGapVnd: number | null;
  plans: PlanResult[];
  usage: UsageRow[];
  revenueVnd: number;
  feeVnd: number;
  productCostVnd: number;
  profitVnd: number;
  marginPct: number;
  leftoverVnd: number;
};

// includeStock: tính cả tồn kho hiện tại khi quy đổi, cho nguyên liệu đã có sẵn như thiệp, túi
export function calcBatch(batch: BatchInput, materials: Material[], recipes: Recipe[], includeStock: boolean): BatchResult {
  const costs = materialCosts(batch);
  const byCost = new Map(costs.map((c) => [c.materialId, c]));
  const byMaterial = new Map(materials.map((m) => [m.id, m]));
  const goodsVnd = batch.lines.reduce((sum, l) => sum + num(l.totalCostVnd), 0);
  const extrasVnd = batch.extras.reduce((sum, e) => sum + num(e.amountVnd), 0);
  const writeOffVnd = costs.reduce((sum, c) => (c.quantityIn ? sum + (c.writeOff * c.costVnd) / c.quantityIn : sum), 0);
  const capitalNeededVnd = goodsVnd + extrasVnd;

  // Giá vốn mỗi đơn vị: lấy theo đợt nếu có trong đợt, không thì theo bình quân trong kho
  const unitCost = (id: string) => byCost.get(id)?.unitCostVnd ?? byMaterial.get(id)?.avgCostVnd ?? 0;
  const available = (id: string) => (byCost.get(id)?.received ?? 0) + (includeStock ? byMaterial.get(id)?.stock ?? 0 : 0);

  const remaining = new Map<string, number>();
  const take = (id: string) => remaining.get(id) ?? available(id);
  const feeRate = num(batch.feePct) / 100;

  const plans = batch.plans.flatMap((plan): PlanResult[] => {
    const recipe = recipes.find((r) => r.id === plan.productId);
    if (!recipe) return [];
    const max = Math.max(0, Math.min(...recipe.components.map((c) => Math.floor(take(c.material.id) / c.quantity))));
    const quantity = Math.max(0, num(plan.quantity));
    for (const c of recipe.components) remaining.set(c.material.id, take(c.material.id) - c.quantity * quantity);
    const unitCostVnd = recipe.components.reduce((sum, c) => sum + c.quantity * unitCost(c.material.id), 0);
    const revenueVnd = quantity * recipe.priceVnd;
    const feeVnd = revenueVnd * feeRate;
    const costVnd = quantity * unitCostVnd;
    const profitVnd = revenueVnd - feeVnd - costVnd;
    return [{
      productId: recipe.id, name: recipe.name, quantity, max, unitCostVnd, priceVnd: recipe.priceVnd,
      revenueVnd, costVnd, feeVnd, profitVnd,
      profitPerUnitVnd: quantity ? profitVnd / quantity : recipe.priceVnd * (1 - feeRate) - unitCostVnd,
      marginPct: recipe.priceVnd ? ((recipe.priceVnd * (1 - feeRate) - unitCostVnd) / recipe.priceVnd) * 100 : 0,
    }];
  });

  const ids = new Set<string>([...costs.map((c) => c.materialId), ...batch.plans.flatMap((p) => recipes.find((r) => r.id === p.productId)?.components.map((c) => c.material.id) ?? [])]);
  const usage = [...ids].map((id): UsageRow => {
    const m = byMaterial.get(id);
    const avail = available(id);
    const left = remaining.get(id) ?? avail;
    return { materialId: id, name: m?.name ?? "", unit: m?.unit ?? "", available: avail, used: avail - left, left, unitCostVnd: unitCost(id), fromStock: !byCost.has(id) };
  });

  const revenueVnd = plans.reduce((s, p) => s + p.revenueVnd, 0);
  const feeVnd = plans.reduce((s, p) => s + p.feeVnd, 0);
  const productCostVnd = plans.reduce((s, p) => s + p.costVnd, 0);
  const profitVnd = revenueVnd - feeVnd - productCostVnd;
  return {
    costs, goodsVnd, extrasVnd, writeOffVnd, capitalNeededVnd,
    capitalGapVnd: batch.capitalVnd == null ? null : batch.capitalVnd - capitalNeededVnd,
    plans, usage, revenueVnd, feeVnd, productCostVnd, profitVnd,
    marginPct: revenueVnd ? (profitVnd / revenueVnd) * 100 : 0,
    leftoverVnd: usage.filter((u) => !u.fromStock).reduce((s, u) => s + Math.max(0, u.left) * u.unitCostVnd, 0),
  };
}

// Điền "Tối đa" lần lượt từng thành phẩm theo thứ tự, phần sau dùng nguyên liệu còn lại
export function fillMax(batch: BatchInput, materials: Material[], recipes: Recipe[], includeStock: boolean): PlanInput[] {
  const plans: PlanInput[] = batch.plans.map((p) => ({ ...p, quantity: 0 }));
  for (let i = 0; i < plans.length; i++) {
    const result = calcBatch({ ...batch, plans }, materials, recipes, includeStock);
    plans[i] = { ...plans[i], quantity: result.plans.find((p) => p.productId === plans[i].productId)?.max ?? 0 };
  }
  return plans;
}
