import { api } from "./api";
import type { Material, Recipe } from "./batch";

export type MaterialRow = Material & { note: string | null; _count: { components: number } };
export type RecipeRow = Omit<Recipe, "components"> & { unitCostVnd: number | null; canPack: number; materialCostVnd: number; components: { quantity: number; material: Material }[] };

export const loadMaterials = () => api.get<MaterialRow[]>("/materials");
export const loadRecipes = () => api.get<RecipeRow[]>("/recipes");

export const movementType = {
  PURCHASE: { label: "Nhập hàng", tone: "ok" },
  WRITE_OFF: { label: "Hao hụt", tone: "err" },
  PACK_CONSUME: { label: "Dùng đóng gói", tone: "neutral" },
  PACK_PRODUCE: { label: "Đóng thành phẩm", tone: "info" },
  ADJUST: { label: "Điều chỉnh", tone: "warn" },
} as const;

// Lý do hao hụt hay gặp, chọn nhanh trong form
export const writeOffReasons = ["Móp méo", "Vỡ, gãy", "Ẩm mốc", "Tiêu huỷ", "Thiếu so với hoá đơn"];

export function formatQty(value: number, unit: string) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value)} ${unit}`;
}
