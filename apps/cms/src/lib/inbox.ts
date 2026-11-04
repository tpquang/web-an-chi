import type { OrderStatus } from "./labels";

export type ConversationStatus = "OPEN" | "PENDING" | "CLOSED";

export type ConversationRow = {
  id: string;
  channel: "WEB" | "FACEBOOK" | "ZALO";
  name: string;
  phone: string | null;
  status: ConversationStatus;
  tags: string[];
  unreadForStaff: number;
  lastMessage: string | null;
  lastMessageAt: string;
  assignee: { id: string; name: string } | null;
};

export type ChatMessage = { id: string; sender: "CUSTOMER" | "STAFF" | "SYSTEM"; body: string; createdAt: string; staff: { name: string } | null };

export type ConversationDetail = ConversationRow & {
  note: string | null;
  pageUrl: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    marketingConsent: boolean;
    orders: { id: string; code: string; totalVnd: number; status: OrderStatus; createdAt: string }[];
  } | null;
};

export const conversationStatus: Record<ConversationStatus, { label: string; tone: "warn" | "info" | "neutral" }> = {
  OPEN: { label: "Cần trả lời", tone: "warn" },
  PENDING: { label: "Chờ khách", tone: "info" },
  CLOSED: { label: "Đã xong", tone: "neutral" },
};

export const channelLabel = { WEB: "Website", FACEBOOK: "Facebook", ZALO: "Zalo" } as const;

export const inboxViews = [
  { value: "all", label: "Đang mở" },
  { value: "mine", label: "Của tôi" },
  { value: "unassigned", label: "Chưa ai nhận" },
  { value: "closed", label: "Đã xong" },
] as const;

const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" });
const day = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });

// Hôm nay hiện giờ, ngày khác hiện ngày tháng
export function shortTime(iso: string) {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? time.format(d) : day.format(d);
}

export const clockTime = (iso: string) => time.format(new Date(iso));
