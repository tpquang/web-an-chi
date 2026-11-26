import { routeProxy } from "@/lib/route-proxy";

// Trước ngày mở bán đơn vào trạng thái "Chờ chuẩn bị"; shop tắt đặt chờ thì API từ chối
export const POST = routeProxy("/orders");
