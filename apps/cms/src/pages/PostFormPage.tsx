import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "../components/ui/Field";
import { confirmDialog } from "../components/ui/Modal";
import { PageHeader, Panel } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { ErrorState, Skeleton } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { formatDateTime, plain, slugify } from "../lib/format";
import { options, publishStatus, type PublishStatus } from "../lib/labels";
import type { Category, Post, ProductRow } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Values = Omit<Post, "id">;
const empty: Values = {
  title: "", slug: "", excerpt: "", content: "", coverUrl: "", authorName: "Ban biên tập An Chi", status: "DRAFT",
  publishedAt: null, metaTitle: "", metaDescription: "", categoryId: "", productIds: [],
};
const MAX_PRODUCTS = 3;

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
  const { submitting, errors, run } = useSubmit();

  useEffect(() => {
    if (post.state.status !== "ready") return;
    setValues(post.state.data ? { ...empty, ...post.state.data } : empty);
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

  const text = (key: "title" | "slug" | "excerpt" | "content" | "coverUrl" | "authorName" | "metaTitle" | "metaDescription") => ({
    value: values[key] ?? "",
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    disabled: submitting,
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader title={isNew ? "Viết bài mới" : values.title || "Sửa bài viết"} back={{ to: "/posts", label: "Danh sách bài viết" }} />
      <div className="grid gap-6 xl:grid-cols-12 [&>*]:min-w-0">
        <div className="flex flex-col gap-6 xl:col-span-8">
          <Panel>
            <div className="flex flex-col gap-4">
              <div data-field="title"><Field label="Tiêu đề" error={errors.title}><Input {...text("title")} /></Field></div>
              <div data-field="slug"><Field label="Slug" hint={`Đường dẫn: /bai-viet/${values.slug || "..."}`} error={errors.slug}><Input {...text("slug")} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} /></Field></div>
              <Field label="Tóm tắt" optional hint="Hiện dưới tiêu đề và trong thẻ bài."><Textarea {...text("excerpt")} rows={2} /></Field>
              <div data-field="content">
                <Field label="Nội dung" error={errors.content} hint={'Đoạn cách nhau một dòng trống. Dòng bắt đầu "## " là tiêu đề mục, "### " là mục con, "- " là gạch đầu dòng.'}>
                  <Textarea {...text("content")} rows={20} className="font-mono text-sm" />
                </Field>
              </div>
            </div>
          </Panel>
          <Panel title="SEO">
            <div className="flex flex-col gap-4">
              <Field label="Tiêu đề trên Google" optional counter={{ value: (values.metaTitle ?? "").length, max: 45 }}><Input {...text("metaTitle")} placeholder={values.title} /></Field>
              <Field label="Mô tả trên Google" optional hint="120–158 ký tự. Để trống thì dùng tóm tắt." counter={{ value: (values.metaDescription ?? "").length, max: 158 }}><Textarea {...text("metaDescription")} rows={3} /></Field>
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
              <div data-field="coverUrl"><Field label="Ảnh bìa" optional error={errors.coverUrl}><Input {...text("coverUrl")} placeholder="https://..." inputMode="url" /></Field></div>
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
