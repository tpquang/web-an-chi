import { useEffect, useState } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "./icons";

type Mode = "light" | "dark" | "system";
const KEY = "anchi-theme";

function readMode(): Mode {
  try {
    const stored = localStorage.getItem(KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

const media = () => matchMedia("(prefers-color-scheme: dark)");

function apply(mode: Mode) {
  document.documentElement.dataset.theme = mode === "system" ? (media().matches ? "dark" : "light") : mode;
}

const modes = [
  { value: "light", label: "Sáng", Icon: SunIcon },
  { value: "dark", label: "Tối", Icon: MoonIcon },
  { value: "system", label: "Theo máy", Icon: MonitorIcon },
] as const;

// Ba lựa chọn loại trừ nên dùng radio. "Theo máy" xoá lựa chọn đã lưu và đổi theo hệ điều hành
export function ThemeToggle({ compact }: { compact?: boolean }) {
  const [mode, setMode] = useState<Mode>(readMode);

  useEffect(() => {
    if (mode !== "system") return;
    const query = media();
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [mode]);

  function choose(next: Mode) {
    try {
      if (next === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {}
    apply(next);
    setMode(next);
  }

  return (
    <div role="radiogroup" aria-label="Giao diện" className="inline-flex rounded-full border border-line bg-paper p-0.5">
      {modes.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={compact ? label : undefined}
            title={label}
            onClick={() => choose(value)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2 text-sm ${active ? "bg-wood text-on-wood" : "text-ink-2 hover:text-wood"}`}
          >
            <Icon size={18} />
            {!compact && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
