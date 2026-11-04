import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ConversationList } from "../components/inbox/ConversationList";
import { CustomerSide } from "../components/inbox/CustomerSide";
import { QuickRepliesModal } from "../components/inbox/QuickRepliesModal";
import { Thread } from "../components/inbox/Thread";
import { Spinner } from "../components/ui/Button";
import { ErrorState } from "../components/ui/States";
import { api, errorMessage } from "../lib/api";
import type { ChatMessage, ConversationDetail, ConversationRow } from "../lib/inbox";
import { subscribeInbox } from "../lib/inbox-stream";
import { useQueryState } from "../lib/use-query-state";

type Detail = { conversation: ConversationDetail; messages: ChatMessage[] };
type Reply = { title: string; body: string };

export function InboxPage() {
  const { id } = useParams();
  const query = useQueryState(["view", "q"] as const);
  const view = query.values.view || "all";
  const [rows, setRows] = useState<ConversationRow[] | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [managing, setManaging] = useState(false);

  const loadList = useCallback(async () => {
    try {
      setRows(await api.get<ConversationRow[]>(`/inbox/conversations?view=${view}&q=${encodeURIComponent(query.values.q)}`));
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [view, query.values.q]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    api.get<{ id: string; name: string }[]>("/inbox/staff").then(setStaff).catch(() => {});
    api.get<Reply[]>("/inbox/quick-replies").then(setReplies).catch(() => {});
  }, []);

  // Mở hội thoại thì đánh dấu đã đọc
  useEffect(() => {
    if (!id) return setDetail(null);
    setDetail(null);
    api.get<Detail>(`/inbox/conversations/${id}`).then(setDetail).catch((err) => setError(errorMessage(err)));
    api.post(`/inbox/conversations/${id}/read`, {}).catch(() => {});
  }, [id]);

  const mergeRow = useCallback((row: ConversationRow) => {
    setRows((list) => (list ? [row, ...list.filter((r) => r.id !== row.id)].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)) : list));
    setDetail((d) => (d && d.conversation.id === row.id ? { ...d, conversation: { ...d.conversation, ...row } } : d));
  }, []);

  // Tin mới đến: đưa hội thoại lên đầu, thêm tin vào khung đang mở và đánh dấu đã đọc
  useEffect(
    () =>
      subscribeInbox((event) => {
        const row = event.data.conversation as ConversationRow;
        if (event.type === "message" && event.data.message) {
          const message = event.data.message as ChatMessage;
          setDetail((d) => (d && d.conversation.id === event.conversationId && !d.messages.some((m) => m.id === message.id) ? { ...d, messages: [...d.messages, message] } : d));
          if (event.conversationId === id && message.sender === "CUSTOMER") api.post(`/inbox/conversations/${id}/read`, {}).catch(() => {});
        }
        if (row?.id) mergeRow({ ...row, unreadForStaff: event.conversationId === id ? 0 : row.unreadForStaff });
      }),
    [id, mergeRow],
  );

  return (
    <div className="-m-4 grid h-[calc(100dvh-120px)] md:-m-8 md:h-dvh md:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_300px] [&>*]:min-h-0 [&>*]:min-w-0">
      <div className={`border-r border-line bg-surface ${id ? "hidden md:flex" : "flex"} flex-col`}>
        <div className="border-b border-line px-4 pt-4 pb-2"><h1 className="font-serif text-2xl font-medium">Hộp thư</h1></div>
        {error && <div className="p-3"><ErrorState title="Chưa tải được hội thoại" desc={error} onRetry={loadList} /></div>}
        <ConversationList rows={rows} selectedId={id} view={view} q={query.values.q} onView={(v) => query.set({ view: v === "all" ? null : v })} onSearch={(q) => query.set({ q })} query={new URLSearchParams(Object.entries(query.values).filter(([, v]) => v)).toString()} />
      </div>
      {!id && <div className="hidden items-center justify-center p-8 text-ink-2 md:flex">Chọn một hội thoại bên trái để trả lời.</div>}
      {id && !detail && <div aria-busy className="flex items-center justify-center p-8 text-wood"><Spinner size={32} /></div>}
      {detail && (
        // Dưới 1180px cột thông tin khách nằm dưới khung chat; từ 1180px thành cột thứ ba
        <div className="flex min-h-0 flex-col xl:contents">
          <Thread
            conversation={detail.conversation}
            messages={detail.messages}
            quickReplies={replies}
            onManageReplies={() => setManaging(true)}
            onSent={(m) => setDetail((d) => (d && !d.messages.some((x) => x.id === m.id) ? { ...d, messages: [...d.messages, m] } : d))}
          />
          <div className="flex max-h-[40%] min-h-0 flex-col border-t border-line bg-surface xl:max-h-none xl:border-t-0 xl:border-l">
            <CustomerSide conversation={detail.conversation} staff={staff} onUpdated={mergeRow} />
          </div>
        </div>
      )}
      <QuickRepliesModal open={managing} replies={replies} onClose={() => setManaging(false)} onSaved={setReplies} />
    </div>
  );
}
