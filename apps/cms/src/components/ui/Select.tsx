import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { plain } from "../../lib/format";
import { CheckIcon, ChevronDownIcon } from "../icons";

export type Option<T extends string | number> = { value: T; label: string; searchText?: string; disabled?: boolean };

type Props<T extends string | number> = {
  value: T | null;
  onChange: (value: T) => void;
  options: Option<T>[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

const PANEL_MAX = 280;

// Thay <select> native. Panel portal vào body, tự mở lên khi phía dưới thiếu chỗ
export function Select<T extends string | number>(props: Props<T>) {
  const { value, onChange, options, placeholder = "Chọn", searchable, disabled, id, ariaLabel, className = "" } = props;
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number }>({ left: 0, width: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = plain(query);
    return options.filter((option) => plain(option.searchText ?? option.label).includes(q));
  }, [options, query, searchable]);
  const selected = options.find((option) => option.value === value);

  function place() {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom;
    const up = below < PANEL_MAX + 8 && rect.top > below;
    setPos(up ? { left: rect.left, width: rect.width, bottom: window.innerHeight - rect.top + 4 } : { left: rect.left, width: rect.width, top: rect.bottom + 4 });
  }

  function openPanel() {
    if (disabled) return;
    place();
    setQuery("");
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  }

  function close(focusTrigger = true) {
    setOpen(false);
    if (focusTrigger) trigger.current?.focus();
  }

  function choose(option: Option<T> | undefined) {
    if (!option || option.disabled) return;
    onChange(option.value);
    close();
  }

  useLayoutEffect(() => {
    if (!open) return;
    if (searchable) search.current?.focus();
    else panel.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panel.current?.contains(target) && !trigger.current?.contains(target)) close(false);
    };
    const onMove = () => place();
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  useEffect(() => {
    panel.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function onKey(event: KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openPanel();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(filtered[active]);
    } else if (event.key === "Tab") {
      close(false);
    } else if (!searchable && event.key.length === 1) {
      // Gõ chữ để nhảy tới mục bắt đầu bằng chữ đó
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + event.key, at: now };
      const index = filtered.findIndex((option) => plain(option.label).startsWith(plain(typed.current.text)));
      if (index >= 0) setActive(index);
    }
  }

  return (
    <>
      <button
        ref={trigger}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
        aria-describedby={props["aria-describedby"]}
        aria-invalid={props["aria-invalid"]}
        disabled={disabled}
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={onKey}
        className={`flex h-11 w-full items-center justify-between gap-2 rounded-sm border border-line-strong bg-surface pr-2 pl-3 text-left text-base focus:border-wood focus:shadow-[0_0_0_3px_var(--wood-soft)] focus:outline-none disabled:bg-paper-2 disabled:opacity-60 aria-invalid:border-err ${className}`}
      >
        <span className={`truncate ${selected ? "" : "text-ink-3"}`}>{selected?.label ?? placeholder}</span>
        <ChevronDownIcon size={18} className={`flex-none text-ink-3 transition-transform duration-(--d-fast) ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            tabIndex={-1}
            onKeyDown={onKey}
            style={{ left: pos.left, width: Math.max(pos.width, 200), top: pos.top, bottom: pos.bottom }}
            className="fixed z-(--z-popover) flex max-h-70 flex-col rounded-sm border border-line bg-surface p-1.5 shadow-e2 focus:outline-none"
          >
            {searchable && (
              <input
                ref={search}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                aria-label="Tìm trong danh sách"
                aria-controls={listId}
                aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
                placeholder="Gõ để tìm, không cần dấu"
                className="mb-1.5 h-11 rounded-sm border border-line bg-paper px-3 text-base focus:border-wood focus:outline-none"
              />
            )}
            <ul id={listId} role="listbox" aria-label={ariaLabel} className="overflow-y-auto">
              {filtered.length === 0 && <li className="px-3 py-2.5 text-sm text-ink-3">Không có mục phù hợp.</li>}
              {filtered.map((option, index) => {
                const isSelected = option.value === value;
                return (
                  <li
                    key={String(option.value)}
                    id={`${listId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(option)}
                    className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-sm px-3 text-sm ${index === active ? "bg-paper-2" : ""} ${isSelected ? "font-semibold text-wood" : ""} ${option.disabled ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <CheckIcon size={16} />}
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
