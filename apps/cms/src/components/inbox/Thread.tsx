import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../../lib/api";
import { clockTime, type ChatMessage, type ConversationDetail } from "../../lib/inbox";
import { useSubmit } from "../../lib/use-submit";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Field";
import { showToast } from "../ui/Toast";

type QuickReply = { title: string; body: string };

type Props = {
  conversation: ConversationDetail;
  messages: ChatMessage[];
  quickReplies: QuickReply[];
  onSent: (message: ChatMessage) => void;
  onManageReplies: () => void;
};

// Khung trò chuyện. Gõ "/" ở đầu ô để chọn câu trả lời mẫu; Enter gửi, Shift + Enter xuống dòng
export function Thread({ conversation, messages, quickReplies, onSent, onManageReplies }: Props) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { submitting, run } = useSubmit();

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length, conversation.id]);

  useEffect(() => setDraft(""), [conversation.id]);

  const slash = draft.startsWith("/") ? draft.slice(1).toLowerCase() : null;
  const matches = slash === null ? [] : quickReplies.filter((r) => r.title.toLowerCase().includes(slash) || r.body.toLowerCase().includes(slash)).slice(0, 6);

  function pick(reply: QuickReply) {
    setDraft(reply.body.replace("{ten}", conversation.name));
    inputRef.current?.focus();
  }

  function send(event?: FormEvent) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body || slash !== null) return;
    run(async () => {
      try {
        const message = await api.post<ChatMessage>(`/inbox/conversations/${conversation.id}/messages`, { body });
        setDraft("");
        onSent(message);
      } catch (err) {
        showToast("Chưa gửi được", { type: "error", desc: errorMessage(err) });
      }
    }, "Chưa gửi được");
  }

  function onKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (matches.length > 0) pick(matches[0]);
    else send();
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <Link to="/inbox" className="mb-1 inline-flex text-sm text-ink-3 hover:text-wood md:hidden">Danh sách hội thoại</Link>
          <p className="truncate font-semibold">{conversation.name}</p>
          <p className="truncate text-[13px] text-ink-3">{[conversation.phone, conversation.pageUrl && `Đang xem ${conversation.pageUrl}`].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <ol ref={listRef} aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-paper p-4">
        {messages.map((m) => {
          const staff = m.sender === "STAFF";
          return (
            <li key={m.id} className={`flex max-w-[80%] flex-col ${staff ? "items-end self-end" : "items-start self-start"}`}>
              <span className={`rounded-2xl px-3 py-2 text-[15px] whitespace-pre-line ${staff ? "bg-wood text-on-wood" : "border border-line bg-surface"}`}>{m.body}</span>
              <span className="mt-0.5 text-xs text-ink-3">{staff && m.staff ? `${m.staff.name} · ` : ""}{clockTime(m.createdAt)}</span>
            </li>
          );
        })}
      </ol>
      <form onSubmit={send} className="relative border-t border-line p-3">
        {matches.length > 0 && (
          <ul role="listbox" aria-label="Câu trả lời mẫu" className="absolute right-3 bottom-full left-3 mb-1 max-h-60 overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-e2">
            {matches.map((r, i) => (
              <li key={r.title + i} role="option" aria-selected={i === 0}>
                <button type="button" onClick={() => pick(r)} className={`flex w-full flex-col rounded-xl px-3 py-2 text-left text-sm hover:bg-paper-2 ${i === 0 ? "bg-paper-2" : ""}`}>
                  <span className="font-medium">{r.title}</span>
                  <span className="line-clamp-1 text-ink-3">{r.body}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Textarea
          ref={inputRef}
          aria-label="Trả lời khách"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          rows={2}
          placeholder='Nhập trả lời. Gõ "/" để chèn câu mẫu'
          disabled={submitting}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <Button variant="text" size="sm" onClick={onManageReplies}>Câu trả lời mẫu</Button>
          <Button type="submit" size="sm" loading={submitting} disabled={!draft.trim() || slash !== null}>Gửi</Button>
        </div>
      </form>
    </div>
  );
}
