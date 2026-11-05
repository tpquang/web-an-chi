import { useState } from "react";
import { formatVnd } from "../../lib/format";
import { monthLabel, type MonthRow } from "../../lib/finance";

// Cột doanh thu theo tháng, một chuỗi nên không cần chú thích; lợi nhuận ròng xem trong tooltip và bảng bên dưới.
// Không vẽ hai trục: doanh thu và lợi nhuận khác thang, đặt chung một cột sẽ đọc sai.
const H = 160;

export function MonthChart({ months }: { months: MonthRow[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...months.map((m) => m.revenueVnd));
  const active = hover === null ? null : months[hover];

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative">
        <div className="flex h-40 items-end gap-0.5 border-b border-line" role="img" aria-label="Doanh thu theo tháng, số liệu chi tiết trong bảng bên dưới">
          {months.map((m, i) => {
            const h = Math.round((m.revenueVnd / max) * H);
            return (
              <button
                key={m.month}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                aria-label={`${monthLabel(m.month)}: doanh thu ${formatVnd(m.revenueVnd)}, lợi nhuận ròng ${formatVnd(m.netProfitVnd)}`}
                className="group flex h-full flex-1 items-end justify-center"
              >
                <span
                  className={`block w-full max-w-10 rounded-t-[4px] transition-colors duration-(--d-fast) ${hover === i ? "bg-wood-hover" : "bg-wood"}`}
                  style={{ height: Math.max(m.revenueVnd > 0 ? 2 : 0, h) }}
                />
              </button>
            );
          })}
        </div>
        {active && (
          <div className="pointer-events-none absolute top-0 right-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm shadow-e2" aria-hidden>
            <p className="font-semibold">{monthLabel(active.month)}</p>
            <p className="text-ink-2">Doanh thu <span className="tabular-nums text-ink">{formatVnd(active.revenueVnd)}</span></p>
            <p className="text-ink-2">Lợi nhuận ròng <span className="tabular-nums text-ink">{formatVnd(active.netProfitVnd)}</span></p>
            <p className="text-ink-2">{active.orders} đơn</p>
          </div>
        )}
      </div>
      <div className="flex gap-0.5 text-[11px] text-ink-3">
        {months.map((m) => (
          <span key={m.month} className="flex-1 truncate text-center">
            {monthLabel(m.month)}
          </span>
        ))}
      </div>
    </figure>
  );
}
