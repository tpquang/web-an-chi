const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "anchi-cms-token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public issues?: { path: (string | number)[]; message: string }[],
  ) {
    super(message);
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
  window.dispatchEvent(new Event("anchi-auth"));
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1/admin${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Không kết nối được API. Kiểm tra mạng hoặc API đã chạy chưa.");
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== "/login") setToken(null);
  if (!res.ok) throw new ApiError(res.status, json.error ?? `Lỗi ${res.status}`, json.code, json.issues);
  return json.data as T;
}

export type Page<T> = { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } };

// Danh sách có phân trang cần cả meta nên đọc thẳng body
async function list<T>(path: string): Promise<Page<T>> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1/admin${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new ApiError(0, "Không kết nối được API. Kiểm tra mạng hoặc API đã chạy chưa.");
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) setToken(null);
  if (!res.ok) throw new ApiError(res.status, json.error ?? `Lỗi ${res.status}`, json.code);
  return json;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  list,
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: (path: string) => request<void>("DELETE", path),
};

export function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Có lỗi chưa rõ nguyên nhân. Bạn thử lại.";
}

// Lỗi kiểm dữ liệu của API trả theo đường dẫn trường, đổi thành { tenTruong: câu báo }
export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError) || !err.issues) return {};
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export async function apiHealth() {
  const res = await fetch(`${API_URL}/health`);
  return res.ok;
}
