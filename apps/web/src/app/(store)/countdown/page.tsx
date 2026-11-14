import { LaunchCountdown, LaunchGate } from "@/components/launch/launch-clock";
import { Button } from "@/components/ui/button";
import { Eyebrow, PageFrame } from "@/components/ui/layout";
import { countdownHref, isPreLaunch, launchDateLabel } from "@/lib/launch";
import { braceletHref, postsHref, productsHref } from "@/lib/links";
import { pageMeta } from "@/lib/seo";

// Trang tạm, không cho index
export function generateMetadata() {
  return pageMeta({
    title: "Chờ ngày mở bán",
    description: `An Chi Trầm Hương nhận đơn từ ngày ${launchDateLabel}.`,
    path: countdownHref,
    noindex: true,
  });
}

export default function CountdownPage() {
  return (
    <PageFrame>
      <section aria-labelledby="mo-ban" className="mt-6 rounded-3xl bg-surface p-6 md:mt-10 lg:p-12">
        <LaunchGate
          initialOpen={!isPreLaunch()}
          waiting={
            <>
              <Eyebrow>Sắp mở bán</Eyebrow>
              <h1 id="mo-ban" className="mt-4 font-serif text-[clamp(36px,5vw,60px)] leading-[1.05]">
                Chờ ngày mở bán {launchDateLabel}
              </h1>
              <p className="mt-5 max-w-[56ch] text-lg text-ink-2">
                An Chi đang chuẩn bị sản phẩm và nhận đơn từ ngày {launchDateLabel}. Trong lúc chờ, bạn có thể thử thiết kế vòng tay hoặc đọc các
                bài viết về trầm hương.
              </p>
              <div className="mt-8">
                <LaunchCountdown size="lg" />
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Button href={braceletHref} variant="outline">
                  Thử thiết kế vòng tay
                </Button>
                <Button href={postsHref} variant="text">
                  Đọc bài viết
                </Button>
              </div>
            </>
          }
        >
          <h1 id="mo-ban" className="font-serif text-[clamp(36px,5vw,60px)] leading-[1.05]">
            An Chi đã mở bán
          </h1>
          <p className="mt-5 text-lg text-ink-2">Bạn có thể xem và đặt sản phẩm ngay bây giờ.</p>
          <div className="mt-8">
            <Button href={productsHref} size="lg">
              Xem sản phẩm
            </Button>
          </div>
        </LaunchGate>
      </section>
    </PageFrame>
  );
}
