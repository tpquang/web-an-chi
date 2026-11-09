import { useState, type FormEvent } from "react";
import { IndexSwitch } from "../components/IndexSwitch";
import { OgFields, type OgValues } from "../components/OgFields";
import { RowActions } from "../components/RowActions";
import { Button, ButtonLink } from "../components/ui/Button";
import { Field, Input, Textarea } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { DataTable, PageHeader, Panel, td, th } from "../components/ui/Page";
import { ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { CONTENT_SEO, SITE_SUFFIX, type SeoPage, type SeoPages } from "../lib/seo-pages";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "";
type Values = { metaTitle: string; metaDescription: string; noindex: boolean } & OgValues;

export function SeoPagesPage() {
  const { state, slow, reload } = useLoad(() => api.get<SeoPages>("/seo-pages"), []);
  const [editing, setEditing] = useState<{ page: SeoPage; values: Values } | null>(null);
  const { submitting, errors, setErrors, run } = useSubmit();

  function open(page: SeoPage) {
    setErrors({});
    setEditing({ page, values: { metaTitle: page.metaTitle ?? "", metaDescription: page.metaDescription ?? "", noindex: page.noindex, ogTitle: page.ogTitle ?? "", ogDescription: page.ogDescription ?? "", ogImageUrl: page.ogImageUrl ?? "" } });
  }

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setEditing((prev) => prev && { ...prev, values: { ...prev.values, [key]: value } });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    run(async () => {
      await api.put(`/seo-pages/${editing.page.key}`, editing.values);
      showToast(`Đã lưu SEO trang ${editing.page.label}.`, { desc: "Website cập nhật trong khoảng một phút." });
      setEditing(null);
      reload();
    }, "Chưa lưu được cài đặt SEO");
  }

  return (
    <>
      <PageHeader title="Cài đặt SEO" desc="Tiêu đề, mô tả trên Google và bật tắt hiện trên Google cho từng trang. Trang tắt hiện trên Google cũng bị bỏ khỏi sitemap." />
      <div className="flex flex-col gap-6">
        <Panel title="Trang cố định">
          {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton rows={5} /></div>}
          {state.status === "error" && <ErrorState title="Chưa tải được cài đặt SEO" desc={state.error} onRetry={reload} />}
          {state.status === "ready" && (
            <DataTable head={<tr><th className={th}>Trang</th><th className={th}>Tiêu đề trên Google</th><th className={th}>Trạng thái</th><th className={th}><span className="sr-only">Thao tác</span></th></tr>}>
              {state.data.pages.map((page) => (
                <tr key={page.key}>
                  <td className={td}>
                    <button type="button" onClick={() => open(page)} className="min-h-11 text-left font-medium hover:text-wood">{page.label}</button>
                    <span className="block text-[13px] text-ink-3">{page.path}</span>
                  </td>
                  <td className={td}>
                    {page.metaTitle ?? page.title}
                    {!page.metaTitle && <span className="block text-[13px] text-ink-3">Mặc định</span>}
                  </td>
                  <td className={td}>
                    <span className="flex flex-wrap gap-1">
                      {page.noindex ? <Tag tone="warn">Đang ẩn</Tag> : <Tag tone="ok">Đang hiện</Tag>}
                      {(page.ogTitle || page.ogImageUrl) && <Tag tone="info">Có ảnh, chữ chia sẻ riêng</Tag>}
                    </span>
                  </td>
                  <td className={td}><RowActions name={page.label} onEdit={() => open(page)} /></td>
                </tr>
              ))}
            </DataTable>
          )}
        </Panel>

        <Panel title="Trang theo nội dung">
          <p className="-mt-2 mb-4 text-sm text-ink-2">Mỗi sản phẩm, danh mục, bài viết, chủ đề có đường dẫn riêng nên cài SEO ngay trong form của mục đó: phần SEO có tiêu đề, mô tả và công tắc Hiện trên Google.</p>
          <DataTable head={<tr><th className={th}>Loại trang</th><th className={th}>Đường dẫn</th><th className={th}><span className="sr-only">Thao tác</span></th></tr>}>
            {CONTENT_SEO.map((item) => (
              <tr key={item.to}>
                <td className={`${td} font-medium`}>{item.label}</td>
                <td className={`${td} text-ink-3`}>{item.pattern}</td>
                <td className={`${td} text-right`}><ButtonLink to={item.to} variant="outline" size="sm">Mở danh sách</ButtonLink></td>
              </tr>
            ))}
          </DataTable>
        </Panel>

        {state.status === "ready" && (
          <Panel title="Trang riêng tư">
            <p className="-mt-2 mb-4 text-sm text-ink-2">Trang chứa thông tin của khách nên luôn ẩn khỏi Google, không đổi được.</p>
            <ul className="flex flex-col divide-y divide-line text-sm">
              {state.data.privatePages.map((page) => (
                <li key={page.path} className="flex min-h-11 items-center justify-between gap-2 py-2">
                  <span>{page.label} <span className="text-ink-3">{page.path}</span></span>
                  <Tag>Luôn ẩn</Tag>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        locked={submitting}
        wide
        title={editing ? `SEO trang ${editing.page.label}` : ""}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)} disabled={submitting}>Huỷ</Button><Button type="submit" form="seo-page-form" loading={submitting}>Lưu</Button></>}
      >
        {editing && <SeoPageForm page={editing.page} values={editing.values} set={set} errors={errors} disabled={submitting} onSubmit={submit} />}
      </Modal>
    </>
  );
}

type FormProps = {
  page: SeoPage;
  values: Values;
  set<K extends keyof Values>(key: K, value: Values[K]): void;
  errors: Record<string, string>;
  disabled: boolean;
  onSubmit(event: FormEvent): void;
};

function SeoPageForm({ page, values, set, errors, disabled, onSubmit }: FormProps) {
  // Trang có tiêu đề tuyệt đối đã gồm tên site; trang khác web tự gắn hậu tố nên phần riêng ngắn hơn
  const titleMax = page.absoluteTitle ? 65 : 45;
  const title = values.metaTitle || page.title;
  const shownTitle = page.absoluteTitle ? title : `${title}${SITE_SUFFIX}`;
  const desc = values.metaDescription || page.description;

  return (
    <form id="seo-page-form" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div data-field="metaTitle">
        <Field
          label="Tiêu đề trên Google"
          optional
          hint={page.absoluteTitle ? "Ghi đủ cả tên thương hiệu, web không tự thêm. Để trống thì dùng mặc định." : `Web tự thêm “${SITE_SUFFIX.trim()}”. Để trống thì dùng mặc định.`}
          counter={{ value: values.metaTitle.length, max: titleMax }}
          error={errors.metaTitle}
        >
          <Input value={values.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder={page.title} disabled={disabled} />
        </Field>
      </div>
      <div data-field="metaDescription">
        <Field label="Mô tả trên Google" optional hint="120–158 ký tự. Để trống thì dùng mặc định." counter={{ value: values.metaDescription.length, max: 158 }} error={errors.metaDescription}>
          <Textarea value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={3} placeholder={page.description} disabled={disabled} />
        </Field>
      </div>
      <IndexSwitch noindex={values.noindex} onChange={(v) => set("noindex", v)} disabled={disabled} />
      {page.key === "home" && values.noindex && <p role="alert" className="text-sm text-err">Ẩn trang chủ khỏi Google sẽ làm mất phần lớn lượt tìm thương hiệu. Chỉ tắt khi thật sự cần.</p>}
      <div className="rounded-lg border border-line bg-paper p-3" aria-label="Xem trước kết quả trên Google">
        <p className="text-xs text-ink-3">Xem trước trên Google</p>
        <p className="mt-1 truncate text-xs text-ink-2">{SITE_URL}{page.path === "/" ? "" : page.path}</p>
        <p className="truncate text-base font-medium text-info">{shownTitle}</p>
        <p className="line-clamp-2 text-sm text-ink-2">{desc.slice(0, 158)}</p>
      </div>
      <h3 className="mt-2 font-semibold">Chia sẻ mạng xã hội</h3>
      <OgFields values={values} set={set} fallback={{ title, description: desc, image: null, imageHint: "Để trống thì dùng ảnh mặc định của An Chi." }} disabled={disabled} />
    </form>
  );
}
