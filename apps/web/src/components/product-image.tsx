import Image from "next/image";
import type { Image as ProductImageData } from "@/lib/api";

type Props = { image?: ProductImageData | null; alt: string; sizes: string; priority?: boolean; className?: string };

// Chưa có ảnh thật thì hiện ảnh mặc định của thương hiệu, không dùng ảnh mạng hay ảnh AI thay thế
export function ProductImage({ image, alt, sizes, priority, className = "" }: Props) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-lg bg-paper-2 ${className}`}>
      {image ? (
        <Image src={image.url} alt={image.alt ?? alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <Image src="/brand/default-thumb.svg" alt="" fill sizes={sizes} priority={priority} unoptimized className="object-cover" />
      )}
    </div>
  );
}
