import Image from "next/image";
import type { HomeBanner as Banner, Store } from "@/lib/api";
import { homeImageUrl } from "@/lib/links";
import { formatVnd } from "@/lib/site";
import { BrandMark } from "../brand-mark";
import { ArrowRightIcon, ShieldIcon, TruckIcon } from "../icons";
import { Button } from "../ui/button";
import { Eyebrow } from "../ui/layout";

// Banner trang chủ: chữ bên trái, ảnh bo lớn bên phải, thẻ kính nổi trên ảnh nói điều khách cần biết trước khi mua
export function HomeBanner({ banner, store }: { banner: Banner; store: Store }) {
  const { freeFromVnd, eta } = store.shipping;
  const facts = [
    { icon: TruckIcon, title: freeFromVnd ? `Miễn phí giao từ ${formatVnd(freeFromVnd)}` : "Giao hàng toàn quốc", desc: `Nhận hàng sau ${eta}` },
    { icon: ShieldIcon, title: "Đặt hàng không cần tài khoản", desc: "Thanh toán khi nhận hoặc chuyển khoản" },
  ];

  return (
    <section aria-labelledby="banner-title" className="grid items-center gap-8 pt-6 md:pt-10 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-6 lg:pr-6">
        {banner.eyebrow && <Eyebrow>{banner.eyebrow}</Eyebrow>}
        <h1 id="banner-title" className="mt-5 font-serif text-[clamp(40px,5.6vw,72px)] leading-[1.05] font-semibold text-balance">
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
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 md:absolute md:right-4 md:bottom-4 md:mt-0 md:w-72 md:grid-cols-1 md:gap-0 md:rounded-2xl md:bg-glass md:p-2 md:shadow-e3 md:backdrop-blur-md">
          {facts.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex items-start gap-3 rounded-2xl bg-surface p-4 md:rounded-lg md:bg-transparent md:p-3">
              <span aria-hidden className="inline-flex size-10 flex-none items-center justify-center rounded-full bg-wood-soft text-wood">
                <Icon size={20} />
              </span>
              <span>
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-[13px] text-ink-3">{desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
