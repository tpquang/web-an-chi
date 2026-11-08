import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ImageField } from "../components/home/ImageField";
import { LinkFields, SlideFields, type SlideValues } from "../components/home/HomeFields";
import { PlusIcon } from "../components/icons";
import { Button } from "../components/ui/Button";
import { Field, Input, Textarea } from "../components/ui/Field";
import { PageHeader, Panel } from "../components/ui/Page";
import { ErrorState, Skeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { publishStatus } from "../lib/labels";
import type { FeaturedSummary, HomeBanner, HomeConfig, HomeLink } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

const MAX_SLIDES = 6;
const noLink: HomeLink = { label: "", href: "" };
const blankSlide: SlideValues = { eyebrow: "", title: "", text: "", imageId: null, imageAlt: "", cta: noLink };

type Values = { banner: Omit<HomeBanner, "secondary"> & { secondary: HomeLink }; slides: SlideValues[] };

function toValues(home: HomeConfig): Values {
  return {
    banner: { ...home.banner, secondary: home.banner.secondary ?? noLink },
    slides: home.slides.map((slide) => ({ ...slide, cta: slide.cta ?? noLink })),
  };
}

// Nút không bắt buộc để trống cả chữ và link thì gửi null
const optionalLink = (link: HomeLink) => (link.label.trim() || link.href.trim() ? link : null);

function toInput(values: Values): HomeConfig {
  return {
    banner: { ...values.banner, imageAlt: values.banner.imageId ? values.banner.imageAlt : "", secondary: optionalLink(values.banner.secondary) },
    slides: values.slides.map((slide) => ({ ...slide, imageAlt: slide.imageId ? slide.imageAlt : "", cta: optionalLink(slide.cta) })),
  };
}

export function HomeConfigPage() {
  const config = useLoad(() => api.get<{ home: HomeConfig }>("/home"), []);
  const featured = useLoad(() => api.get<FeaturedSummary>("/featured"), []);
  const [values, setValues] = useState<Values | null>(null);
  const { submitting, errors, run } = useSubmit();

  useEffect(() => {
    if (config.state.status === "ready") setValues(toValues(config.state.data.home));
  }, [config.state]);

  if (config.state.status === "error") return <ErrorState title="Chưa tải được cấu hình trang chủ" desc={config.state.error} onRetry={config.reload} />;
  if (!values) return <Skeleton className={`h-96 ${config.slow ? "" : "invisible"}`} />;

  const banner = values.banner;
  const setBanner = <K extends keyof Values["banner"]>(key: K, value: Values["banner"][K]) => setValues({ ...values, banner: { ...banner, [key]: value } });
  const setSlides = (slides: SlideValues[]) => setValues({ ...values, slides });
  const move = (index: number, step: -1 | 1) => {
    const slides = [...values.slides];
    [slides[index], slides[index + step]] = [slides[index + step], slides[index]];
    setSlides(slides);
  };

  function submit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      const saved = await api.put<HomeConfig>("/home", toInput(values!));
      setValues(toValues(saved));
      showToast("Đã lưu trang chủ.", { desc: "Website cập nhật trong khoảng một phút." });
    }, "Chưa lưu được trang chủ");
  }

  return (
    <form onSubmit={submit}>
      <PageHeader
        title="Trang chủ"
        desc="Banner đầu trang và slide giới thiệu trầm hương. Sản phẩm và bài viết nổi bật bật ở danh sách sản phẩm, bài viết."
        actions={<Button type="submit" loading={submitting}>Lưu trang chủ</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="flex flex-col gap-6 xl:col-span-8">
          <Panel title="Banner">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <Field label="Dòng nhỏ trên tiêu đề" optional><Input value={banner.eyebrow} maxLength={60} onChange={(e) => setBanner("eyebrow", e.target.value)} disabled={submitting} /></Field>
                <div data-field="banner.title">
                  <Field label="Tiêu đề" hint="Là H1 của trang chủ, nên có chữ trầm hương." error={errors["banner.title"]}><Input value={banner.title} maxLength={90} onChange={(e) => setBanner("title", e.target.value)} disabled={submitting} /></Field>
                </div>
                <Field label="Lời dẫn" optional><Textarea value={banner.text} maxLength={240} onChange={(e) => setBanner("text", e.target.value)} disabled={submitting} /></Field>
              </div>
              <div className="flex flex-col gap-4">
                <ImageField label="Ảnh banner" hint="Ảnh dọc gần vuông (5:6), nên rộng từ 1200 px cho rõ nét. Trên điện thoại ảnh được cắt ngang 4:3." ratio="aspect-[5/6] max-h-80" imageId={banner.imageId} disabled={submitting} onChange={(id) => setBanner("imageId", id)} />
                {banner.imageId && <Field label="Mô tả ảnh" hint="Ví dụ: Vòng tay trầm hương 12mm đặt trên khay gỗ." optional><Input value={banner.imageAlt} maxLength={160} onChange={(e) => setBanner("imageAlt", e.target.value)} disabled={submitting} /></Field>}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-4">
              <LinkFields label="Nút chính" link={banner.primary} path="banner.primary" errors={errors} disabled={submitting} onChange={(link) => setBanner("primary", link)} />
              <LinkFields label="Nút phụ" link={banner.secondary} path="banner.secondary" errors={errors} optional disabled={submitting} onChange={(link) => setBanner("secondary", link)} />
            </div>
          </Panel>

          <Panel title="Slide giới thiệu">
            <p className="-mt-2 mb-4 text-sm text-ink-2">Khối tối giữa trang. Khách tự bấm để chuyển slide, không tự chạy. Tối đa {MAX_SLIDES} slide.</p>
            {errors.slides && <p role="alert" className="mb-4 text-sm text-err">{errors.slides}</p>}
            <ol className="flex flex-col gap-4">
              {values.slides.map((slide, index) => (
                <SlideFields
                  key={index}
                  slide={slide}
                  index={index}
                  count={values.slides.length}
                  errors={errors}
                  disabled={submitting}
                  onChange={(next) => setSlides(values.slides.map((s, i) => (i === index ? next : s)))}
                  onMove={(step) => move(index, step)}
                  onRemove={() => setSlides(values.slides.filter((_, i) => i !== index))}
                />
              ))}
            </ol>
            <Button variant="outline" className="mt-4" disabled={submitting || values.slides.length >= MAX_SLIDES} onClick={() => setSlides([...values.slides, blankSlide])}>
              <PlusIcon size={18} /> Thêm slide
            </Button>
          </Panel>
        </div>

        <div className="xl:col-span-4">
          <Panel title="Đang nổi bật">
            {featured.state.status === "ready" ? (
              <div className="flex flex-col gap-6 text-sm">
                <FeaturedList title="Sản phẩm" to="/products" limit={featured.state.data.limit.products} items={featured.state.data.products.map((p) => ({ id: p.id, name: p.name, status: p.status, to: `/products/${p.id}` }))} />
                <FeaturedList title="Bài viết" to="/posts" limit={featured.state.data.limit.posts} items={featured.state.data.posts.map((p) => ({ id: p.id, name: p.title, status: p.status, to: `/posts/${p.id}` }))} />
              </div>
            ) : (
              <Skeleton className="h-40" />
            )}
          </Panel>
        </div>
      </div>
    </form>
  );
}

type Item = { id: string; name: string; status: keyof typeof publishStatus; to: string };

function FeaturedList({ title, to, limit, items }: { title: string; to: string; limit: number; items: Item[] }) {
  return (
    <div>
      <p className="font-medium">{title}: {items.length}/{limit}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-ink-3">Chưa chọn. Trang chủ hiện {title === "Bài viết" ? "bài mới nhất" : "trống khối này"}.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <Link to={item.to} className="min-h-11 py-2.5 hover:text-wood">{item.name}</Link>
              {item.status !== "PUBLISHED" && <Tag tone={publishStatus[item.status].tone}>{publishStatus[item.status].label}</Tag>}
            </li>
          ))}
        </ul>
      )}
      <Link to={to} className="mt-1 inline-flex min-h-11 items-center text-wood hover:underline">Chọn ở danh sách {title.toLowerCase()}</Link>
    </div>
  );
}
