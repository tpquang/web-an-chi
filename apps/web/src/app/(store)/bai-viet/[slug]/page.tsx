import Link from "next/link";
import { cache } from "react";
import { PostBody, TableOfContents } from "@/components/post-body";
import { PostGrid } from "@/components/post-card";
import { ProductGrid } from "@/components/product-card";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { PageFrame, Section } from "@/components/ui/layout";
import { getPost, getPostCategories, getPosts } from "@/lib/api";
import { parseContent, wordCount } from "@/lib/content";
import { postHref, postsHref, topicHref } from "@/lib/links";
import { notFoundOrRedirect } from "@/lib/redirect";
import { absoluteImage, absoluteUrl, defaultOgImage, pageMeta, publisherLd, safeJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

// Không dựng sẵn lúc build; mỗi slug dựng ở lần xem đầu rồi cache theo revalidate của fetch
export function generateStaticParams() {
  return [];
}

const loadPost = cache(async (slug: string) => {
  const post = await getPost(slug);
  if (!post) return notFoundOrRedirect(postHref(slug));
  return post;
});

export async function generateMetadata({ params }: Props) {
  const post = await loadPost((await params).slug);
  const meta = pageMeta({
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    path: postHref(post.slug),
    image: post.ogImageUrl ?? post.coverUrl ?? undefined,
  });
  // Chữ khi chia sẻ mạng xã hội đặt riêng ở tab SEO, trống thì dùng tiêu đề và mô tả
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: "article",
      ...(post.ogTitle ? { title: post.ogTitle } : {}),
      ...(post.ogDescription ? { description: post.ogDescription } : {}),
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await loadPost((await params).slug);
  const [related, topics] = await Promise.all([
    getPosts({ category: post.category.slug, exclude: post.slug, limit: 6 }),
    getPostCategories(),
  ]);
  const blocks = parseContent(post.content);
  const showToc = wordCount(post.content) > 1200;
  const crumbs = [
    { name: "Trang chủ", href: "/" },
    { name: "Bài viết", href: postsHref },
    { name: post.category.name, href: topicHref(post.category.slug) },
    { name: post.title, href: postHref(post.slug) },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: post.authorName },
    publisher: publisherLd,
    mainEntityOfPage: absoluteUrl(postHref(post.slug)),
    inLanguage: "vi",
    // Google khuyến nghị Article có ảnh: chưa có ảnh bìa thì dùng ảnh chia sẻ mặc định
    image: [absoluteImage(post.coverUrl ?? defaultOgImage)],
  };

  return (
    <PageFrame>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <PageBreadcrumb crumbs={crumbs} />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <article className="lg:col-span-8">
          <header className="mb-8">
            <h1 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] font-medium">{post.title}</h1>
            {post.excerpt && <p className="mt-3 max-w-[68ch] text-lg text-ink-2">{post.excerpt}</p>}
            <p className="mt-4 text-sm text-ink-3">
              {post.authorName} · Đăng <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              {post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10) && (
                <>
                  {" "}
                  · Cập nhật <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                </>
              )}
            </p>
          </header>
          {showToc && (
            <div className="mb-8 lg:hidden">
              <TableOfContents blocks={blocks} />
            </div>
          )}
          <PostBody blocks={blocks} />
        </article>

        <aside className="flex flex-col gap-6 lg:col-span-4 lg:min-w-55">
          {showToc && (
            <div className="hidden lg:block">
              <TableOfContents blocks={blocks} />
            </div>
          )}
          <nav aria-labelledby="chu-de" className="rounded-3xl border border-edge bg-surface p-5">
            <p id="chu-de" className="font-serif text-xl font-semibold">
              Chủ đề
            </p>
            <ul className="mt-2 text-sm">
              {topics.map((topic) => (
                <li key={topic.id}>
                  <Link
                    href={topicHref(topic.slug)}
                    aria-current={topic.slug === post.category.slug ? "true" : undefined}
                    className={`inline-flex min-h-11 items-center hover:text-wood ${topic.slug === post.category.slug ? "font-medium text-wood" : ""}`}
                  >
                    {topic.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      {post.products.length > 0 && (
        <Section title="Sản phẩm nhắc đến trong bài" id="san-pham-trong-bai">
          <ProductGrid products={post.products} />
        </Section>
      )}

      {related.data.length > 0 && (
        <Section title="Bài cùng chủ đề" id="bai-cung-chu-de">
          <PostGrid posts={related.data} />
        </Section>
      )}
    </PageFrame>
  );
}
