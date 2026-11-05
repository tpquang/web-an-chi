"use client";

import { useId } from "react";
import { MinusIcon, PlusIcon } from "../icons";

type Props = {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
};

// Không cho vượt tồn kho, và nói rõ khi đã chạm giới hạn
export function QuantityInput({ value, max, onChange, label, disabled }: Props) {
  const hintId = useId();
  const atMax = value >= max;
  const set = (next: number) => onChange(Math.min(Math.max(1, Number.isFinite(next) ? next : 1), max));

  return (
    <div className="flex flex-col gap-1.5">
      <div role="group" aria-label={label} className="inline-flex h-11 w-fit items-stretch rounded-full border border-line-strong bg-surface">
        <button
          type="button"
          aria-label="Giảm số lượng"
          disabled={disabled || value <= 1}
          onClick={() => set(value - 1)}
          className="inline-flex w-11 items-center justify-center text-ink-2 hover:text-wood disabled:opacity-40"
        >
          <MinusIcon size={18} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          aria-label="Số lượng"
          aria-describedby={atMax ? hintId : undefined}
          value={value}
          disabled={disabled}
          onChange={(event) => set(Number.parseInt(event.target.value.replace(/\D/g, ""), 10))}
          className="w-12 border-x border-line bg-transparent px-1 text-center text-base tabular-nums focus:outline-none"
        />
        <button
          type="button"
          aria-label="Tăng số lượng"
          disabled={disabled || atMax}
          onClick={() => set(value + 1)}
          className="inline-flex w-11 items-center justify-center text-ink-2 hover:text-wood disabled:opacity-40"
        >
          <PlusIcon size={18} />
        </button>
      </div>
      {atMax && (
        <p id={hintId} className="text-sm text-ink-3">
          Shop còn {max} sản phẩm.
        </p>
      )}
    </div>
  );
}
