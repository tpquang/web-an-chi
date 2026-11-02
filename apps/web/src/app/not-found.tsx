import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/ui/layout";
import { productsHref } from "@/lib/links";

export default function NotFound() {
  return (
    <main id="noi-dung" className="flex-1 py-16">
      <PageFrame>
        <h1 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] font-medium">Không tìm thấy trang</h1>
        <p className="mt-3 max-w-[68ch] text-lg text-ink-2">
          Đường dẫn có thể đã đổi hoặc sản phẩm không còn bán. Bạn xem các sản phẩm đang có tại cửa hàng nhé.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button href={productsHref}>Xem sản phẩm</Button>
          <Button href="/" variant="outline">
            Về trang chủ
          </Button>
        </div>
      </PageFrame>
    </main>
  );
}
