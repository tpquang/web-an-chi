import { isPreLaunch, launchDateLabel } from "@/lib/launch";
import { routeProxy } from "@/lib/route-proxy";

const placeOrder = routeProxy("/orders");

// Giao diện đã ẩn nút mua trước ngày mở bán; chặn thêm ở đây để giỏ hàng cũ hay request gửi tay không tạo được đơn
export function POST(request: Request) {
  if (isPreLaunch()) {
    return Response.json({ error: `Shop nhận đơn từ ngày ${launchDateLabel}. Giỏ hàng của bạn vẫn được giữ.` }, { status: 403 });
  }
  return placeOrder(request);
}
