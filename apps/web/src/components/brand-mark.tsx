import { site } from "@/lib/site";

// Biểu tượng vector ở design/logo, bản trong public/brand chỉ dùng làm mask nên màu lấy từ currentColor
// và tự đổi theo theme: đặt text-wood, text-on-wood... ở nơi dùng.
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block flex-none bg-current [mask:url(/brand/logo-mark.svg)_center/contain_no-repeat] ${className}`}
    />
  );
}

// Logo = biểu tượng + chữ thật bằng Playfair Display SC, không dùng chữ đã vẽ thành path.
// Cỡ logo theo font-size: đặt text-2xl, text-5xl... ở nơi dùng, mọi phần đo bằng em.
// inline: cho header, footer. stacked: có dòng TRẦM HƯƠNG, chỉ dùng khi chữ từ 2.25rem trở lên để dòng phụ còn đọc được
export function BrandLogo({ variant = "inline", className = "" }: { variant?: "inline" | "stacked"; className?: string }) {
  if (variant === "stacked") {
    return (
      <span className={`inline-flex flex-none flex-col items-center gap-[0.3em] leading-none ${className}`}>
        <BrandMark className="size-[2.6em]" />
        <span className="font-serif tracking-[0.12em] uppercase">An Chi</span>
        <span className="font-sans text-[0.3em] font-medium tracking-[0.45em] uppercase">Trầm Hương</span>
        <span className="sr-only">{site.name}</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex flex-none items-center gap-[0.4em] leading-none ${className}`}>
      <BrandMark className="size-[1.4em]" />
      <span className="font-serif tracking-[0.12em] uppercase">An Chi</span>
    </span>
  );
}
