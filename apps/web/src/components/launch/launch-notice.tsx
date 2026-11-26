"use client";

import type { ReactNode } from "react";
import { braceletHref, postsHref } from "@/lib/links";
import { Button } from "../ui/button";
import { Eyebrow } from "../ui/layout";
import { Tag } from "../ui/tag";
import { LaunchCountdown, LaunchGate, useLaunchLabel } from "./launch-clock";

// Các khối "chờ ngày mở bán". Ngày mở bán sửa ở CMS > Thông tin cửa hàng, LaunchGate tự chuyển đúng giờ ở trình duyệt.
// Sau ngày mở bán các khối này không render gì

// Bọc nút mua: trước giờ mở bán hiện `waiting`
export function SalesGate({ waiting, children }: { waiting: ReactNode; children: ReactNode }) {
  return <LaunchGate waiting={waiting}>{children}</LaunchGate>;
}

export function LaunchTag() {
  const launchDateLabel = useLaunchLabel();
  return <Tag tone="wood">Mở bán {launchDateLabel}</Tag>;
}

// Trang chủ, ngay dưới banner
export function HomeLaunch() {
  const launchDateLabel = useLaunchLabel();
  return (
    <SalesGate
      waiting={
        <section aria-labelledby="mo-ban" className="mt-12 grid items-center gap-8 rounded-3xl bg-surface p-6 lg:mt-16 lg:grid-cols-12 lg:gap-6 lg:p-10">
          <div className="lg:col-span-7">
            <Eyebrow>Sắp mở bán</Eyebrow>
            <h2 id="mo-ban" className="mt-3 font-serif text-[clamp(30px,4vw,44px)] leading-[1.1]">
              Chờ ngày mở bán {launchDateLabel}
            </h2>
            <p className="mt-4 max-w-[52ch] text-ink-2">
              An Chi nhận đơn từ ngày {launchDateLabel}. Trong lúc chờ, bạn có thể thử thiết kế vòng tay hoặc đọc các bài viết về trầm hương.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Button href={braceletHref} variant="outline">
                Thử thiết kế vòng tay
              </Button>
              <Button href={postsHref} variant="text">
                Đọc bài viết
              </Button>
            </div>
          </div>
          <div className="flex lg:col-span-5 lg:justify-end">
            <LaunchCountdown size="lg" />
          </div>
        </section>
      }
    >
      {null}
    </SalesGate>
  );
}

// Dải báo ở đầu trang danh sách sản phẩm, danh mục, thiết kế vòng
export function LaunchStrip({ children }: { children: ReactNode }) {
  const launchDateLabel = useLaunchLabel();
  return (
    <SalesGate
      waiting={
        <section aria-labelledby="mo-ban" className="mb-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-3xl bg-surface p-5">
          <div>
            <h2 id="mo-ban" className="font-serif text-2xl leading-tight">
              Chờ ngày mở bán {launchDateLabel}
            </h2>
            <p className="mt-1 max-w-[52ch] text-sm text-ink-2">{children}</p>
          </div>
          <LaunchCountdown />
        </section>
      }
    >
      {null}
    </SalesGate>
  );
}

// Trang sản phẩm trước ngày mở bán. children là nút thêm vào giỏ khi shop bật đặt chờ;
// không có children (shop tắt đặt chờ ở CMS) thì chỉ hiện đếm ngược
export function ProductLaunchPanel({ children }: { children?: ReactNode }) {
  const item = Boolean(children);
  const launchDateLabel = useLaunchLabel();
  return (
    <section aria-labelledby="mo-ban" className="flex flex-col gap-4 rounded-3xl border border-edge bg-surface p-5">
      <div>
        <h2 id="mo-ban" className="font-serif text-2xl leading-tight">
          Chờ ngày mở bán
        </h2>
        <p className="mt-1 text-sm text-ink-2">
          {item
            ? `Shop giao hàng từ ngày ${launchDateLabel}. Bạn thêm vào giỏ và đặt hàng như thường, đơn là đơn đặt chờ: shop chuẩn bị hàng và gọi xác nhận trước khi giao.`
            : `Sản phẩm này nhận đơn từ ngày ${launchDateLabel}. Bạn có thể xem trước giá, thông số và cách dùng ở bên dưới.`}
        </p>
      </div>
      <LaunchCountdown />
      {children}
    </section>
  );
}
