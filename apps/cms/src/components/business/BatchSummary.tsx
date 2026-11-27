import { batchBreakEven, type BatchInput, type BatchResult } from "../../lib/batch";
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
  const be = batchBreakEven(result);
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
      <div className="mt-4 border-t border-line pt-3 text-sm">
        <p className="font-medium">Hoà vốn đợt nhập</p>
        {!be ? (
          <p className="mt-1 text-ink-2">Nhập số dự kiến đóng ở mục Quy đổi để tính phải bán bao nhiêu thì thu đủ vốn.</p>
        ) : be.reachable ? (
          <>
            <p className="mt-1 text-ink-2">
              Bán khoảng {pct(be.planPct)} số dự kiến, tức {be.totalUnits.toLocaleString("vi-VN")} thành phẩm, là thu đủ {formatVnd(result.capitalNeededVnd)} vốn. Phần bán sau đó là lãi.
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {be.units.map((u) => (
                <li key={u.productId} className="flex justify-between gap-4">
                  <span className="text-ink-2">{u.name}</span>
                  <span className="whitespace-nowrap tabular-nums">{u.quantity.toLocaleString("vi-VN")} / {u.of.toLocaleString("vi-VN")}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p role="status" className="mt-1 text-err">
            Bán hết số dự kiến vẫn thiếu {formatVnd(be.shortfallVnd)} mới đủ vốn. Đóng thêm thành phẩm từ nguyên liệu còn dư, hoặc xem lại giá bán.
          </p>
        )}
      </div>
      <p className="mt-4 text-[13px] text-ink-3">Chưa trừ chi phí vận hành ban đầu, lương, mặt bằng: điểm hoà vốn theo tháng có ở Báo cáo lợi nhuận.</p>
    </Panel>
  );
}
