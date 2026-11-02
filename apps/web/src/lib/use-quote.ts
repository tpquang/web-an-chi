"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "./cart";
import { fetchQuote, type Quote } from "./client-api";

type State =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; error: string }
  | { status: "ready"; quote: Quote; refreshing: boolean };

// Hỏi lại giá và tồn kho mỗi khi giỏ đổi. Kết quả cũ bị bỏ nếu có yêu cầu mới hơn
export function useQuote() {
  const items = useCart();
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<State>({ status: "loading" });
  const requestId = useRef(0);
  const key = JSON.stringify(items);

  useEffect(() => setHydrated(true), []);

  const load = useCallback(async () => {
    const parsed = JSON.parse(key) as typeof items;
    if (parsed.length === 0) {
      setState({ status: "empty" });
      return;
    }
    const id = ++requestId.current;
    setState((prev) => (prev.status === "ready" ? { ...prev, refreshing: true } : { status: "loading" }));
    const result = await fetchQuote(parsed);
    if (id !== requestId.current) return;
    setState(result.ok ? { status: "ready", quote: result.data, refreshing: false } : { status: "error", error: result.error });
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [hydrated, load]);

  return { items, state, reload: load };
}
