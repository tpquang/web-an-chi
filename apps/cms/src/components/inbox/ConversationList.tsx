import { Link } from "react-router-dom";
import { channelLabel, conversationStatus, inboxViews, shortTime, type ConversationRow } from "../../lib/inbox";
import { SearchBox } from "../../pages/ProductsPage";
import { Skeleton, Tag } from "../ui/States";

type Props = {
  rows: ConversationRow[] | null;
  selectedId?: string;
  view: string;
  q: string;
  onView: (view: string) => void;
  onSearch: (q: string) => void;
  query: string;
};

export function ConversationList({ rows, selectedId, view, q, onView, onSearch, query }: Props) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-col gap-2 border-b border-line p-3">
        <SearchBox label="Tìm tên, số điện thoại, thẻ" value={q} onSearch={onSearch} />
        <div role="tablist" aria-label="Lọc hội thoại" className="flex gap-1 overflow-x-auto">
          {inboxViews.map((v) => (
            <button
              key={v.value}
              type="button"
              role="tab"
              aria-selected={view === v.value}
              onClick={() => onView(v.value)}
              className={`min-h-9 rounded-full px-3 text-sm whitespace-nowrap ${view === v.value ? "bg-wood text-on-wood" : "text-ink-2 hover:bg-paper-2"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {rows === null && [0, 1, 2].map((i) => <li key={i} className="p-3"><Skeleton className="h-14" /></li>)}
        {rows?.length === 0 && <li className="p-4 text-sm text-ink-2">Không có hội thoại nào ở mục này.</li>}
        {rows?.map((c) => (
          <li key={c.id}>
            <Link
              to={`/inbox/${c.id}${query ? `?${query}` : ""}`}
              aria-current={c.id === selectedId ? "page" : undefined}
              className={`flex flex-col gap-1 border-b border-line px-3 py-3 hover:bg-paper ${c.id === selectedId ? "bg-wood-soft" : ""}`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className={`truncate ${c.unreadForStaff ? "font-semibold" : "font-medium"}`}>{c.name}</span>
                <span className="flex-none text-xs text-ink-3">{shortTime(c.lastMessageAt)}</span>
              </span>
              <span className={`line-clamp-1 text-sm ${c.unreadForStaff ? "text-ink" : "text-ink-3"}`}>{c.lastMessage ?? "Chưa có tin nhắn"}</span>
              <span className="flex flex-wrap items-center gap-1.5">
                <Tag tone={conversationStatus[c.status].tone}>{conversationStatus[c.status].label}</Tag>
                <span className="text-xs text-ink-3">{channelLabel[c.channel]}{c.assignee ? ` · ${c.assignee.name}` : " · chưa ai nhận"}</span>
                {c.unreadForStaff > 0 && (
                  <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-wood px-1.5 text-[11px] leading-5 font-semibold text-on-wood">{c.unreadForStaff}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
