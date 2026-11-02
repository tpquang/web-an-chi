import { notFound } from "next/navigation";
import { PostGrid } from "@/components/post-card";
import { TopicNav } from "@/components/topic-nav";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/states";
import { getPostCategories, getPosts } from "@/lib/api";
import { pagedHref, postsHref } from "@/lib/links";
import { pageMeta, parsePage } from "@/lib/seo";

type Props = { searchParams: Promise<{ trang?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props) {
  const page = parsePage((await searchParams).trang);
  return pageMeta({
    title: page > 1 ? `Bài viết về trầm hương, trang ${page}` : "Bài viết về trầm hương",
    description:
      "Kiến thức trầm hương, cách phân biệt trầm thật, hướng dẫn đốt nhang, xông nụ, bảo quản vòng tay và chuẩn bị trầm cho các dịp lễ trong năm.",
    path: pagedHref(postsHref, page),
  });
}

export default async function PostsPage({ searchParams }: Props) {
  const page = parsePage((await searchParams).trang);
  const [posts, topics] = await Promise.all([getPosts({ page }), getPostCategories()]);
  if (page > posts.meta.totalPages) notFound();

  return (
    <PageFrame>
      <PageHeader
        title="Bài viết về trầm hương"
        desc="Kiến thức, hướng dẫn sử dụng và chuẩn bị cho các dịp lễ."
        crumbs={[
          { name: "Trang chủ", href: "/" },
          { name: "Bài viết", href: postsHref },
        ]}
      />
      <TopicNav topics={topics} />
      {posts.data.length === 0 ? (
        <EmptyState title="Shop đang viết những bài đầu tiên." desc="Trong lúc chờ, bạn xem thông tin chi tiết trên từng trang sản phẩm." />
      ) : (
        <PostGrid posts={posts.data} />
      )}
      <Pagination page={page} totalPages={posts.meta.totalPages} hrefFor={(p) => pagedHref(postsHref, p)} label="Phân trang bài viết" />
    </PageFrame>
  );
}
