import { chatProxy } from "@/lib/chat-proxy";

export const POST = chatProxy("/messages", { method: "POST" });
