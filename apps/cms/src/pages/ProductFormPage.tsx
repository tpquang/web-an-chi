import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RowsEditor } from "../components/RowsEditor";
import { Button } from "../components/ui/Button";
import { Field, Input, MoneyInput, Switch, Textarea } from "../components/ui/Field";
import { confirmDialog } from "../components/ui/Modal";
import { PageHeader, Panel } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { ErrorState, Skeleton } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { slugify } from "../lib/format";
import { options, publishStatus, type PublishStatus } from "../lib/labels";
import type { Category, Product } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Values = Omit<Product, "id" | "specs" | "images" | "priceVnd"> & {
  priceVnd: number | null;
  specs: { label: string; value: string }[];
  images: { url: string; alt: string }[];
};

const empty: Values = {
  name: "", slug: "", summary: "", description: "", usage: "", specs: [], priceVnd: null, compareAtPriceVnd: null,
  stock: 0, origin: "", featured: false, shopeeUrl: "", tiktokUrl: "", status: "DRAFT", metaTitle: "", metaDescription: "",
  categoryId: "", images: [],
};

function toValues(product: Product): Values {
  return { ...empty, ...product, specs: product.specs ?? [], images: product.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })) };
}

export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const categories = useLoad(() => api.get<Category[]>("/categories"), []);
  const product = useLoad(() => (id ? api.get<Product>(`/products/${id}`) : Promise.resolve(null)), [id]);
  const [values, setValues] = useState<Values>(empty);
  const [slugTouched, setSlugTouched] = useState(false);
  const { submitting, errors, run } = useSubmit();

  useEffect(() => {
    if (product.state.status === "ready") {
      setValues(product.state.data ? toValues(product.state.data) : empty);
      setSlugTouched(Boolean(product.state.data));
    }
  }, [product.state]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((prev) => ({ ...prev, [key]: value, ...(key === "name" && !slugTouched ? { slug: slugify(String(value)) } : {}) }));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run(async () => {
      const body = {
        ...values,
        priceVnd: values.priceVnd ?? 0,
        specs: values.specs.filter((s) => s.label.trim() && s.value.trim()),
        images: values.images.filter((i) => i.url.trim()),
      };
      if (isNew) {
        const created = await api.post<{ id: string }>("/products", body);
        showToast("Đã thêm sản phẩm.");
        navigate(`/products/${created.id}`, { replace: true });
      } else {
        await api.put(`/products/${id}`, body);
        showToast("Đã lưu sản phẩm.", { desc: "Website cập nhật trong khoảng một phút." });
      }
    }, "Chưa lưu được sản phẩm");
  }

  async function handleDelete() {
    const ok = await confirmDialog({
      title: "Xoá sản phẩm",
      desc: `"${values.name}" sẽ bị xoá khỏi website. Đơn cũ vẫn giữ tên và giá lúc đặt. Nếu chỉ tạm ngừng bán, bạn nên chuyển trạng thái sang "Đã ẩn".`,
      confirmLabel: "Xoá sản phẩm",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/products/${id}`);
      showToast("Đã xoá sản phẩm.");
      navigate("/products");
    } catch (err) {
      showToast("Chưa xoá được sản phẩm", { type: "error", desc: errorMessage(err) });
    }
  }

  if (product.state.status === "error") return <ErrorState title="Chưa tải được sản phẩm" desc={product.state.error} onRetry={product.reload} />;
  if (product.state.status === "loading") return <Skeleton className={`h-96 ${product.slow ? "" : "invisible"}`} />;

  const categoryOptions = categories.state.status === "ready" ? categories.state.data.map((c) => ({ value: c.id, label: c.name })) : [];
  const text = (key: keyof Values) => ({ value: (values[key] as string | null) ?? "", onChange: (e: { target: { value: string } }) => set(key, e.target.value as never), disabled: submitting });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader title={isNew ? "Thêm sản phẩm" : values.name || "Sửa sản phẩm"} back={{ to: "/products", label: "Danh sách sản phẩm" }} />
      <div className="grid gap-6 xl:grid-cols-12 [&>*]:min-w-0">
        <div className="flex flex-col gap-6 xl:col-span-8">
          <Panel title="Thông tin cơ bản">
            <div className="flex flex-col gap-4">
              <div data-field="name"><Field label="Tên sản phẩm" error={errors.name}><Input {...text("name")} /></Field></div>
              <div data-field="slug">
                <Field label="Slug" hint={`Đường dẫn: /san-pham/${values.slug || "..."}`} error={errors.slug}>
                  <Input {...text("slug")} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
                </Field>
              </div>
              <Field label="Mô tả ngắn" optional hint="Một câu hiện cạnh giá."><Input {...text("summary")} /></Field>
              <Field label="Mô tả" optional hint="Viết riêng cho An Chi, mỗi đoạn cách một dòng trống. Không hứa công dụng chữa bệnh hay tâm linh.">
                <Textarea {...text("description")} rows={6} />
              </Field>
              <Field label="Cách dùng và bảo quản" optional><Textarea {...text("usage")} rows={3} /></Field>
              <Field label="Xuất xứ" optional hint="Để trống nếu chưa có căn cứ từ nhà cung cấp."><Input {...text("origin")} /></Field>
            </div>
          </Panel>
          <Panel title="Thông số">
            <RowsEditor rows={values.specs} onChange={(rows) => set("specs", rows as Values["specs"])} columns={[{ key: "label", label: "Tên thông số", placeholder: "VD: Cỡ hạt" }, { key: "value", label: "Giá trị", placeholder: "VD: 10mm" }]} addLabel="Thêm thông số" disabled={submitting} />
          </Panel>
          <Panel title="Ảnh">
            <p className="mb-3 text-sm text-ink-2">Ảnh thật của đúng sản phẩm, tỉ lệ 1:1. Ảnh đầu tiên là ảnh chính. Sản phẩm chưa có ảnh sẽ không được Google index.</p>
            <RowsEditor rows={values.images} onChange={(rows) => set("images", rows as Values["images"])} columns={[{ key: "url", label: "Link ảnh", placeholder: "https://...", wide: true }, { key: "alt", label: "Mô tả ảnh (alt)" }]} addLabel="Thêm ảnh" disabled={submitting} max={12} />
            {errors.images && <p role="alert" className="mt-2 text-sm text-err">Link ảnh cần là địa chỉ https đầy đủ.</p>}
          </Panel>
          <Panel title="SEO">
            <div className="flex flex-col gap-4">
              <Field label="Tiêu đề trên Google" optional hint={'Để trống thì dùng tên sản phẩm. Website tự thêm " | An Chi Trầm Hương".'} counter={{ value: (values.metaTitle ?? "").length, max: 45 }}><Input {...text("metaTitle")} placeholder={values.name} /></Field>
              <Field label="Mô tả trên Google" optional hint="120–158 ký tự." counter={{ value: (values.metaDescription ?? "").length, max: 158 }}><Textarea {...text("metaDescription")} rows={3} /></Field>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-6 xl:col-span-4">
          <Panel title="Bán hàng">
            <div className="flex flex-col gap-4">
              <div data-field="status"><Field label="Trạng thái"><Select value={values.status} onChange={(v) => set("status", v as PublishStatus)} options={options(publishStatus)} disabled={submitting} /></Field></div>
              <div data-field="categoryId"><Field label="Danh mục" error={errors.categoryId ? "Bạn chọn một danh mục." : undefined}><Select value={values.categoryId || null} onChange={(v) => set("categoryId", v)} options={categoryOptions} placeholder="Chọn danh mục" disabled={submitting} /></Field></div>
              <div data-field="priceVnd"><Field label="Giá bán" error={errors.priceVnd ? "Bạn nhập giá bán." : undefined}><MoneyInput value={values.priceVnd} onChange={(v) => set("priceVnd", v)} disabled={submitting} /></Field></div>
              <div data-field="compareAtPriceVnd"><Field label="Giá trước đây" optional hint="Chỉ nhập khi đã thực sự bán ở giá này." error={errors.compareAtPriceVnd}><MoneyInput value={values.compareAtPriceVnd} onChange={(v) => set("compareAtPriceVnd", v)} disabled={submitting} /></Field></div>
              <div data-field="stock"><Field label="Tồn kho" error={errors.stock}><Input inputMode="numeric" value={String(values.stock)} onChange={(e) => set("stock", Number(e.target.value.replace(/\D/g, "")) || 0)} disabled={submitting} className="text-right tabular-nums" /></Field></div>
              <Switch checked={values.featured} onChange={(v) => set("featured", v)} label="Hiện ở mục tiêu biểu trang chủ" disabled={submitting} />
            </div>
          </Panel>
          <Panel title="Kênh bán khác">
            <div className="flex flex-col gap-4">
              <div data-field="shopeeUrl"><Field label="Link Shopee" optional error={errors.shopeeUrl}><Input {...text("shopeeUrl")} placeholder="https://shopee.vn/..." inputMode="url" /></Field></div>
              <div data-field="tiktokUrl"><Field label="Link TikTok Shop" optional error={errors.tiktokUrl}><Input {...text("tiktokUrl")} placeholder="https://www.tiktok.com/..." inputMode="url" /></Field></div>
            </div>
          </Panel>
          <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
            <Button type="submit" loading={submitting}>{isNew ? "Thêm sản phẩm" : "Lưu sản phẩm"}</Button>
            {!isNew && <Button variant="text" onClick={handleDelete} disabled={submitting} className="text-err">Xoá sản phẩm</Button>}
          </div>
        </div>
      </div>
    </form>
  );
}
