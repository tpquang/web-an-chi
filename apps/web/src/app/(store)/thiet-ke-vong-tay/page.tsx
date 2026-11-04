import { BraceletDesigner } from "@/components/bracelet/bracelet-designer";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { getBracelet } from "@/lib/api";
import { braceletHref } from "@/lib/links";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Tự thiết kế vòng tay trầm hương",
  description:
    "Chọn từng hạt trầm tốc, trầm sánh, trầm chìm nước, charm bạc, vàng và hạt đá, xếp vòng 3D theo cỡ cổ tay, xem giá ngay và đặt hàng tại An Chi Trầm Hương.",
  path: braceletHref,
});

export default async function BraceletPage() {
  const { rules, beads } = await getBracelet();

  return (
    <PageFrame>
      <PageHeader
        title="Tự thiết kế vòng tay trầm hương"
        desc="Chọn hạt, xếp vòng theo ý bạn và xem giá ngay. Shop xâu vòng theo đúng thứ tự hạt bạn đặt."
        crumbs={[
          { name: "Trang chủ", href: "/" },
          { name: "Tự thiết kế vòng tay", href: braceletHref },
        ]}
      />
      <BraceletDesigner rules={rules} beads={beads} />
    </PageFrame>
  );
}
