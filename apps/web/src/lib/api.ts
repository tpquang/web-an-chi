import "server-only";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const REVALIDATE_SECONDS = 60;
// Quá thời gian này thì coi BE lỗi để trang trả 500 thay vì treo
const TIMEOUT_MS = 8000;

export type Image = { id: string; url: string; alt: string | null };
export type Spec = { label: string; value: string };

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  guide: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
  _count?: { products: number };
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  usage: string | null;
  specs: Spec[] | null;
  priceVnd: number;
  compareAtPriceVnd: number | null;
  stock: number;
  origin: string | null;
  featured: boolean;
  shopeeUrl: string | null;
  tiktokUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
  category: { id: string; name: string; slug: string };
  images: Image[];
};

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  authorName: string;
  publishedAt: string;
  updatedAt: string;
  category: { name: string; slug: string };
};

export type Post = PostSummary & {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  products: Product[];
};

export type PostCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
  _count?: { posts: number };
};

export type Store = {
  name: string;
  phone: string;
  email: string;
  address: string;
  openingHours?: string;
  shopeeUrl?: string;
  tiktokUrl?: string;
  shipping: { flatFeeVnd: number; freeFromVnd: number | null; eta: string };
  returnPolicy: string;
};

export type Paged<T> = { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } };

export type OrderSummary = {
  code: string;
  createdAt: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED";
  paymentMethod: "COD" | "BANK_TRANSFER";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  subtotalVnd: number;
  shippingVnd: number;
  totalVnd: number;
  items: { productName: string; unitPriceVnd: number; quantity: number }[];
  payment: { bankName: string; accountNumber: string; accountName: string; transferNote: string } | null;
};

type Options = { fresh?: boolean };

// Chỉ trả null khi BE nói 404. Lỗi khác ném tiếp để trang trả 500, không thành soft 404
async function get<T>(path: string, { fresh }: Options = {}): Promise<T | null> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...(fresh ? { cache: "no-store" } : { next: { revalidate: REVALIDATE_SECONDS } }),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} responded ${res.status}`);
  return res.json();
}

async function must<T>(path: string): Promise<T> {
  const body = await get<T>(path);
  if (!body) throw new Error(`API ${path} responded 404`);
  return body;
}

function query(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
  return search.toString();
}

export const PRODUCTS_PER_PAGE = 12;
export const POSTS_PER_PAGE = 9;

export function getProducts(params: { page?: number; limit?: number; category?: string; featured?: boolean; exclude?: string } = {}) {
  return must<Paged<Product>>(`/products?${query({ limit: PRODUCTS_PER_PAGE, ...params })}`);
}

export async function getProduct(slug: string) {
  const body = await get<{ data: Product & { posts: Pick<PostSummary, "title" | "slug" | "excerpt" | "publishedAt">[] } }>(
    `/products/${encodeURIComponent(slug)}`,
  );
  return body?.data ?? null;
}

export async function getCategories() {
  return (await must<{ data: Category[] }>("/categories")).data;
}

export async function getCategory(slug: string) {
  return (await get<{ data: Category }>(`/categories/${encodeURIComponent(slug)}`))?.data ?? null;
}

export function getPosts(params: { page?: number; limit?: number; category?: string; exclude?: string } = {}) {
  return must<Paged<PostSummary>>(`/posts?${query({ limit: POSTS_PER_PAGE, ...params })}`);
}

export async function getPost(slug: string) {
  return (await get<{ data: Post }>(`/posts/${encodeURIComponent(slug)}`))?.data ?? null;
}

export async function getPostCategories() {
  return (await must<{ data: PostCategory[] }>("/post-categories")).data;
}

export async function getPostCategory(slug: string) {
  return (await get<{ data: PostCategory }>(`/post-categories/${encodeURIComponent(slug)}`))?.data ?? null;
}

export async function getStore() {
  return (await must<{ data: Store }>("/settings/store")).data;
}

export async function getOrder(code: string) {
  return (await get<{ data: OrderSummary }>(`/orders/${encodeURIComponent(code)}`, { fresh: true }))?.data ?? null;
}

export type Account = {
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  marketingConsent: boolean;
  orders: (Pick<OrderSummary, "code" | "createdAt" | "status" | "paymentMethod" | "paymentStatus" | "totalVnd"> & {
    items: { productName: string; quantity: number }[];
  })[];
};

// Trả null khi chưa đăng nhập hoặc phiên hết hạn
export async function getAccount(token: string | null) {
  if (!token) return null;
  const res = await fetch(`${API_URL}/api/v1/account/me`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`API /account/me responded ${res.status}`);
  return ((await res.json()) as { data: Account }).data;
}

// Route handler của web chuyển tiếp request của trình duyệt tới API, kèm token khách nếu có
export async function forward(path: string, { method = "POST", body, token }: { method?: string; body?: unknown; token?: string | null } = {}) {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return new Response(res.body, { status: res.status, headers: { "content-type": "application/json" } });
}

export type Bead = {
  id: string;
  name: string;
  slug: string;
  kind: "BEAD" | "CHARM";
  material: string;
  sizeMm: number;
  priceVnd: number;
  stock: number;
  color: string;
  finish: string;
  note: string | null;
  // Ảnh vân chất liệu tải ở CMS, null thì hạt dùng màu trơn
  texture: { id: string; version: number; roughness: number } | null;
};


export type BraceletRules = {
  wristCm: { min: number; max: number };
  maxLengthMm: number;
  minBeads: number;
  maxBeads: number;
  feeVnd: number;
  leadTime: string;
  cords: { id: string; name: string }[];
  fits: { id: string; name: string; easeCm: number }[];
  extras: {
    engraving: { name: string; priceVnd: number; maxLength: number };
    giftBox: { name: string; priceVnd: number };
    card: { name: string; priceVnd: number; maxLength: number };
    giftWrap: { name: string; priceVnd: number };
  };
};

export async function getBracelet() {
  return (await must<{ data: { rules: BraceletRules; beads: Bead[] } }>("/bracelet")).data;
}
