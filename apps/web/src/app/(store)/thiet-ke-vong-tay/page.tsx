import { BraceletDesigner } from "@/components/bracelet/bracelet-designer";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { getBracelet, getStore } from "@/lib/api";
import { LaunchStrip } from "@/components/launch/launch-notice";
import { braceletHref } from "@/lib/links";
import { staticPageMeta } from "@/lib/page-seo";

// Tiêu đề, mô tả sửa ở CMS > Cài đặt SEO
export function generateMetadata() {
  return staticPageMeta("bracelet", braceletHref);
}

export default async function BraceletPage() {
  const [{ rules, beads }, store] = await Promise.all([getBracelet(), getStore()]);

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
      <LaunchStrip>
        {store.preorderEnabled !== false
          ? "Bạn thiết kế và đặt vòng như thường, đơn là đơn đặt chờ. Shop làm vòng và giao từ ngày này."
          : "Bạn có thể thử phối hạt và xem giá trước. Vòng thiết kế đặt được từ ngày này."}
      </LaunchStrip>
      <BraceletDesigner rules={rules} beads={beads} preorder={store.preorderEnabled !== false} />
    </PageFrame>
  );
}
