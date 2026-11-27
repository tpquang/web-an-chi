// Điểm hoà vốn theo kỳ (tháng hoặc khoảng tháng) cho báo cáo lợi nhuận.
// Lãi góp = tiền hàng - giá vốn - phí sàn + (ship thu khách - ship thực trả): phần còn lại sau chi phí đi theo từng đơn.
// Chi phí cố định = chi phí phát sinh (mặt bằng, lương, quảng cáo...) + chi phí khác của đợt nhập không chia vào giá vốn.
// Doanh thu hoà vốn = chi phí cố định / tỉ lệ lãi góp, giả định cơ cấu hàng bán giữ như kỳ đang xem.

export type BreakEvenInput = {
  revenueVnd: number;
  costVnd: number;
  platformFeeVnd: number;
  shippingVnd: number;
  shippingCostVnd: number;
  expensesVnd: number;
  batchOtherVnd: number;
};

export type BreakEven = {
  fixedCostVnd: number;
  contributionVnd: number;
  // % lãi góp trên doanh thu, một chữ số thập phân. null khi chưa có doanh thu
  contributionPct: number | null;
  // Doanh thu tiền hàng cần có để bù đủ chi phí cố định. null khi chưa tính được (chưa bán, hoặc bán lỗ trên từng đơn)
  breakEvenRevenueVnd: number | null;
  // Doanh thu còn thiếu để hoà vốn, 0 khi đã qua điểm hoà vốn
  revenueGapVnd: number | null;
  // % chặng đường tới điểm hoà vốn, 100 là vừa hoà
  progressPct: number | null;
};

export function breakEven(b: BreakEvenInput): BreakEven {
  const fixedCostVnd = b.expensesVnd + b.batchOtherVnd;
  const contributionVnd = b.revenueVnd - b.costVnd - b.platformFeeVnd + b.shippingVnd - b.shippingCostVnd;
  const ratio = b.revenueVnd > 0 ? contributionVnd / b.revenueVnd : null;
  const breakEvenRevenueVnd = fixedCostVnd === 0 ? 0 : ratio !== null && ratio > 0 ? Math.ceil(fixedCostVnd / ratio) : null;
  return {
    fixedCostVnd,
    contributionVnd,
    contributionPct: ratio === null ? null : Math.round(ratio * 1000) / 10,
    breakEvenRevenueVnd,
    revenueGapVnd: breakEvenRevenueVnd === null ? null : Math.max(0, breakEvenRevenueVnd - b.revenueVnd),
    progressPct: breakEvenRevenueVnd === null ? null : breakEvenRevenueVnd === 0 ? 100 : Math.round((b.revenueVnd / breakEvenRevenueVnd) * 1000) / 10,
  };
}
