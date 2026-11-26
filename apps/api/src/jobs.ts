import { publishOrder } from "./lib/chat-bus.js";
import { prisma } from "./lib/prisma.js";
import { expireUnpaidOrders } from "./modules/orders/order-flow.js";

const EVERY_MS = 5 * 60 * 1000;

// Việc nền chạy trong tiến trình API. Chạy nhiều tiến trình thì cần khoá (advisory lock) để không chạy trùng
export function startJobs() {
  const run = async () => {
    try {
      const codes = await expireUnpaidOrders();
      if (codes.length === 0) return;
      console.log(`Huỷ ${codes.length} đơn quá hạn thanh toán: ${codes.join(", ")}`);
      const orders = await prisma.order.findMany({ where: { code: { in: codes } }, select: { id: true, code: true, customerName: true, totalVnd: true } });
      for (const order of orders) publishOrder({ ...order, kind: "expired" });
    } catch (error) {
      console.error("Việc nền huỷ đơn quá hạn bị lỗi", error);
    }
  };
  setTimeout(run, 10_000);
  setInterval(run, EVERY_MS);
}
