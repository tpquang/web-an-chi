import type { ReactNode } from "react";

const tones = {
  neutral: "bg-paper-2 text-ink-2",
  wood: "bg-wood-soft text-wood",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  err: "bg-err-soft text-err",
  info: "bg-info-soft text-info",
};

export type Tone = keyof typeof tones;

export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex h-5.5 items-center rounded-full px-2 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}
