import { useSearchParams } from "react-router-dom";

// Bộ lọc và trang nằm trên URL để quay lại hay gửi link vẫn đúng chỗ
export function useQueryState<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams();
  const values = Object.fromEntries(keys.map((key) => [key, params.get(key) ?? ""])) as Record<K, string>;
  const page = Math.max(1, Number(params.get("page")) || 1);

  function set(patch: Partial<Record<K | "page", string | number | null>>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "" || value === undefined) next.delete(key);
      else next.set(key, String(value));
    }
    // Đổi bộ lọc thì về trang 1
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  }

  function toQuery(extra: Record<string, string | number> = {}) {
    const query = new URLSearchParams();
    for (const key of keys) if (values[key]) query.set(key, values[key]);
    query.set("page", String(page));
    for (const [key, value] of Object.entries(extra)) query.set(key, String(value));
    return query.toString();
  }

  return { values, page, set, toQuery };
}
