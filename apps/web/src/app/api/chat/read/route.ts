import { chatProxy } from "@/lib/chat-proxy";

export const POST = chatProxy("/read", { method: "POST" });
