import { useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

type Theme = "light" | "dark";
const KEY = "anchi-theme";

// Chưa chọn lần nào thì theo hệ điều hành. Bấm là chuyển sang theme còn lại và nhớ lựa chọn
function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Một nút icon: đang sáng hiện mặt trăng (bấm để tối), đang tối hiện mặt trời
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(current);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng";

  function toggle() {
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex size-11 items-center justify-center rounded-sm text-ink-2 transition-colors duration-(--d-fast) hover:bg-paper-2 hover:text-wood"
    >
      {next === "dark" ? <MoonIcon size={20} /> : <SunIcon size={20} />}
    </button>
  );
}
