import { useEffect, useState } from "react";
import { api } from "./api";
import { subscribeInbox } from "./inbox-stream";

// Số tin khách chưa đọc cho huy hiệu ở menu và tiêu đề tab, cập nhật khi có tin mới
export function useInboxUnread() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const refresh = () => api.get<{ unread: number }>("/inbox/unread").then((d) => setUnread(d.unread)).catch(() => {});
    refresh();
    return subscribeInbox(refresh);
  }, []);
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) An Chi CMS` : "An Chi CMS";
  }, [unread]);
  return unread;
}
