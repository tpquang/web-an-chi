import { EventEmitter } from "node:events";
import type { Request, Response } from "express";

// Phát sự kiện chat trong bộ nhớ của tiến trình API. Chạy nhiều tiến trình thì cần đổi sang Redis
// hoặc Postgres LISTEN/NOTIFY, vì khách và nhân viên có thể nối vào hai tiến trình khác nhau.
const bus = new EventEmitter();
bus.setMaxListeners(0);

export type ChatEvent = { type: "message" | "conversation"; conversationId: string; data: unknown };

export const inboxChannel = "inbox";
export const conversationChannel = (id: string) => `conversation:${id}`;

export function publish(event: ChatEvent) {
  bus.emit(inboxChannel, event);
  bus.emit(conversationChannel(event.conversationId), event);
}

// Server-Sent Events: giữ kết nối, gửi nhịp 25 giây để proxy không cắt
export function streamEvents(req: Request, res: Response, channel: string) {
  res.status(200).set({ "content-type": "text/event-stream", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" });
  res.flushHeaders();
  res.write(": connected\n\n");
  const send = (event: ChatEvent) => res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
  const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
  bus.on(channel, send);
  req.on("close", () => {
    clearInterval(ping);
    bus.off(channel, send);
  });
}
