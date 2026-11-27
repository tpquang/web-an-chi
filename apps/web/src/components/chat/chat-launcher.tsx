"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CHAT_OPEN_EVENT, openChatFromCart, useCartDrawerOpen } from "@/lib/cart-drawer";
import { hasConversation, loadChat, subscribeChat } from "@/lib/chat-client";
import { cartHref } from "@/lib/links";
import { ChatIcon } from "../icons";
import { Badge } from "../ui/button";

// Khung chat chỉ tải khi khách mở, để trang không nặng thêm
const ChatPanel = dynamic(() => import("./chat-panel").then((m) => m.ChatPanel), { ssr: false });

export function ChatLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [active, setActive] = useState(false);
  const cartOpen = useCartDrawerOpen();
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

  // Nút "Nhắn shop" trong bảng giỏ hàng gọi tới đây
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(CHAT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, onOpen);
  }, []);

  // Khu đặt hàng giữ gọn: chỉ hiện nút chat khi khách đã đang trò chuyện
  if (pathname === cartHref && !active && !open) return null;

  return (
    <>
      {!open && (
        // Bảng giỏ hàng đang mở: màn rộng thì nút nổi lên trên lớp nền tối, nằm bên trái bảng giỏ (rộng 440px) để không che nút Đặt hàng.
        // Màn hẹp bảng gần kín màn hình nên ẩn nút, trong bảng đã có nút "Nhắn shop"
        <button
          type="button"
          onClick={cartOpen ? openChatFromCart : () => setOpen(true)}
          aria-label={unread ? `Nhắn tin với shop, ${unread} tin mới` : "Nhắn tin với shop"}
          className={`fixed bottom-[max(16px,env(safe-area-inset-bottom))] inline-flex h-14 items-center gap-2 rounded-full bg-wood px-5 text-on-wood shadow-e3 hover:bg-wood-hover ${
            cartOpen ? "right-[calc(min(440px,92vw)+16px)] z-(--z-popover) max-md:hidden" : "right-4 z-(--z-sticky)"
          }`}
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
