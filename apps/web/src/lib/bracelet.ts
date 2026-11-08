import type { Bead } from "./api";

// Ba nhóm trong kho hạt. Hạt trầm chọn theo cỡ rồi theo loại trầm, hai nhóm còn lại xem cả danh sách
export const beadTabs = [
  { id: "tram", label: "Hạt trầm" },
  { id: "charm", label: "Charm" },
  { id: "da", label: "Hạt đá" },
] as const;

export type BeadTab = (typeof beadTabs)[number]["id"];

export function beadTab(bead: Bead): BeadTab {
  if (bead.kind === "CHARM") return "charm";
  // Phân theo bề mặt hạt: đá bóng là "stone", còn lại là gỗ trầm. Không dò theo tên chất liệu vì tên do shop tự đặt
  return bead.finish === "stone" ? "da" : "tram";
}

export const cm = (mm: number) => (mm / 10).toLocaleString("vi-VN", { maximumFractionDigits: 1 });

// Tên hạt bỏ phần cỡ ở cuối, vì cỡ đã chọn ở nút riêng
export const beadTitle = (bead: Bead) => bead.name.replace(/\s*\d+\s*mm$/i, "");
