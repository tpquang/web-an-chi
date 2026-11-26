import { useEffect } from "react";
import { showToast } from "../components/ui/Toast";
import { formatVnd } from "./format";
import { subscribeInbox } from "./inbox-stream";

const messages = {
  created: "Có đơn mới",
  cancelled: "Khách vừa huỷ đơn",
  expired: "Hệ thống huỷ đơn quá hạn chuyển khoản",
} as const;

// Báo ngay khi có đơn mới hoặc đơn bị huỷ, ở mọi trang CMS. Gắn một lần ở AdminLayout
export function useOrderNotices() {
  useEffect(
    () =>
      subscribeInbox((event) => {
        if (event.type !== "order") return;
        const { kind, code, customerName, totalVnd } = event.data;
        showToast(`${messages[kind]} ${code}`, { desc: `${customerName} · ${formatVnd(totalVnd)}`, type: kind === "created" ? "success" : "error" });
      }),
    [],
  );
}
