import { Switch } from "./ui/Field";
import { Tag } from "./ui/States";

// Công tắc "Hiện trên Google" dùng chung cho mọi trang có cài SEO. Lưu ngược thành cờ noindex:
// tắt thì web gắn thẻ noindex và bỏ trang khỏi sitemap, nhưng trang vẫn mở được bằng link
export function IndexSwitch({ noindex, onChange, disabled }: { noindex: boolean; onChange(noindex: boolean): void; disabled?: boolean }) {
  return (
    <div>
      <Switch checked={!noindex} onChange={(shown) => onChange(!shown)} label="Hiện trên Google" disabled={disabled} />
      <p className="text-sm text-ink-3">
        {noindex
          ? "Đang ẩn: Google sẽ gỡ trang khỏi kết quả tìm kiếm, sitemap không có trang này. Khách vẫn mở được bằng link."
          : "Trang được Google lập chỉ mục và có trong sitemap."}
      </p>
    </div>
  );
}

// Nhãn nhỏ trong danh sách cho mục đang ẩn khỏi Google
export function NoindexTag({ noindex }: { noindex: boolean }) {
  return noindex ? <Tag tone="warn">Ẩn khỏi Google</Tag> : null;
}
