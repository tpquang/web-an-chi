import { api } from "./api";
import type { Material, Recipe } from "./batch";

export type MaterialRow = Material & {
  note: string | null;
  _count: { components: number };
  model: { fileName: string; size: number; updatedAt: string } | null;
  texture: { id: string; version: number; roughness: number; updatedAt: string } | null;
};

export const materialKinds = [
  { value: "GENERAL", label: "Nguyên liệu khác", unit: "cái" },
  { value: "BEAD", label: "Hạt trầm", unit: "viên" },
  { value: "CHARM", label: "Charm", unit: "cái" },
] as const;
export type RecipeRow = Omit<Recipe, "components"> & { type: import("./labels").ProductType; customPriceVnd: number | null; unitCostVnd: number | null; canPack: number; materialCostVnd: number; components: { quantity: number; material: Material }[] };

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
