import Script from "next/script";
import { site } from "@/lib/site";

// Đo lường chỉ nạp ở bản chính thức (SITE_INDEXING=on).
// Ưu tiên Google Tag Manager (NEXT_PUBLIC_GTM_ID): thẻ GA4 cấu hình trong GTM.
// Không dùng GTM thì nạp thẳng GA4 (NEXT_PUBLIC_GA_ID). Đặt cả hai sẽ đếm trùng, nên GTM thắng.
// lazyOnload để không tranh tài nguyên với nội dung trang (quy tắc anchi-growth)
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export function Analytics() {
  if (!site.indexable) return null;
  if (gtmId) {
    return (
      <Script id="gtm" strategy="lazyOnload">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({"gtm.start":new Date().getTime(),event:"gtm.js"});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!="dataLayer"?"&l="+l:"";j.async=true;j.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;f.parentNode.insertBefore(j,f);})(window,document,"script","dataLayer",${JSON.stringify(gtmId)});`}
      </Script>
    );
  }
  if (!gaId) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
      <Script id="ga4" strategy="lazyOnload">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag("js",new Date());gtag("config",${JSON.stringify(gaId)});`}
      </Script>
    </>
  );
}
