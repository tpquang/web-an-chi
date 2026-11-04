"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { hasConversation, loadChat, subscribeChat } from "@/lib/chat-client";
import { cartHref, checkoutHref } from "@/lib/links";
import { ChatIcon } from "../icons";
import { Badge } from "../ui/button";

// Khung chat chỉ tải khi khách mở, để trang không nặng thêm
const ChatPanel = dynamic(() => import("./chat-panel").then((m) => m.ChatPanel), { ssr: false });

export function ChatLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [active, setActive] = useState(false);
  const handleRead = useCallback(() => {
    setUnread(0);
    setActive(true);
  }, []);
  const handleClose = useCallback(() => setOpen(false), []);

  // Đã có cuộc trò chuyện: lấy số tin chưa đọc và nghe tin mới để hiện số trên nút
  useEffect(() => {
    if (!hasConversation()) return;
    setActive(true);
    loadChat().then((state) => state && setUnread(state.conversation.unreadForCustomer));
    return subscribeChat((message) => {
      if (message.sender === "STAFF") setUnread((n) => n + 1);
    });
  }, []);

  // Khu đặt hàng giữ gọn: chỉ hiện nút chat khi khách đã đang trò chuyện
  if ((pathname === checkoutHref || pathname === cartHref) && !active && !open) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={unread ? `Nhắn tin với shop, ${unread} tin mới` : "Nhắn tin với shop"}
          className="fixed right-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-(--z-sticky) inline-flex h-14 items-center gap-2 rounded-full bg-wood px-5 text-on-wood shadow-e3 hover:bg-wood-hover"
        >
          <ChatIcon size={22} />
          <span className="hidden font-medium sm:inline">Nhắn shop</span>
          {unread > 0 && <Badge value={unread} />}
        </button>
      )}
      {open && (
        <ChatPanel onClose={handleClose} onRead={handleRead} />
      )}
    </>
  );
}
