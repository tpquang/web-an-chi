import { cache } from "react";
import { OpenChatButton } from "@/components/open-chat-button";
import { PostBody } from "@/components/post-body";
import { Button } from "@/components/ui/button";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { PageFrame } from "@/components/ui/layout";
import { getContentPage } from "@/lib/api";
import { parseContent } from "@/lib/content";
import { contentPageHref } from "@/lib/links";
import { notFoundOrRedirect } from "@/lib/redirect";
import { pageMeta } from "@/lib/seo";
import { formatDate } from "@/lib/site";

// Trang tự soạn ở CMS > Trang nội dung: bảo hành, chính sách đại lý, cộng tác viên...
// Route tĩnh cùng cấp (san-pham, bai-viet...) luôn được ưu tiên; API cấm slug trùng các route đó
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [];
}

const loadPage = cache(async (slug: string) => {
  const page = await getContentPage(slug);
  if (!page) return notFoundOrRedirect(contentPageHref(slug));
  return page;
});

export async function generateMetadata({ params }: Props) {
  const page = await loadPage((await params).slug);
  return pageMeta({
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? page.summary,
    path: contentPageHref(page.slug),
    noindex: page.noindex,
    ogTitle: page.ogTitle,
    ogDescription: page.ogDescription,
    image: page.ogImageUrl ?? undefined,
  });
}

export default async function ContentPage({ params }: Props) {
  const page = await loadPage((await params).slug);
  const crumbs = [
    { name: "Trang chủ", href: "/" },
    { name: page.title, href: contentPageHref(page.slug) },
  ];

  return (
    <PageFrame>
      <PageBreadcrumb crumbs={crumbs} />
      <article className="max-w-[68ch]">
        <header className="mb-8">
          <h1 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1]">{page.title}</h1>
          {page.summary && <p className="mt-3 text-lg text-ink-2">{page.summary}</p>}
          <p className="mt-4 text-sm text-ink-3">
            Cập nhật <time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time>
          </p>
        </header>
        <PostBody blocks={parseContent(page.content)} />
        {page.ctaLabel && page.ctaHref && (
          <div className="mt-10">
            {page.ctaHref === "#chat" ? (
              <OpenChatButton>{page.ctaLabel}</OpenChatButton>
            ) : (
              <Button href={page.ctaHref} external={page.ctaHref.startsWith("https:")}>
                {page.ctaLabel}
              </Button>
            )}
          </div>
        )}
      </article>
    </PageFrame>
  );
}
