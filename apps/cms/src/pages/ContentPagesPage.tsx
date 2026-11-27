import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PlusIcon } from "../components/icons";
import { NoindexTag } from "../components/IndexSwitch";
import { ContentEditor } from "../components/post/ContentEditor";
import { SeoTab } from "../components/post/SeoTab";
import { confirmDelete, RowActions } from "../components/RowActions";
import { Button, ButtonLink } from "../components/ui/Button";
import { Field, Input, Switch, Textarea } from "../components/ui/Field";
import { confirmDialog } from "../components/ui/Modal";
import { DataTable, PageHeader, Panel, td, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { EmptyState, ErrorState, Skeleton, TableSkeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { formatDate, slugify } from "../lib/format";
import { options, publishStatus, type PublishStatus } from "../lib/labels";
import { analyzeSeo } from "../lib/seo-check";
import type { ContentPage, ContentPageRow } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

// Trang tự soạn: bảo hành, chính sách đại lý, cộng tác viên... Web hiện ở /<slug>, khung nội dung theo
// anchi-seo page-blueprints.md mục "Trang nội dung tự soạn"
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "";

export function ContentPagesPage() {
  const { state, slow, reload } = useLoad(() => api.get<ContentPageRow[]>("/pages"), []);

  return (
    <>
      <PageHeader title="Trang nội dung" actions={<ButtonLink to="/pages/new"><PlusIcon size={18} /> Tạo trang</ButtonLink>} />
      <p className="mb-4 max-w-[70ch] text-sm text-ink-2">
        Trang như bảo hành, chính sách đại lý, cộng tác viên. Bật “Hiện ở cuối trang” để có link trong footer website.
      </p>
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được trang nội dung" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.length === 0 && (
        <EmptyState title="Chưa có trang nội dung nào." desc="Tạo trang bảo hành hoặc chính sách đại lý đầu tiên." action={<ButtonLink to="/pages/new">Tạo trang</ButtonLink>} />
      )}
      {state.status === "ready" && state.data.length > 0 && (
        <DataTable head={<tr><th className={th}>Tiêu đề</th><th className={th}>Đường dẫn</th><th className={th}>Cập nhật</th><th className={th}>Trạng thái</th><th className={`${th} text-right`}>Thao tác</th></tr>}>
          {state.data.map((page) => (
            <tr key={page.id} className="hover:bg-paper">
              <td className={td}>
                <Link to={`/pages/${page.id}`} className="font-medium hover:text-wood">{page.title}</Link>
                {page.showInFooter && <span className="block text-[13px] text-ink-3">Có link ở cuối trang</span>}
              </td>
              <td className={`${td} text-ink-2`}>/{page.slug}</td>
              <td className={`${td} whitespace-nowrap`}>{formatDate(page.updatedAt)}</td>
              <td className={td}><span className="flex flex-wrap gap-1"><Tag tone={publishStatus[page.status].tone}>{publishStatus[page.status].label}</Tag><NoindexTag noindex={page.noindex} /></span></td>
              <td className={td}>
                <RowActions
                  name={page.title}
                  editTo={`/pages/${page.id}`}
                  onDelete={async () => {
                    const desc = `Xoá "${page.title}"? Link /${page.slug} sẽ trả 404. Muốn tạm gỡ thì chuyển trạng thái sang "Đã ẩn".`;
                    if (await confirmDelete({ what: "trang", name: page.title, desc, path: `/pages/${page.id}` })) reload();
                  }}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </>
  );
}

type Values = Omit<ContentPage, "id">;
const empty: Values = {
  title: "", slug: "", summary: "", content: "", status: "DRAFT", showInFooter: false, position: 0, ctaLabel: "", ctaHref: "",
  focusKeyword: "", metaTitle: "", metaDescription: "", noindex: false, ogTitle: "", ogDescription: "", ogImageUrl: "",
};
type Tab = "content" | "seo";

// SeoTab chấm điểm theo khung bài viết: tóm tắt đóng vai đoạn mô tả, trang không có ảnh bìa
const seoValues = (v: Values) => ({
  title: v.title, slug: v.slug, excerpt: v.summary ?? "", content: v.content, metaTitle: v.metaTitle ?? "", metaDescription: v.metaDescription ?? "",
  focusKeyword: v.focusKeyword ?? "", coverUrl: "", coverAlt: "", ogTitle: v.ogTitle ?? "", ogDescription: v.ogDescription ?? "", ogImageUrl: v.ogImageUrl ?? "",
});

const seoKey: Record<string, keyof Values> = { excerpt: "summary" };

export function ContentPageFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const page = useLoad(() => (id ? api.get<ContentPage>(`/pages/${id}`) : Promise.resolve(null)), [id]);
  const [values, setValues] = useState<Values>(empty);
  const [slugTouched, setSlugTouched] = useState(false);
  const [tab, setTab] = useState<Tab>("content");
  const { submitting, errors, run } = useSubmit();

  useEffect(() => {
    if (page.state.status !== "ready") return;
    // API trả null cho ô trống; form dùng chuỗi rỗng để ô nhập luôn có giá trị
    const data = page.state.data;
    setValues(data ? ({ ...empty, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ""])) } as Values) : empty);
    setSlugTouched(Boolean(data));
  }, [page.state]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value, ...(key === "title" && !slugTouched ? { slug: slugify(String(value)) } : {}) }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run(async () => {
      if (isNew) {
        const created = await api.post<{ id: string }>("/pages", values);
        showToast("Đã lưu trang.");
        navigate(`/pages/${created.id}`, { replace: true });
      } else {
        await api.put(`/pages/${id}`, values);
        showToast("Đã lưu trang.", { desc: values.status === "PUBLISHED" ? "Website cập nhật trong khoảng một phút." : undefined });
      }
    }, "Chưa lưu được trang");
  }

  async function handleDelete() {
    const ok = await confirmDialog({ title: "Xoá trang", desc: `Xoá "${values.title}"? Link /${values.slug} sẽ trả 404. Muốn tạm gỡ thì chuyển trạng thái sang "Đã ẩn".`, confirmLabel: "Xoá trang", danger: true });
    if (!ok) return;
    try {
      await api.delete(`/pages/${id}`);
      showToast("Đã xoá trang.");
      navigate("/pages");
    } catch (err) {
      showToast("Chưa xoá được trang", { type: "error", desc: errorMessage(err) });
    }
  }

  if (page.state.status === "error") return <ErrorState title="Chưa tải được trang" desc={page.state.error} onRetry={page.reload} />;
  if (page.state.status === "loading") return <Skeleton className={`h-96 ${page.slow ? "" : "invisible"}`} />;

  const seoScore = analyzeSeo(seoValues(values)).score;
  const text = (key: "title" | "slug" | "summary" | "ctaLabel" | "ctaHref") => ({
    value: values[key] ?? "",
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    disabled: submitting,
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader title={isNew ? "Tạo trang" : values.title || "Sửa trang"} back={{ to: "/pages", label: "Danh sách trang nội dung" }} />
      <div role="tablist" aria-label="Phần soạn trang" className="mb-4 flex gap-1 border-b border-line">
        {([["content", "Nội dung"], ["seo", `SEO · ${seoScore}/100`]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            onClick={() => setTab(key)}
            className={`-mb-px min-h-10 border-b-2 px-3 text-sm font-medium ${tab === key ? "border-wood text-wood" : "border-transparent text-ink-2 hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "seo" && (
        <div role="tabpanel" id="panel-seo" aria-labelledby="tab-seo" className="mb-6">
          <SeoTab
            values={seoValues(values)}
            set={(k, v) => set(seoKey[k] ?? (k as keyof Values), v as never)}
            noindex={values.noindex}
            onNoindex={(v) => set("noindex", v)}
            disabled={submitting}
            siteUrl={SITE_URL}
            pathPrefix="/"
          />
          <div className="mt-4"><Button type="submit" loading={submitting}>Lưu trang</Button></div>
        </div>
      )}
      <div role="tabpanel" id="panel-content" aria-labelledby="tab-content" hidden={tab !== "content"} className="grid gap-6 xl:grid-cols-12 [&>*]:min-w-0">
        <div className="flex flex-col gap-6 xl:col-span-8">
          <Panel>
            <div className="flex flex-col gap-4">
              <div data-field="title"><Field label="Tiêu đề" error={errors.title}><Input {...text("title")} /></Field></div>
              <div data-field="slug">
                <Field label="Slug" hint={`Đường dẫn: /${values.slug || "..."}`} error={errors.slug}>
                  <Input {...text("slug")} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
                </Field>
              </div>
              <Field label="Tóm tắt" optional hint="Một câu nói trang dành cho ai, hiện dưới tiêu đề."><Textarea {...text("summary")} rows={2} /></Field>
              <div data-field="content">
                <ContentEditor value={values.content} onChange={(v) => set("content", v)} disabled={submitting} error={errors.content} />
              </div>
            </div>
          </Panel>
        </div>
        <div className="flex flex-col gap-6 xl:col-span-4">
          <Panel title="Đăng trang">
            <div className="flex flex-col gap-4">
              <Field label="Trạng thái" hint="Điền hết các ô [ ] trong nội dung mẫu trước khi đăng.">
                <Select value={values.status} onChange={(v) => set("status", v as PublishStatus)} options={options(publishStatus)} disabled={submitting} />
              </Field>
              <Switch checked={values.showInFooter} onChange={(v) => set("showInFooter", v)} label="Hiện ở cuối trang website" disabled={submitting} />
              <div data-field="position">
                <Field label="Thứ tự" hint="Số nhỏ đứng trước trong footer." error={errors.position}>
                  <Input type="number" min={0} value={values.position} onChange={(e) => set("position", Number(e.target.value) || 0)} disabled={submitting} />
                </Field>
              </div>
            </div>
          </Panel>
          <Panel title="Nút cuối trang">
            <div className="flex flex-col gap-4">
              <div data-field="ctaLabel"><Field label="Chữ trên nút" optional error={errors.ctaLabel}><Input {...text("ctaLabel")} placeholder="VD: Nhắn shop để đăng ký đại lý" /></Field></div>
              <div data-field="ctaHref">
                <Field label="Link" optional hint="Ghi #chat để mở khung chat với shop. Hoặc /duong-dan, https://, tel:, mailto:." error={errors.ctaHref}>
                  <Input {...text("ctaHref")} placeholder="#chat" />
                </Field>
              </div>
            </div>
          </Panel>
          <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
            <Button type="submit" loading={submitting}>Lưu trang</Button>
            {!isNew && <Button variant="text" onClick={handleDelete} disabled={submitting} className="text-err">Xoá trang</Button>}
          </div>
        </div>
      </div>
    </form>
  );
}
