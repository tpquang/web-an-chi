import Image from "next/image";
import type { HomeBanner as Banner } from "@/lib/api";
import { homeImageUrl } from "@/lib/links";
import { BrandMark } from "../brand-mark";
import { ArrowRightIcon } from "../icons";
import { Button } from "../ui/button";
import { Eyebrow } from "../ui/layout";

// Banner trang chủ: chữ bên trái, ảnh bo lớn bên phải
export function HomeBanner({ banner }: { banner: Banner }) {
  return (
    <section aria-labelledby="banner-title" className="grid items-center gap-8 pt-6 md:pt-10 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-6 lg:pr-6">
        {banner.eyebrow && <Eyebrow>{banner.eyebrow}</Eyebrow>}
        <h1 id="banner-title" className="mt-5 font-serif text-[clamp(40px,5.6vw,72px)] leading-[1.05] text-balance">
          {banner.title}
        </h1>
        {banner.text && <p className="mt-6 max-w-[46ch] text-lg text-ink-2">{banner.text}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={banner.primary.href} size="lg">
            {banner.primary.label}
            <ArrowRightIcon size={18} />
          </Button>
          {banner.secondary && (
            <Button href={banner.secondary.href} size="lg" variant="outline">
              {banner.secondary.label}
            </Button>
          )}
        </div>
      </div>

      <div className="relative lg:col-span-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-paper-2 lg:aspect-[5/6]">
          {banner.image ? (
            <Image src={homeImageUrl(banner.image)} alt={banner.image.alt} fill priority sizes="(min-width: 960px) 580px, 100vw" className="object-cover" />
          ) : (
            // Chưa có ảnh: hoạ tiết logo mờ, chỗ duy nhất trên trang
            <BrandMark className="absolute top-1/2 left-1/2 size-2/3 -translate-x-1/2 -translate-y-1/2 text-brand opacity-10" />
          )}
        </div>
      </div>
    </section>
  );
}
