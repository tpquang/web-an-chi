import { notFound } from "next/navigation";
import { cache } from "react";
import { PostGrid } from "@/components/post-card";
import { TopicNav } from "@/components/topic-nav";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { getPostCategories, getPostCategory, getPosts } from "@/lib/api";
import { pagedHref, postsHref, topicHref } from "@/lib/links";
import { pageMeta, parsePage } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ trang?: string | string[] }> };

const loadTopic = cache(async (slug: string) => {
  const topic = await getPostCategory(slug);
  if (!topic) notFound();
  return topic;
});

export async function generateMetadata({ params, searchParams }: Props) {
  const [topic, page] = await Promise.all([loadTopic((await params).slug), searchParams.then((s) => parsePage(s.trang))]);
  const title = topic.metaTitle ?? topic.name;
  return pageMeta({
    title: page > 1 ? `${title}, trang ${page}` : title,
    description: topic.metaDescription ?? topic.description,
    path: pagedHref(topicHref(topic.slug), page),
  });
}

export default async function TopicPage({ params, searchParams }: Props) {
  const topic = await loadTopic((await params).slug);
  const page = parsePage((await searchParams).trang);
  const [posts, topics] = await Promise.all([getPosts({ category: topic.slug, page }), getPostCategories()]);
  if (page > posts.meta.totalPages) notFound();

  return (
    <PageFrame>
      <PageHeader
        title={topic.name}
        desc={topic.description}
        crumbs={[
          { name: "Trang chủ", href: "/" },
          { name: "Bài viết", href: postsHref },
          { name: topic.name, href: topicHref(topic.slug) },
        ]}
      />
      <TopicNav topics={topics} current={topic.slug} />
      {posts.data.length === 0 ? (
        <EmptyState title="Chủ đề này chưa có bài viết." desc="Bạn xem các chủ đề khác ở hàng phía trên." />
      ) : (
        <PostGrid posts={posts.data} />
      )}
      <Pagination
        page={page}
        totalPages={posts.meta.totalPages}
        hrefFor={(p) => pagedHref(topicHref(topic.slug), p)}
        label={`Phân trang ${topic.name}`}
      />
    </PageFrame>
  );
}
