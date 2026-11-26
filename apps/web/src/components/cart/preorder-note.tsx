"use client";

import type { Quote } from "@/lib/client-api";
import { useLaunchLabel } from "../launch/launch-clock";

// Ghi chú dưới giỏ hàng trước ngày mở bán: đặt hàng như thường, đơn là đơn đặt chờ
export function PreorderNote({ quote, className = "" }: { quote: Quote; className?: string }) {
  const launchDateLabel = useLaunchLabel();
  if (quote.preorderClosed) {
    return (
      <p className={`rounded-xl bg-warn-soft px-4 py-3 text-sm ${className}`}>
        Shop nhận đơn từ ngày {launchDateLabel}. Giỏ hàng của bạn vẫn được giữ tới lúc đó.
      </p>
    );
  }
  if (!quote.preorder) return null;
  return (
    <p className={`rounded-xl bg-wood-soft px-4 py-3 text-sm ${className}`}>
      <span className="block font-medium text-wood">Đơn đặt chờ</span>
      Shop mở bán ngày {launchDateLabel}. Bạn đặt hàng như thường, shop chuẩn bị hàng rồi gọi xác nhận trước khi giao từ ngày này. Món tạm hết hàng shop nhập thêm cho bạn.
    </p>
  );
}
