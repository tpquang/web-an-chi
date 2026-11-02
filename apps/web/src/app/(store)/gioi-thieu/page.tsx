import { BrandLogo } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { PageFrame, PageHeader, Section } from "@/components/ui/layout";
import { getStore } from "@/lib/api";
import { aboutHref, postHref, productsHref } from "@/lib/links";
import { pageMeta } from "@/lib/seo";
import { formatVnd, site } from "@/lib/site";

export const metadata = pageMeta({
  title: "Giới thiệu An Chi Trầm Hương",
  absoluteTitle: true,
  description:
    "An Chi Trầm Hương bán vòng tay, nhang, nụ trầm và trầm miếng. Mỗi sản phẩm ghi rõ kích thước, xuất xứ, cách dùng; không hứa công dụng chữa bệnh hay tâm linh.",
  path: aboutHref,
});

// Chỉ nêu nguyên tắc và thông tin kiểm tra được. Câu chuyện thương hiệu, nguồn hàng cụ thể chờ chủ shop cung cấp
const principles = [
  {
    title: "Thông tin rõ trước khi mua",
    text: "Mỗi sản phẩm ghi kích thước, trọng lượng, xuất xứ và cách dùng. Thông tin chưa có căn cứ từ nhà cung cấp thì shop để trống, không phỏng đoán.",
  },
  {
    title: "Không hứa công dụng",
    text: "Shop mô tả chất liệu, mùi hương và ý nghĩa văn hoá của trầm. Shop không quảng cáo trầm chữa bệnh, kích tài lộc hay giải hạn.",
  },
  {
    title: "Ảnh đúng hàng bạn nhận",
    text: "Ảnh sản phẩm là ảnh chụp chính món hàng đang bán. Sản phẩm chưa có ảnh thật thì hiện ô trống thay vì dùng ảnh mạng.",
  },
  {
    title: "Giá và tồn kho là số thật",
    text: "Giá gạch ngang chỉ hiện khi shop đã thực sự bán ở giá đó. Số lượng còn lại trên trang là số trong kho.",
  },
];

export default async function AboutPage() {
  const store = await getStore();
  const { flatFeeVnd, freeFromVnd, eta } = store.shipping;

  return (
    <PageFrame>
      <PageHeader
        title="Giới thiệu An Chi Trầm Hương"
        desc="Cửa hàng trầm hương cho người mua dùng cá nhân, mua làm quà và cần nhang trầm cho thờ cúng, không gian sống."
        crumbs={[
          { name: "Trang chủ", href: "/" },
          { name: "Giới thiệu", href: aboutHref },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
        <div className="max-w-[68ch] space-y-4 text-lg leading-[1.75] lg:col-span-8">
          <p>
            Khách mua trầm hương thường lo nhất là mua phải hàng không đúng như lời giới thiệu. Vì vậy {site.name} chọn cách bán
            đơn giản: nói rõ món hàng là gì, dùng thế nào, và chỉ nói những gì kiểm tra được.
          </p>
          <p>
            Shop bán vòng tay trầm, nhang trầm có tăm và không tăm, nụ trầm, trầm miếng để xông, cùng lư xông và thác khói dùng
            kèm. Bạn có thể đặt hàng trên website mà không cần tạo tài khoản, hoặc mua qua gian hàng của shop trên Shopee và
            TikTok Shop.
          </p>
        </div>
        <div className="flex items-start justify-center lg:col-span-4">
          <BrandLogo variant="stacked" className="text-5xl text-wood" />
        </div>
      </div>

      <Section title="Nguyên tắc bán hàng" id="nguyen-tac">
        <ul className="grid gap-4 md:grid-cols-2">
          {principles.map((item) => (
            <li key={item.title} className="rounded-lg border border-line bg-surface p-5">
              <h3 className="font-serif text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-ink-2">{item.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Giao hàng và đổi trả" id="giao-hang">
        <ul className="max-w-[68ch] list-disc space-y-2 pl-5 leading-[1.75]">
          <li>Giao toàn quốc trong {eta}.</li>
          <li>
            Phí giao {formatVnd(flatFeeVnd)}
            {freeFromVnd ? `, miễn phí cho đơn từ ${formatVnd(freeFromVnd)}` : ""}.
          </li>
          <li>Thanh toán khi nhận hàng hoặc chuyển khoản ngân hàng.</li>
          {store.returnPolicy && <li>{store.returnPolicy}</li>}
        </ul>
      </Section>

      <Section title="Liên hệ" id="lien-he">
        <address className="flex flex-col gap-1 not-italic leading-[1.75]">
          {store.address && <span>Địa chỉ: {store.address}</span>}
          {store.phone && (
            <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="w-fit hover:text-wood">
              Điện thoại: {store.phone}
            </a>
          )}
          {store.email && (
            <a href={`mailto:${store.email}`} className="w-fit hover:text-wood">
              Email: {store.email}
            </a>
          )}
          {store.openingHours && <span>Giờ làm việc: {store.openingHours}</span>}
        </address>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button href={productsHref}>Xem sản phẩm</Button>
          <Button href={postHref("cach-phan-biet-tram-huong-that")} variant="outline">
            Cách phân biệt trầm hương thật
          </Button>
        </div>
      </Section>
    </PageFrame>
  );
}
