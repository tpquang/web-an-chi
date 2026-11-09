"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { HomeSlide } from "@/lib/api";
import { homeImageUrl } from "@/lib/links";
import { ArrowLeftIcon, ArrowRightIcon } from "../icons";
import { Button } from "../ui/button";

// Khối tối duy nhất của trang chủ. Không tự chạy để khách lớn tuổi kịp đọc; đổi bằng nút, phím mũi tên hoặc vuốt.
// Mọi slide có sẵn trong HTML server, slide đang ẩn đặt inert để bàn phím và trình đọc màn hình bỏ qua.
export function IntroSlider({ slides, label }: { slides: HomeSlide[]; label: string }) {
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = slides.length;
  const go = (step: number) => setIndex((current) => (current + step + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
      }}
      className="relative mt-20 grid overflow-hidden rounded-3xl bg-night text-on-night lg:mt-24"
    >
      {slides.map((slide, i) => {
        const on = i === index;
        return (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${count}`}
            aria-hidden={!on}
            inert={!on}
            className={`relative col-start-1 row-start-1 flex min-h-[480px] items-end transition-opacity duration-(--d-page) ease-(--ease-out) motion-reduce:transition-none md:min-h-[460px] md:items-center ${on ? "opacity-100" : "opacity-0"}`}
          >
            {slide.image && (
              <Image src={homeImageUrl(slide.image)} alt={slide.image.alt} fill sizes="(min-width: 1180px) 1180px, 100vw" className="object-cover" priority={false} />
            )}
            {/* Lớp tối dưới chữ để chữ đạt tương phản trên mọi ảnh: từ dưới lên ở mobile, từ trái sang ở màn rộng */}
            {slide.image && <div aria-hidden className="absolute inset-0 bg-linear-to-t from-shade via-shade/80 to-shade/10 md:bg-linear-to-r md:from-shade md:via-shade/70 md:to-transparent" />}
            <div className="relative w-full px-6 pt-16 pb-28 md:max-w-xl md:px-12 md:py-14">
              {slide.eyebrow && <p className="text-[13px] font-medium tracking-wide text-on-night-2">{slide.eyebrow}</p>}
              <h2 className="mt-3 font-serif text-[clamp(30px,4vw,44px)] leading-[1.1]">{slide.title}</h2>
              {slide.text && <p className="mt-4 text-on-night-2 md:text-lg">{slide.text}</p>}
              {slide.cta && (
                <Button href={slide.cta.href} variant="light" className="mt-7">
                  {slide.cta.label}
                  <ArrowRightIcon size={18} />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <div className="absolute bottom-6 left-6 flex items-center gap-3 md:bottom-10 md:left-12">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Slide trước"
            className="inline-flex size-12 items-center justify-center rounded-full bg-wood text-on-wood transition-colors duration-(--d-fast) hover:bg-wood-hover"
          >
            <ArrowLeftIcon size={20} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Slide tiếp"
            className="inline-flex size-12 items-center justify-center rounded-full bg-on-night text-night transition-opacity duration-(--d-fast) hover:opacity-90"
          >
            <ArrowRightIcon size={20} />
          </button>
          <p aria-live="polite" className="ml-2 text-sm text-on-night-2 tabular-nums">
            {index + 1} / {count}
          </p>
        </div>
      )}
    </section>
  );
}
