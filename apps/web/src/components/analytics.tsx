import Script from "next/script";
import { site } from "@/lib/site";

// GA4 chỉ nạp ở bản chính thức (SITE_INDEXING=on) và khi có NEXT_PUBLIC_GA_ID.
// lazyOnload để không tranh tài nguyên với nội dung trang (quy tắc anchi-growth)
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export function Analytics() {
  if (!gaId || !site.indexable) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
      <Script id="ga4" strategy="lazyOnload">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag("js",new Date());gtag("config",${JSON.stringify(gaId)});`}
      </Script>
    </>
  );
}