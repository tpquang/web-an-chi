import Link from "next/link";
import { PageFrame, PageHeader, Section } from "@/components/ui/layout";
import { getStore } from "@/lib/api";
import { aboutHref, orderLookupHref, policyHref } from "@/lib/links";
import { staticPageMeta } from "@/lib/page-seo";
import { formatVnd, site } from "@/lib/site";

// Tiêu đề, mô tả sửa ở CMS > Cài đặt SEO. Phí giao, thời gian giao, đổi trả lấy từ CMS > Thông tin cửa hàng
// để trang này, trang giới thiệu và Product schema luôn nói cùng một con số
export function generateMetadata() {
  return staticPageMeta("policy", policyHref);
}

export default async function PolicyPage() {
  const store = await getStore();
  const { flatFeeVnd, freeFromVnd, eta } = store.shipping;
  const holdHours = store.paymentHoldHours ?? 24;
  // Cọc chỉ áp dụng khi shop có tài khoản nhận chuyển khoản
  const deposit = store.deposit?.enabled && store.bank ? store.deposit : null;
  const depositWhen = deposit
    ? [
        deposit.forCustom && "có vòng tự thiết kế",
        deposit.forPreorder && "đặt trước ngày mở bán",
        deposit.forMarked && "có sản phẩm làm theo đơn (ghi rõ ở trang sản phẩm)",
        deposit.minOrderVnd !== null && (deposit.minOrderVnd > 0 ? `có tiền hàng từ ${formatVnd(deposit.minOrderVnd)}` : "trả tiền khi nhận hàng"),
      ].filter(Boolean)
    : [];

  return (
    <PageFrame>
      <PageHeader
        title="Giao hàng, đổi trả và bảo mật"
        desc={`Những điều ${site.name} cam kết khi bạn đặt hàng trên website.`}
        crumbs={[
          { name: "Trang chủ", href: "/" },
          { name: "Giao hàng, đổi trả và bảo mật", href: policyHref },
        ]}
      />

      <div className="max-w-[68ch] leading-[1.75]">
        <Section title="Giao hàng" id="giao-hang">
          <ul className="list-disc space-y-2 pl-5">
            <li>Giao toàn quốc, thời gian nhận hàng {eta}.</li>
            <li>
              Phí giao {formatVnd(flatFeeVnd)} mỗi đơn
              {freeFromVnd ? `, miễn phí cho đơn từ ${formatVnd(freeFromVnd)}` : ""}. Phí hiện rõ ở bước thanh toán trước khi
              bạn đặt.
            </li>
            <li>
              Shop gọi số điện thoại bạn để lại để xác nhận đơn trước khi gửi. Bạn xem trạng thái đơn ở trang{" "}
              <Link href={orderLookupHref} className="underline underline-offset-4 hover:text-wood">
                tra cứu đơn hàng
              </Link>
              .
            </li>
          </ul>
        </Section>

        <Section title="Đổi trả" id="doi-tra">
          {store.returnPolicy ? <p>{store.returnPolicy}</p> : <p>Liên hệ shop để được hướng dẫn đổi trả.</p>}
          <p className="mt-3">Để đổi trả, bạn gọi hoặc nhắn shop kèm mã đơn hàng và ảnh sản phẩm.</p>
        </Section>

        <Section title="Thanh toán" id="thanh-toan">
          <ul className="list-disc space-y-2 pl-5">
            <li>Thanh toán khi nhận hàng (COD), được xem hàng trước khi trả.</li>
            {store.bank && (
              <li>
                Chuyển khoản ngân hàng: số tài khoản và nội dung chuyển khoản hiện ở trang đơn hàng sau khi đặt. Bạn chuyển trong {holdHours} giờ; quá hạn
                chưa nhận được tiền, đơn tự huỷ để nhường hàng cho khách khác.
              </li>
            )}
            {deposit && depositWhen.length > 0 && (
              <li>
                Đặt cọc {deposit.percent}% tiền hàng khi đơn {depositWhen.join(", ")} và bạn chọn trả khi nhận hàng. Tiền cọc chuyển khoản trong {holdHours} giờ, phần
                còn lại trả khi nhận.
              </li>
            )}
          </ul>
        </Section>

        <Section title="Huỷ đơn" id="huy-don">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Trước khi shop xác nhận đơn: bạn tự huỷ ở trang đơn hàng hoặc{" "}
              <Link href={orderLookupHref} className="underline underline-offset-4 hover:text-wood">
                tra cứu đơn hàng
              </Link>
              . Tiền đã chuyển được hoàn đủ.
            </li>
            <li>
              Sau khi shop xác nhận, trước khi giao: bạn gọi hoặc nhắn shop. Hàng có sẵn được hoàn đủ tiền đã chuyển.
              {deposit ? " Hàng làm riêng cho bạn (vòng tự thiết kế, sản phẩm làm theo đơn) đã bắt đầu làm nên shop giữ tiền cọc, hoàn phần còn lại." : ""}
            </li>
            <li>Đơn đang giao không huỷ được. Nếu bạn từ chối nhận hàng, shop hoàn tiền đã chuyển sau khi trừ phí giao.</li>
            <li>Shop hoàn tiền bằng chuyển khoản, thường trong 1–3 ngày làm việc kể từ khi huỷ.</li>
          </ul>
        </Section>

        <Section title="Bảo mật thông tin" id="bao-mat">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Khi đặt hàng, shop lưu họ tên, số điện thoại, địa chỉ nhận hàng, email (nếu bạn nhập) và ghi chú, chỉ để giao đơn và
              liên hệ về đơn đó.
            </li>
            <li>Shop chỉ gửi tin nhắc theo dịp lễ khi bạn đánh dấu đồng ý ở bước thanh toán, và bạn huỷ được bất cứ lúc nào.</li>
            <li>
              Website đo lượt xem và lượt mua để cải thiện trang. Dữ liệu đo chỉ gồm mã sản phẩm, số lượng và giá, không gồm tên,
              số điện thoại hay địa chỉ của bạn.
            </li>
            <li>Muốn xem, sửa hoặc xoá thông tin của mình, bạn liên hệ shop theo thông tin bên dưới.</li>
          </ul>
        </Section>

        <Section title="Liên hệ" id="lien-he">
          <address className="flex flex-col gap-1 not-italic">
            <span>{store.name || site.name}</span>
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
          </address>
          <p className="mt-3">
            Xem thêm{" "}
            <Link href={aboutHref} className="underline underline-offset-4 hover:text-wood">
              giới thiệu về {site.name}
            </Link>
            .
          </p>
        </Section>
      </div>
    </PageFrame>
  );
}
