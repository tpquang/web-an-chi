import { TrashIcon } from "./icons";
import { Button, ButtonLink, IconButton } from "./ui/Button";
import { confirmDialog } from "./ui/Modal";
import { showToast } from "./ui/Toast";
import { api, errorMessage } from "../lib/api";

// Nút Sửa và Xoá cuối mỗi dòng danh sách, dùng chung để mọi mục trông và hoạt động giống nhau.
// Sửa: editTo mở trang form, onEdit mở modal. Bỏ onDelete khi mục đó không cho xoá.
// editLabel "Xem" cho mục đã khoá (ví dụ đợt nhập đã nhận hàng)
export function RowActions({ name, editTo, onEdit, onDelete, editLabel = "Sửa" }: { name: string; editTo?: string; onEdit?: () => void; onDelete?: () => void; editLabel?: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {editTo && (
        <ButtonLink to={editTo} variant="outline" size="sm">
          {editLabel}
        </ButtonLink>
      )}
      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          {editLabel}
        </Button>
      )}
      {onDelete && (
        <IconButton label={`Xoá ${name}`} onClick={onDelete} className="hover:text-err">
          <TrashIcon size={18} />
        </IconButton>
      )}
    </div>
  );
}

// Hỏi lại rồi gọi DELETE. Trả true khi đã xoá để trang tải lại danh sách hoặc quay về
export async function confirmDelete({ what, name, desc, path }: { what: string; name: string; desc?: string; path: string }) {
  const ok = await confirmDialog({ title: `Xoá ${what}`, desc: desc ?? `Xoá "${name}"? Thao tác này không hoàn tác được.`, confirmLabel: `Xoá ${what}`, danger: true });
  if (!ok) return false;
  try {
    await api.delete(path);
    showToast(`Đã xoá ${what}.`);
    return true;
  } catch (err) {
    showToast(`Chưa xoá được ${what}`, { type: "error", desc: errorMessage(err) });
    return false;
  }
}
