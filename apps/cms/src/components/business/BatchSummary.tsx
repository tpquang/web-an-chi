import type { BatchInput, BatchResult } from "../../lib/batch";
import { formatVnd } from "../../lib/format";
import { Panel } from "../ui/Page";

const pct = (value: number) => `${value.toFixed(1).replace(".", ",")}%`;

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "ok" | "err" }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={strong ? "font-medium" : "text-ink-2"}>{label}</dt>
      <dd className={`text-right whitespace-nowrap tabular-nums ${strong ? "font-semibold" : ""} ${tone === "ok" ? "text-ok" : tone === "err" ? "text-err" : ""}`}>{value}</dd>
    </div>
  );
}

// Vốn của đợt và lợi nhuận nếu bán hết số thành phẩm dự kiến. Không gồm chi phí vận hành ban đầu
export function BatchSummary({ batch, result }: { batch: BatchInput; result: BatchResult }) {
  const gap = result.capitalGapVnd;
  return (
    <Panel title="Vốn và lợi nhuận">
      <dl aria-live="polite" className="flex flex-col gap-2 text-sm">
        <Row label="Tiền hàng" value={formatVnd(result.goodsVnd)} />
        <Row label="Chi phí phát sinh" value={formatVnd(result.extrasVnd)} />
        <div className="border-t border-line pt-2"><Row label="Vốn cần cho đợt" value={formatVnd(result.capitalNeededVnd)} strong /></div>
        {gap != null && <Row label={gap >= 0 ? "Vốn còn dư" : "Vốn còn thiếu"} value={formatVnd(Math.abs(gap))} tone={gap >= 0 ? "ok" : "err"} />}
        {result.writeOffVnd > 0 && <Row label="Giá trị hao hụt (đã dồn vào giá vốn)" value={formatVnd(result.writeOffVnd)} tone="err" />}

        <div className="mt-2 border-t border-line pt-2"><Row label="Doanh thu thành phẩm dự kiến" value={formatVnd(result.revenueVnd)} /></div>
        <Row label={`Phí bán ${pct(batch.feePct)}`} value={`− ${formatVnd(result.feeVnd)}`} />
        <Row label="Giá vốn thành phẩm" value={`− ${formatVnd(result.productCostVnd)}`} />
        <div className="border-t border-line pt-2"><Row label="Lợi nhuận khi bán hết" value={formatVnd(result.profitVnd)} strong tone={result.profitVnd >= 0 ? "ok" : "err"} /></div>
        <Row label="Biên lợi nhuận" value={pct(result.marginPct)} />
        <Row label="Nguyên liệu còn dư (theo giá vốn)" value={formatVnd(result.leftoverVnd)} />
      </dl>
      <p className="mt-4 text-[13px] text-ink-3">Chưa trừ chi phí vận hành ban đầu, quảng cáo cố định, lương: phần đó tính riêng khi tính điểm hoà vốn.</p>
    </Panel>
  );
}
