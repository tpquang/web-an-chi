"use client";

import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/ui/layout";

// Next trả mã 500 cho trang lỗi này, nên Google không coi là trang rỗng
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="noi-dung" className="flex-1 py-16">
      <PageFrame>
        <h1 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] font-medium">Trang tạm thời chưa tải được</h1>
        <p className="mt-3 max-w-[68ch] text-lg text-ink-2">
          Hệ thống của shop đang gặp sự cố. Bạn thử lại sau ít phút. Giỏ hàng của bạn vẫn được giữ nguyên.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={reset}>Thử lại</Button>
          <Button href="/" variant="outline">
            Về trang chủ
          </Button>
        </div>
      </PageFrame>
    </main>
  );
}
