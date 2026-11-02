import Image from "next/image";
import type { Image as ProductImageData } from "@/lib/api";
import { BrandMark } from "./brand-mark";

type Props = { image?: ProductImageData | null; alt: string; sizes: string; priority?: boolean; className?: string };

// Chưa có ảnh thật thì hiện ô trống có dấu logo, không dùng ảnh mạng hay ảnh AI thay thế
export function ProductImage({ image, alt, sizes, priority, className = "" }: Props) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-lg bg-paper-2 ${className}`}>
      {image ? (
        <Image src={image.url} alt={image.alt ?? alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 text-line-strong">
          <BrandMark className="size-14" />
          <span className="text-xs">Chưa có ảnh</span>
        </div>
      )}
    </div>
  );
}
