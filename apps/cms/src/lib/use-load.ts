import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./api";

type State<T> = { status: "loading" } | { status: "error"; error: string } | { status: "ready"; data: T };

// Tải dữ liệu cho màn hình. Skeleton chỉ hiện khi chờ quá 300ms để không nháy
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ status: "loading" });
  const [slow, setSlow] = useState(false);
  const requestId = useRef(0);

  const run = useCallback(load, deps);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setState((prev) => (prev.status === "ready" ? prev : { status: "loading" }));
    const timer = setTimeout(() => setSlow(true), 300);
    try {
      const data = await run();
      if (id === requestId.current) setState({ status: "ready", data });
    } catch (err) {
      if (id === requestId.current) setState({ status: "error", error: errorMessage(err) });
    } finally {
      clearTimeout(timer);
      if (id === requestId.current) setSlow(false);
    }
  }, [run]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { state, slow, reload, setData: (data: T) => setState({ status: "ready", data }) };
}
