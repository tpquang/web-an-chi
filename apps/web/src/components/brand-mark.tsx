import { site } from "@/lib/site";

// Logo vector ở design/logo, bản trong public/brand chỉ dùng làm mask nên màu lấy từ currentColor
// và tự đổi theo theme: đặt text-wood, text-on-wood... ở nơi dùng.
// Class mask phải viết đủ chữ, không ghép chuỗi, để Tailwind quét ra được
const masks = {
  mark: "bg-current [mask:url(/brand/logo-mark.svg)_center/contain_no-repeat]",
  inline: "bg-current [mask:url(/brand/logo-inline.svg)_center/contain_no-repeat]",
  stacked: "bg-current [mask:url(/brand/logo.svg)_center/contain_no-repeat]",
};

export function BrandMark({ className = "size-8" }: { className?: string }) {
  return <span aria-hidden className={`inline-block flex-none ${masks.mark} ${className}`} />;
}

// inline: biểu tượng + AN CHI, cho header. stacked: logo đầy đủ có dòng TRẦM HƯƠNG, chỉ dùng từ 200px rộng trở lên
const ratios = { inline: "1038/250", stacked: "734/773" };

export function BrandLogo({ variant = "inline", className = "" }: { variant?: keyof typeof ratios; className?: string }) {
  return (
    <span
      role="img"
      aria-label={site.name}
      style={{ aspectRatio: ratios[variant] }}
      className={`inline-block flex-none ${masks[variant]} ${className}`}
    />
  );
}
