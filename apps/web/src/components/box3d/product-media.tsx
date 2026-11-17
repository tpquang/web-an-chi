"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import type { Product3DModel } from "@/lib/api";
import type { SceneModel } from "./model-scene";

// three.js chỉ nạp khi khách bấm một nút 3D
const ModelScene = dynamic(() => import("./model-scene").then((m) => m.ModelScene), { ssr: false });

// Mỗi mẫu 3D của sản phẩm có những khung xem nào. Hộp tròn nụ trầm: xem riêng hộp và riêng nụ
const views: Record<Product3DModel, { id: SceneModel; label: string; alt: string }[]> = {
  ROUND_BOX: [
    { id: "box", label: "Hộp 3D", alt: "Hộp tròn" },
    { id: "cone", label: "Nụ 3D", alt: "Nụ trầm hình chóp, cao 38 mm, đường kính 14 mm" },
  ],
};

const segment =
  "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-medium whitespace-nowrap text-ink-2 transition-colors duration-(--d-fast) hover:text-ink aria-pressed:bg-wood aria-pressed:text-on-wood";

// Ảnh sản phẩm kèm nút xem 3D. Ảnh vẫn dựng ở server, khung 3D chỉ có khi khách bấm
export function ProductMedia({ model, name, children }: { model: Product3DModel; name: string; children: ReactNode }) {
  const [view, setView] = useState<"image" | SceneModel>("image");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const current = views[model].find((v) => v.id === view);

  function show(next: "image" | SceneModel) {
    if (next === view) return;
    setStatus("loading");
    setView(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div hidden={view !== "image"}>{children}</div>
      {current && (
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-paper-2">
          {status === "loading" && <div aria-hidden className="absolute inset-0 animate-pulse bg-paper-2" />}
          {status === "error" ? (
            <p role="alert" className="absolute inset-0 flex items-center justify-center p-6 text-center text-ink-2">
              Chưa tải được hình 3D. Bạn thử lại sau hoặc xem ảnh sản phẩm.
            </p>
          ) : (
            <ModelScene key={current.id} model={current.id} label={`${current.alt}, ${name}, hình 3D xoay được`} onReady={() => setStatus("ready")} onError={() => setStatus("error")} />
          )}
          {status === "ready" && (
            <p aria-hidden className="pointer-events-none absolute top-3 left-3 rounded-full bg-surface/90 px-3 py-1 text-xs text-ink-2 shadow-e1">
              <span className="pointer-coarse:hidden">Kéo để xoay · cuộn để phóng to</span>
              <span className="hidden pointer-coarse:inline">Kéo để xoay · chụm hai ngón để phóng to</span>
            </p>
          )}
        </div>
      )}

      {/* Nút nằm dưới khung để không che mô hình trên màn hình nhỏ */}
      <div role="group" aria-label="Cách xem sản phẩm" className="flex w-fit flex-wrap gap-1 rounded-3xl border border-line bg-surface p-1">
        <button type="button" aria-pressed={view === "image"} onClick={() => show("image")} className={segment}>
          Ảnh
        </button>
        {views[model].map((v) => (
          <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => show(v.id)} className={segment}>
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
