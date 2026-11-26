"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { launchLabel, msToLaunch } from "@/lib/launch";

// Giờ mở bán lấy từ cài đặt cửa hàng ở root layout, mọi component client đọc qua đây.
// initialOpen do server tính lúc dựng trang nên HTML và lần render đầu ở trình duyệt luôn khớp
const LaunchContext = createContext<{ at: number | null; initialOpen: boolean }>({ at: null, initialOpen: true });

export function LaunchProvider({ at, initialOpen, children }: { at: number | null; initialOpen: boolean; children: ReactNode }) {
  return <LaunchContext value={{ at, initialOpen }}>{children}</LaunchContext>;
}

// Ngày mở bán dạng chữ, ví dụ 12/12/2026
export function useLaunchLabel() {
  return launchLabel(useContext(LaunchContext).at);
}

// Sau khi mount, đồng hồ của trình duyệt quyết định: trang cache cũ vẫn tự mở đúng giờ.
// left là null trước khi mount, vì giờ trên server (trang cache 60 giây) không khớp giờ của khách
export function useLaunch() {
  const { at, initialOpen } = useContext(LaunchContext);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    // Không dùng setTimeout tới giờ mở bán: quá 24,8 ngày thì trình duyệt cho chạy ngay
    const tick = () => {
      const ms = msToLaunch(at);
      setLeft(ms);
      if (ms === 0) clearInterval(id);
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [at]);

  return { open: left === null ? initialOpen : left === 0, left };
}

// Trước giờ mở bán hiện `waiting`, sau đó hiện `children` (nút mua)
export function LaunchGate({ waiting, children }: { waiting: ReactNode; children?: ReactNode }) {
  const { open } = useLaunch();
  return <>{open ? children : waiting}</>;
}

const units = [
  { label: "Ngày", ms: 86_400_000, wrap: Infinity },
  { label: "Giờ", ms: 3_600_000, wrap: 24 },
  { label: "Phút", ms: 60_000, wrap: 60 },
  { label: "Giây", ms: 1000, wrap: 60 },
];

const tones = {
  // Trên nền kem của trang
  paper: "bg-surface border border-edge",
  // Trong tấm surface
  surface: "bg-paper-2",
};

// Bốn ô ngày, giờ, phút, giây. Trước khi mount hiện gạch giữ chỗ, ô rộng cố định nên không giật
export function LaunchCountdown({ size = "md", tone = "surface" }: { size?: "md" | "lg"; tone?: keyof typeof tones }) {
  const { left } = useLaunch();
  const values = units.map((unit) => (left === null ? null : Math.floor(left / unit.ms) % unit.wrap));
  // Máy đọc màn hình nghe một câu gọn, không đọc lại mỗi giây
  const spoken = values[0] === null ? "Đang tính thời gian" : `Còn ${values[0]} ngày ${values[1]} giờ ${values[2]} phút`;

  return (
    <div role="timer" aria-label={`${spoken} đến giờ mở bán`} className={`flex w-full gap-2 ${size === "lg" ? "max-w-sm" : "max-w-72"}`}>
      {units.map((unit, i) => (
        <div
          key={unit.label}
          aria-hidden
          className={`flex min-w-0 flex-1 flex-col items-center rounded-2xl ${tones[tone]} ${size === "lg" ? "py-3 sm:py-4" : "py-2"}`}
        >
          <span className={`font-serif leading-none font-semibold tabular-nums ${size === "lg" ? "text-[32px] sm:text-[40px]" : "text-2xl"}`}>
            {values[i] === null ? "--" : String(values[i]).padStart(2, "0")}
          </span>
          <span className="mt-1.5 text-xs text-ink-3">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
