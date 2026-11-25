"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/track";
import { Button } from "../ui/button";
import { PreorderDialog, type PreorderItem } from "./preorder-dialog";

type Props = {
  // Món cố định (trang sản phẩm) hoặc hàm lấy món lúc bấm (vòng tự thiết kế). Trả null thì không mở form
  item: PreorderItem | (() => PreorderItem | null);
  label?: string;
  size?: "md" | "lg";
  block?: boolean;
  className?: string;
};

// Nút "Đặt chờ" dùng trước ngày mở bán, thay chỗ nút thêm vào giỏ
export function PreorderButton({ item, label = "Đặt chờ", size = "lg", block, className }: Props) {
  const [current, setCurrent] = useState<PreorderItem | null>(null);

  function open() {
    const next = typeof item === "function" ? item() : item;
    if (!next) return;
    trackEvent("begin_preorder", { items: [{ item_id: next.slug }] });
    setCurrent(next);
  }

  return (
    <>
      <Button size={size} block={block} onClick={open} className={className}>
        {label}
      </Button>
      {current && <PreorderDialog item={current} open onClose={() => setCurrent(null)} />}
    </>
  );
}
