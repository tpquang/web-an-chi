// Biểu tượng vector ở design/logo, bản trong apps/cms/public chỉ dùng làm mask nên màu theo currentColor
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return <span aria-hidden className={`inline-block flex-none bg-current [mask:url(/logo-mark.svg)_center/contain_no-repeat] ${className}`} />;
}

// Logo = biểu tượng + chữ thật bằng Cormorant SC, cỡ theo font-size của nơi dùng
export function BrandLogo({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-none items-center gap-[0.4em] leading-none ${className}`}>
      <BrandMark className="size-[1.4em]" />
      <span className="font-serif font-semibold tracking-[0.12em] uppercase">An Chi</span>
    </span>
  );
}
