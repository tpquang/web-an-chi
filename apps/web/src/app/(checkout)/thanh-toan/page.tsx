import { redirect } from "next/navigation";
import { checkoutHref } from "@/lib/links";

// Đặt hàng đã chuyển vào bảng giỏ trượt. Giữ đường dẫn cũ (link đã lưu, tab đang mở) và đưa về giỏ hàng mở sẵn bước đặt hàng
export default function CheckoutPage() {
  redirect(checkoutHref);
}
