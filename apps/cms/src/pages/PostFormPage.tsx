import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ImageUpload } from "../components/media/ImageUpload";
import { ContentEditor } from "../components/post/ContentEditor";
import { SeoTab } from "../components/post/SeoTab";
import { Checkbox, Field, Input, Switch, Textarea } from "../components/ui/Field";
import { confirmDialog } from "../components/ui/Modal";
import { PageHeader, Panel } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { ErrorState, Skeleton } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { formatDateTime, plain, slugify } from "../lib/format";
import { analyzeSeo } from "../lib/seo-check";
import { options, publishStatus, type PublishStatus } from "../lib/labels";
import type { Category, Post, ProductRow } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Values = Omit<Post, "id">;
const empty: Values = {
  title: "", slug: "", excerpt: "", content: "", coverUrl: "", coverAlt: "", focusKeyword: "", ogTitle: "", ogDescription: "", ogImageUrl: "",
  authorName: "Ban biên tập An Chi", status: "DRAFT", publishedAt: null, metaTitle: "", metaDescription: "", noindex: false, categoryId: "", featured: false, productIds: [],
};
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "";
type Tab = "content" | "seo";
const MAX_PRODUCTS = 3;

const seoValues = (v: Values) => ({
  title: v.title, slug: v.slug, excerpt: v.excerpt ?? "", content: v.content, metaTitle: v.metaTitle ?? "", metaDescription: v.metaDescription ?? "",
  focusKeyword: v.focusKeyword ?? "", coverUrl: v.coverUrl ?? "", coverAlt: v.coverAlt ?? "", ogTitle: v.ogTitle ?? "", ogDescription: v.ogDescription ?? "", ogImageUrl: v.ogImageUrl ?? "",
});

export function PostFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const topics = useLoad(() => api.get<Category[]>("/post-categories"), []);
  const products = useLoad(() => api.list<ProductRow>("/products?limit=100"), []);
  const post = useLoad(() => (id ? api.get<Post>(`/posts/${id}`) : Promise.resolve(null)), [id]);
  const [values, setValues] = useState<Values>(empty);
  const [slugTouched, setSlugTouched] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [tab, setTab] = useState<Tab>("content");
  const { submitting, errors, run } = useSubmit();

  useEffect(() => {
    if (post.state.status !== "ready") return;
    // API trả null cho ô trống; form dùng chuỗi rỗng để ô nhập luôn có giá trị
    const data = post.state.data;
    setValues(data ? { ...empty, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? (k === "publishedAt" ? null : "")])) } as Values : empty);
    setSlugTouched(Boolean(post.state.data));
  }, [post.state]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value, ...(key === "title" && !slugTouched ? { slug: slugify(String(value)) } : {}) }));

  const productList = useMemo(() => {
    if (products.state.status !== "ready") return [];
    const q = plain(productQuery);
    return products.state.data.data.filter((p) => values.productIds.includes(p.id) || !q || plain(p.name).includes(q)).slice(0, 30);
  }, [products.state, productQuery, values.productIds]);

  function toggleProduct(productId: string, checked: boolean) {
    set("productIds", checked ? [...values.productIds, productId] : values.productIds.filter((x) => x !== productId));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run(async () => {
      if (isNew) {
        const created = await api.post<{ id: string }>("/posts", values);
        showToast("Đã lưu bài viết.");
        navigate(`/posts/${created.id}`, { replace: true });
      } else {
        const saved = await api.put<Post>(`/posts/${id}`, values);
        setValues((prev) => ({ ...prev, publishedAt: saved.publishedAt }));
        showToast("Đã lưu bài viết.", { desc: values.status === "PUBLISHED" ? "Website cập nhật trong khoảng một phút." : undefined });
      }
    }, "Chưa lưu được bài viết");
  }

  async function handleDelete() {
    const ok = await confirmDialog({ title: "Xoá bài viết", desc: `Xoá "${values.title}"? Link bài sẽ trả 404. Muốn tạm ẩn thì chuyển trạng thái sang "Đã ẩn".`, confirmLabel: "Xoá bài viết", danger: true });
    if (!ok) return;
    try {
      await api.delete(`/posts/${id}`);
      showToast("Đã xoá bài viết.");
      navigate("/posts");
    } catch (err) {
      showToast("Chưa xoá được bài viết", { type: "error", desc: errorMessage(err) });
    }
  }

  if (post.state.status === "error") return <ErrorState title="Chưa tải được bài viết" desc={post.state.error} onRetry={post.reload} />;
  if (post.state.status === "loading") return <Skeleton className={`h-96 ${post.slow ? "" : "invisible"}`} />;

  const seoScore = analyzeSeo(seoValues(values)).score;
  const text = (key: "title" | "slug" | "excerpt" | "authorName" | "coverAlt") => ({
    value: values[key] ?? "",
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    disabled: submitting,
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader title={isNew ? "Viết bài mới" : values.title || "Sửa bài viết"} back={{ to: "/posts", label: "Danh sách bài viết" }} />
      <div role="tablist" aria-label="Phần soạn bài" className="mb-4 flex gap-1 border-b border-line">
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
          <SeoTab values={seoValues(values)} set={(k, v) => set(k as keyof Values, v as never)} noindex={values.noindex} onNoindex={(v) => set("noindex", v)} disabled={submitting} siteUrl={SITE_URL} />
          <div className="mt-4"><Button type="submit" loading={submitting}>Lưu bài viết</Button></div>
        </div>
      )}
      <div role="tabpanel" id="panel-content" aria-labelledby="tab-content" hidden={tab !== "content"} className="grid gap-6 xl:grid-cols-12 [&>*]:min-w-0">
        <div className="flex flex-col gap-6 xl:col-span-8">
          <Panel>
            <div className="flex flex-col gap-4">
              <div data-field="title"><Field label="Tiêu đề" error={errors.title}><Input {...text("title")} /></Field></div>
              <div data-field="slug"><Field label="Slug" hint={`Đường dẫn: /bai-viet/${values.slug || "..."}`} error={errors.slug}><Input {...text("slug")} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} /></Field></div>
              <Field label="Tóm tắt" optional hint="Hiện dưới tiêu đề và trong thẻ bài."><Textarea {...text("excerpt")} rows={2} /></Field>
              <div data-field="content">
                <ContentEditor value={values.content} onChange={(v) => set("content", v)} disabled={submitting} error={errors.content} />
              </div>
            </div>
          </Panel>
        </div>
        <div className="flex flex-col gap-6 xl:col-span-4">
          <Panel title="Đăng bài">
            <div className="flex flex-col gap-4">
              <Field label="Trạng thái" hint={values.publishedAt ? `Ngày đăng: ${formatDateTime(values.publishedAt)}` : "Chuyển sang Đang hiện thì ngày đăng là lúc lưu."}>
                <Select value={values.status} onChange={(v) => set("status", v as PublishStatus)} options={options(publishStatus)} disabled={submitting} />
              </Field>
              <div data-field="categoryId"><Field label="Chủ đề" error={errors.categoryId ? "Bạn chọn một chủ đề." : undefined}><Select value={values.categoryId || null} onChange={(v) => set("categoryId", v)} options={topics.state.status === "ready" ? topics.state.data.map((t) => ({ value: t.id, label: t.name })) : []} placeholder="Chọn chủ đề" disabled={submitting} /></Field></div>
              <div data-field="authorName"><Field label="Tác giả" error={errors.authorName}><Input {...text("authorName")} /></Field></div>
              <div data-field="coverUrl">
                <Field label="Ảnh bìa" optional error={errors.coverUrl}>
                  <ImageUpload value={values.coverUrl || null} onChange={(path) => set("coverUrl", path)} disabled={submitting} label="Tải ảnh bìa" />
                </Field>
              </div>
              {values.coverUrl && <Field label="Alt ảnh bìa" hint="Tả đúng thứ trong ảnh."><Input {...text("coverAlt")} /></Field>}
              <Switch checked={values.featured} onChange={(v) => set("featured", v)} label="Nổi bật ở trang chủ, tối đa 3 bài" disabled={submitting} />
            </div>
          </Panel>
          <Panel title="Sản phẩm liên quan">
            <div role="group" aria-labelledby="sp-lien-quan" className="flex flex-col gap-2">
              <p id="sp-lien-quan" className="text-sm text-ink-2">Hiện cuối bài, tối đa {MAX_PRODUCTS} sản phẩm. Đã chọn {values.productIds.length}.</p>
              <Input aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
              <div className="max-h-72 overflow-y-auto">
                {productList.map((p) => {
                  const checked = values.productIds.includes(p.id);
                  return <Checkbox key={p.id} label={p.name} checked={checked} disabled={submitting || (!checked && values.productIds.length >= MAX_PRODUCTS)} onChange={(e) => toggleProduct(p.id, e.target.checked)} />;
                })}
              </div>
            </div>
          </Panel>
          <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
            <Button type="submit" loading={submitting}>Lưu bài viết</Button>
            {!isNew && <Button variant="text" onClick={handleDelete} disabled={submitting} className="text-err">Xoá bài viết</Button>}
          </div>
        </div>
      </div>
    </form>
  );
}
