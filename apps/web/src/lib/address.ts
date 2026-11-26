"use client";

import { useEffect, useState } from "react";

// Địa giới hành chính từ 01/07/2025: 34 tỉnh, thành phố và 3.321 phường, xã. Không còn cấp quận, huyện.
// File tĩnh public/data/dia-gioi-2025.json dạng [mã tỉnh, tên tỉnh, [[mã xã, tên xã], ...]], nguồn provinces.open-api.vn (bản v2).
// Chỉ tải ở trang thanh toán, khoảng 26 KB sau nén
export type Ward = { code: number; name: string };
export type Province = { code: number; name: string; wards: Ward[] };

const URL = "/data/dia-gioi-2025.json";
let cache: Promise<Province[]> | null = null;

export function loadDivisions() {
  cache ??= fetch(URL)
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      return res.json() as Promise<[number, string, [number, string][]][]>;
    })
    .then((rows) => rows.map(([code, name, wards]) => ({ code, name, wards: wards.map(([c, n]) => ({ code: c, name: n })) })))
    .catch((error) => {
      cache = null;
      throw error;
    });
  return cache;
}

export function useDivisions() {
  const [state, setState] = useState<{ data: Province[] | null; failed: boolean }>({ data: null, failed: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    loadDivisions().then(
      (data) => live && setState({ data, failed: false }),
      () => live && setState({ data: null, failed: true }),
    );
    return () => {
      live = false;
    };
  }, [attempt]);
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

// Địa chỉ gửi API vẫn là một chuỗi: "số nhà đường, phường xã, tỉnh thành"
export function composeAddress(street: string, ward?: Ward, province?: Province) {
  return [street.trim(), ward?.name, province?.name].filter(Boolean).join(", ");
}

// Đọc ngược địa chỉ đã lưu trong tài khoản. Chỉ nhận khi đuôi khớp đúng tên xã và tỉnh, không đoán
export function parseAddress(text: string, provinces: Province[]) {
  const parts = text.split(",").map((part) => part.trim());
  if (parts.length < 3) return null;
  const province = provinces.find((p) => p.name === parts.at(-1));
  const ward = province?.wards.find((w) => w.name === parts.at(-2));
  if (!province || !ward) return null;
  return { provinceCode: province.code, wardCode: ward.code, street: parts.slice(0, -2).join(", ") };
}
