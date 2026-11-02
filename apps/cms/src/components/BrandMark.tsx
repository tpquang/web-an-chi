// Logo vector ở design/logo, bản trong apps/cms/public chỉ dùng làm mask nên màu theo currentColor
export function BrandMark({ className = "size-8" }: { className?: string }) {
  return <span aria-hidden className={`inline-block flex-none bg-current [mask:url(/logo-mark.svg)_center/contain_no-repeat] ${className}`} />;
}

export function BrandLogo({ className = "h-8" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="An Chi"
      style={{ aspectRatio: "1038/250" }}
      className={`inline-block flex-none bg-current [mask:url(/logo-inline.svg)_center/contain_no-repeat] ${className}`}
    />
  );
}
