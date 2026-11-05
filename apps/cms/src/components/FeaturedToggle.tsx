import { useState } from "react";
import { api, errorMessage } from "../lib/api";
import { showToast } from "./ui/Toast";

// Bật tắt nổi bật trang chủ ngay trên danh sách. API chặn khi đã đủ chỗ (4 sản phẩm, 3 bài viết) và trả câu báo lỗi
export function FeaturedToggle({ kind, id, name, checked, onChange }: { kind: "products" | "posts"; id: string; name: string; checked: boolean; onChange(value: boolean): void }) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      await api.patch(`/${kind}/${id}/featured`, { featured: !checked });
      onChange(!checked);
      showToast(!checked ? "Đã đưa lên trang chủ." : "Đã bỏ khỏi trang chủ.", { desc: "Website cập nhật trong khoảng một phút." });
    } catch (err) {
      showToast("Chưa đổi được", { type: "error", desc: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`Nổi bật ở trang chủ: ${name}`}
      disabled={busy}
      onClick={toggle}
      className="inline-flex min-h-11 items-center"
    >
      <span className={`relative h-6 w-10 flex-none rounded-full transition-colors duration-(--d-fast) ${busy ? "opacity-60" : ""} ${checked ? "bg-wood" : "bg-line-strong"}`}>
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-e1 transition-transform duration-(--d-fast) ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}
