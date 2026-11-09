import { useState, type FormEvent } from "react";
import { PlusIcon } from "../components/icons";
import { IndexSwitch, NoindexTag } from "../components/IndexSwitch";
import { OgFields, type OgValues } from "../components/OgFields";
import { RowActions } from "../components/RowActions";
import { Button } from "../components/ui/Button";
import { Field, Input, Textarea } from "../components/ui/Field";
import { confirmDialog, Modal } from "../components/ui/Modal";
import { DataTable, PageHeader, td, th } from "../components/ui/Page";
import { EmptyState, ErrorState, TableSkeleton } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { slugify } from "../lib/format";
import type { Category } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

// Danh mục sản phẩm và chủ đề bài viết có cùng dạng, chỉ khác vài trường
const kinds = {
  categories: { title: "Danh mục sản phẩm", one: "danh mục", urlPrefix: "/danh-muc/", countKey: "products", countLabel: "Sản phẩm", hasGuide: true },
  "post-categories": { title: "Chủ đề bài viết", one: "chủ đề", urlPrefix: "/chu-de/", countKey: "posts", countLabel: "Bài viết", hasGuide: false },
} as const;

type Values = { name: string; slug: string; description: string; guide: string; position: number; metaTitle: string; metaDescription: string; noindex: boolean } & OgValues;
const empty: Values = { name: "", slug: "", description: "", guide: "", position: 0, metaTitle: "", metaDescription: "", noindex: false, ogTitle: "", ogDescription: "", ogImageUrl: "" };

export function TaxonomyPage({ kind }: { kind: keyof typeof kinds }) {
  const config = kinds[kind];
  const { state, slow, reload } = useLoad(() => api.get<Category[]>(`/${kind}`), [kind]);
  const [editing, setEditing] = useState<{ id: string | null; values: Values } | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const { submitting, errors, setErrors, run } = useSubmit();

  function open(item?: Category) {
    setErrors({});
    setSlugTouched(Boolean(item));
    setEditing({
      id: item?.id ?? null,
      values: item
        ? { name: item.name, slug: item.slug, description: item.description ?? "", guide: item.guide ?? "", position: item.position, metaTitle: item.metaTitle ?? "", metaDescription: item.metaDescription ?? "", noindex: item.noindex, ogTitle: item.ogTitle ?? "", ogDescription: item.ogDescription ?? "", ogImageUrl: item.ogImageUrl ?? "" }
        : { ...empty, position: state.status === "ready" ? state.data.length + 1 : 0 },
    });
  }

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setEditing((prev) => prev && { ...prev, values: { ...prev.values, [key]: value, ...(key === "name" && !slugTouched ? { slug: slugify(String(value)) } : {}) } });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const { guide, ...rest } = editing.values;
    const body = config.hasGuide ? { ...rest, guide } : rest;
    run(async () => {
      if (editing.id) await api.put(`/${kind}/${editing.id}`, body);
      else await api.post(`/${kind}`, body);
      showToast(editing.id ? `Đã lưu ${config.one}.` : `Đã thêm ${config.one}.`);
      setEditing(null);
      reload();
    }, `Chưa lưu được ${config.one}`);
  }

  async function handleDelete(item: Category) {
    const ok = await confirmDialog({ title: `Xoá ${config.one}`, desc: `Xoá "${item.name}"? Link ${config.urlPrefix}${item.slug} sẽ trả 404.`, confirmLabel: `Xoá ${config.one}`, danger: true });
    if (!ok) return;
    try {
      await api.delete(`/${kind}/${item.id}`);
      showToast(`Đã xoá ${config.one}.`);
      reload();
    } catch (err) {
      showToast(`Chưa xoá được ${config.one}`, { type: "error", desc: errorMessage(err) });
    }
  }

  const v = editing?.values;
  return (
    <>
      <PageHeader title={config.title} actions={<Button onClick={() => open()}><PlusIcon size={18} /> Thêm {config.one}</Button>} />
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton rows={4} /></div>}
      {state.status === "error" && <ErrorState title={`Chưa tải được ${config.one}`} desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.length === 0 && (
        <EmptyState title={`Chưa có ${config.one} nào.`} desc={`Thêm ${config.one} đầu tiên để bắt đầu sắp xếp nội dung.`} action={<Button onClick={() => open()}>Thêm {config.one}</Button>} />
      )}
      {state.status === "ready" && state.data.length > 0 && (
        <DataTable head={<tr><th className={th}>Thứ tự</th><th className={th}>Tên</th><th className={th}>Đường dẫn</th><th className={`${th} text-right`}>{config.countLabel}</th><th className={th}><span className="sr-only">Thao tác</span></th></tr>}>
          {state.data.map((item) => (
            <tr key={item.id}>
              <td className={`${td} tabular-nums`}>{item.position}</td>
              <td className={td}><button type="button" onClick={() => open(item)} className="min-h-11 text-left font-medium hover:text-wood">{item.name}</button> <NoindexTag noindex={item.noindex} /></td>
              <td className={`${td} text-ink-3`}>{config.urlPrefix}{item.slug}</td>
              <td className={`${td} text-right tabular-nums`}>{item._count?.[config.countKey] ?? 0}</td>
              <td className={td}><RowActions name={item.name} onEdit={() => open(item)} onDelete={() => handleDelete(item)} /></td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        locked={submitting}
        wide
        title={editing?.id ? `Sửa ${config.one}` : `Thêm ${config.one}`}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)} disabled={submitting}>Huỷ</Button><Button type="submit" form="taxonomy-form" loading={submitting}>Lưu</Button></>}
      >
        {v && (
          <form id="taxonomy-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_120px]">
              <div data-field="name"><Field label="Tên" error={errors.name}><Input value={v.name} onChange={(e) => set("name", e.target.value)} disabled={submitting} /></Field></div>
              <div data-field="slug"><Field label="Slug" error={errors.slug}><Input value={v.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} disabled={submitting} /></Field></div>
              <Field label="Thứ tự"><Input inputMode="numeric" value={String(v.position)} onChange={(e) => set("position", Number(e.target.value.replace(/\D/g, "")) || 0)} disabled={submitting} /></Field>
            </div>
            <Field label="Mô tả" optional hint="Hiện dưới tiêu đề trang, 80–150 chữ."><Textarea value={v.description} onChange={(e) => set("description", e.target.value)} disabled={submitting} /></Field>
            {config.hasGuide && <Field label="Hướng dẫn chọn" optional hint="Hiện dưới lưới sản phẩm, mỗi đoạn cách một dòng trống."><Textarea value={v.guide} onChange={(e) => set("guide", e.target.value)} rows={5} disabled={submitting} /></Field>}
            <Field label="Tiêu đề trên Google" optional counter={{ value: v.metaTitle.length, max: 45 }}><Input value={v.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder={v.name} disabled={submitting} /></Field>
            <Field label="Mô tả trên Google" optional counter={{ value: v.metaDescription.length, max: 158 }}><Textarea value={v.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} disabled={submitting} /></Field>
            <IndexSwitch noindex={v.noindex} onChange={(value) => set("noindex", value)} disabled={submitting} />
            <h3 className="mt-2 font-semibold">Chia sẻ mạng xã hội</h3>
            <OgFields values={v} set={set} fallback={{ title: v.metaTitle || v.name, description: v.metaDescription || v.description, image: null, imageHint: "Để trống thì dùng ảnh mặc định của An Chi." }} disabled={submitting} />
          </form>
        )}
      </Modal>
    </>
  );
}
