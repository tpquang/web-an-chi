import { Link } from "react-router-dom";
import { PlusIcon } from "../components/icons";
import { ButtonLink } from "../components/ui/Button";
import { DataTable, PageHeader, Pagination, td, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { FeaturedToggle } from "../components/FeaturedToggle";
import { EmptyState, ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { options, publishStatus } from "../lib/labels";
import type { Category, PostRow } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useQueryState } from "../lib/use-query-state";
import { SearchBox } from "./ProductsPage";

export function PostsPage() {
  const query = useQueryState(["q", "status", "category"] as const);
  const topics = useLoad(() => api.get<Category[]>("/post-categories"), []);
  const { state, slow, reload } = useLoad(() => api.list<PostRow>(`/posts?${query.toQuery({ limit: 20 })}`), [query.toQuery()]);

  return (
    <>
      <PageHeader title="Bài viết" actions={<ButtonLink to="/posts/new"><PlusIcon size={18} /> Viết bài mới</ButtonLink>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchBox label="Tìm theo tiêu đề" value={query.values.q} onSearch={(q) => query.set({ q })} />
        <div className="sm:w-48">
          <Select ariaLabel="Lọc theo trạng thái" value={query.values.status} onChange={(status) => query.set({ status })} options={[{ value: "", label: "Mọi trạng thái" }, ...options(publishStatus)]} />
        </div>
        <div className="sm:w-56">
          <Select
            ariaLabel="Lọc theo chủ đề"
            value={query.values.category}
            onChange={(category) => query.set({ category })}
            options={[{ value: "", label: "Mọi chủ đề" }, ...(topics.state.status === "ready" ? topics.state.data.map((t) => ({ value: t.id, label: t.name })) : [])]}
          />
        </div>
      </div>
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được bài viết" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.data.length === 0 && (
        <EmptyState title="Chưa có bài viết khớp bộ lọc." desc="Viết bài đầu tiên hoặc bỏ bớt bộ lọc." action={<ButtonLink to="/posts/new">Viết bài mới</ButtonLink>} />
      )}
      {state.status === "ready" && state.data.data.length > 0 && (
        <>
          <DataTable head={<tr><th className={th}>Tiêu đề</th><th className={th}>Chủ đề</th><th className={th}>Ngày đăng</th><th className={th}>Trạng thái</th><th className={th}>Nổi bật (tối đa 3)</th></tr>}>
            {state.data.data.map((post) => (
              <tr key={post.id} className="hover:bg-paper">
                <td className={td}>
                  <Link to={`/posts/${post.id}`} className="font-medium hover:text-wood">{post.title}</Link>
                  <span className="block text-[13px] text-ink-3">{post.authorName}</span>
                </td>
                <td className={td}>{post.category.name}</td>
                <td className={`${td} whitespace-nowrap`}>{post.publishedAt ? formatDate(post.publishedAt) : "Chưa đăng"}</td>
                <td className={td}><Tag tone={publishStatus[post.status].tone}>{publishStatus[post.status].label}</Tag></td>
                <td className={td}><FeaturedToggle kind="posts" id={post.id} name={post.title} checked={post.featured} onChange={reload} /></td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={query.page} totalPages={state.data.meta.totalPages} onPage={(page) => query.set({ page })} />
        </>
      )}
    </>
  );
}
