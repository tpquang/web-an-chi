"use client";

import { openChatFromCart } from "@/lib/cart-drawer";
import { Button } from "./ui/button";

// Nút mở khung chat với shop, dùng ở trang server component (trang tự soạn có nút "#chat")
export function OpenChatButton({ children }: { children: string }) {
  return <Button onClick={openChatFromCart}>{children}</Button>;
}
