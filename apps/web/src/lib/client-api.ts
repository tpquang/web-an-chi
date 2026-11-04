"use client";

import type { CartItem } from "./cart";

export type QuoteLine = {
  slug: string;
  quantity: number;
  problem: "UNAVAILABLE" | "OUT_OF_STOCK" | "NOT_ENOUGH" | "TOO_LONG" | "TOO_SHORT" | null;
  lineTotalVnd: number;
  product: {
    id: string;
    name: string;
    categoryName: string;
    image: { url: string; alt: string | null } | null;
    unitPriceVnd: number;
    stock: number;
  } | null;
  // Chỉ có ở vòng tự thiết kế
  design: {
    beads: string[];
    beadDetails: { slug: string; name: string; sizeMm: number; priceVnd: number }[];
    cordName?: string;
    fitName?: string;
    wristCm: number;
    lengthMm: number;
    engraving: string | null;
    giftBox: boolean;
    card: string | null;
    giftWrap: boolean;
  } | null;
};

export type Quote = {
  lines: QuoteLine[];
  subtotalVnd: number;
  shippingVnd: number;
  totalVnd: number;
  shipping: { flatFeeVnd: number; freeFromVnd: number | null; eta: string };
  canCheckout: boolean;
};

export type ApiFailure = {
  ok: false;
  status: number;
  error: string;
  code?: string;
  issues?: { path: (string | number)[]; message: string }[];
};

export type ApiResult<T> = { ok: true; status: number; data: T } | ApiFailure;

const NETWORK_ERROR = "Không gửi được yêu cầu. Bạn kiểm tra kết nối mạng rồi thử lại.";

// Gọi route handler của chính web, không gọi thẳng API
export async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return { ok: false, status: 0, error: NETWORK_ERROR };
  }
  const json = await res.json().catch(() => ({}));
  if (res.ok) return { ok: true, status: res.status, data: json.data as T };
  return { ok: false, status: res.status, error: json.error ?? NETWORK_ERROR, code: json.code, issues: json.issues };
}

export function fetchQuote(items: CartItem[]) {
  return postJson<Quote>("/api/cart/quote", { items });
}
