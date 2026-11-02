import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon, SearchIcon } from "../components/icons";
import { ButtonLink } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { DataTable, PageHeader, Pagination, td, tdMoney, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { EmptyState, ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { api } from "../lib/api";
import { formatVnd } from "../lib/format";
import { options, publishStatus, type PublishStatus } from "../lib/labels";
import type { Category, ProductRow } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useQueryState } from "../lib/use-query-state";

export function SearchBox({ value, onSearch, label }: { value: string; onSearch: (value: string) => void; label: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  // Gõ xong 300ms mới lọc để không gọi API mỗi phím
  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onSearch(text.trim()), 300);
    return () => clearTimeout(timer);
  }, [text, value, onSearch]);
  return (
    <div className="relative min-w-0 flex-1 sm:max-w-xs">
      <SearchIcon size={18} className="pointer-events-none absolute top-3.5 left-3 text-ink-3" />
      <Input aria-label={label} placeholder={label} value={text} onChange={(e) => setText(e.target.value)} className="pl-11" />
    </div>
  );
}

export function ProductsPage() {
  const query = useQueryState(["q", "status", "category"] as const);
  const categories = useLoad(() => api.get<Category[]>("/categories"), []);
  const { state, slow, reload } = useLoad(() => api.list<ProductRow>(`/products?${query.toQuery({ limit: 20 })}`), [query.toQuery()]);

  const categoryOptions = [
    { value: "", label: "Mọi danh mục" },
    ...(categories.state.status === "ready" ? categories.state.data.map((c) => ({ value: c.id, label: c.name })) : []),
  ];

  return (
    <>
      <PageHeader
        title="Sản phẩm"
        actions={
          <ButtonLink to="/products/new">
            <PlusIcon size={18} /> Thêm sản phẩm
          </ButtonLink>
        }
      />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <SearchBox label="Tìm theo tên hoặc slug" value={query.values.q} onSearch={(q) => query.set({ q })} />
        <div className="sm:w-48">
          <Select
            ariaLabel="Lọc theo trạng thái"
            value={query.values.status}
            onChange={(status) => query.set({ status })}
            options={[{ value: "", label: "Mọi trạng thái" }, ...options(publishStatus)]}
          />
        </div>
        <div className="sm:w-56">
          <Select ariaLabel="Lọc theo danh mục" value={query.values.category} onChange={(category) => query.set({ category })} options={categoryOptions} />
        </div>
      </div>

      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được danh sách sản phẩm" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.data.length === 0 && (
        <EmptyState
          title={query.values.q || query.values.status || query.values.category ? "Không có sản phẩm khớp bộ lọc." : "Chưa có sản phẩm nào."}
          desc="Thêm sản phẩm đầu tiên, hoặc bỏ bớt bộ lọc."
          action={<ButtonLink to="/products/new">Thêm sản phẩm</ButtonLink>}
        />
      )}
      {state.status === "ready" && state.data.data.length > 0 && (
        <>
          <DataTable
            head={
              <tr>
                <th className={th}>Tên</th>
                <th className={th}>Danh mục</th>
                <th className={`${th} text-right`}>Giá</th>
                <th className={`${th} text-right`}>Tồn kho</th>
                <th className={th}>Trạng thái</th>
              </tr>
            }
          >
            {state.data.data.map((product) => (
              <tr key={product.id} className="hover:bg-paper">
                <td className={td}>
                  <Link to={`/products/${product.id}`} className="font-medium hover:text-wood">
                    {product.name}
                  </Link>
                  {product.featured && <span className="ml-2 text-xs text-ink-3">Tiêu biểu</span>}
                </td>
                <td className={td}>{product.category.name}</td>
                <td className={tdMoney}>{formatVnd(product.priceVnd)}</td>
                <td className={`${tdMoney} ${product.stock === 0 ? "text-err" : ""}`}>{product.stock}</td>
                <td className={td}>
                  <Tag tone={publishStatus[product.status as PublishStatus].tone}>{publishStatus[product.status as PublishStatus].label}</Tag>
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={query.page} totalPages={state.data.meta.totalPages} onPage={(page) => query.set({ page })} />
        </>
      )}
    </>
  );
}
