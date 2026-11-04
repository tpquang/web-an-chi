"use client";

import { postJson } from "./client-api";

export type ChatMessage = { id: string; sender: "CUSTOMER" | "STAFF" | "SYSTEM"; body: string; createdAt: string; staff: { name: string } | null };
export type ChatState = { conversation: { id: string; name: string; unreadForCustomer: number }; messages: ChatMessage[] };

// Cookie cờ do server đặt khi bắt đầu chat; mã bí mật thật nằm trong cookie httpOnly
export const hasConversation = () => document.cookie.split("; ").some((part) => part === "anchi-chat-on=1");

export async function loadChat(): Promise<ChatState | null> {
  const res = await fetch("/api/chat/conversation", { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return null;
  return (await res.json()).data;
}

export const startChat = (input: { name: string; phone: string; body: string }) =>
  postJson<{ id: string }>("/api/chat/start", { ...input, pageUrl: location.pathname });
export const sendChat = (body: string) => postJson<ChatMessage>("/api/chat/messages", { body });
export const markChatRead = () => postJson("/api/chat/read", {});

// Nghe tin mới qua Server-Sent Events. EventSource tự nối lại khi rớt mạng
export function subscribeChat(onMessage: (message: ChatMessage) => void) {
  const source = new EventSource("/api/chat/stream");
  source.addEventListener("message", (event) => {
    try {
      onMessage(JSON.parse((event as MessageEvent).data).data.message);
    } catch {}
  });
  return () => source.close();
}

export function mergeMessage(list: ChatMessage[], message: ChatMessage) {
  return list.some((m) => m.id === message.id) ? list : [...list, message];
}
