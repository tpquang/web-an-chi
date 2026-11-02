import { outboundHref } from "@/lib/links";
import { ExternalIcon } from "./icons";

type Props = { shopeeUrl?: string | null; tiktokUrl?: string | null; medium: string; content: string; className?: string };

// Lời mời phụ nên là nút viền, mở tab mới, có UTM để đo
export function MarketplaceLinks({ shopeeUrl, tiktokUrl, medium, content, className = "" }: Props) {
  const links = [
    shopeeUrl && { href: outboundHref(shopeeUrl, medium, `${content}-shopee`), label: "Mua trên Shopee" },
    tiktokUrl && { href: outboundHref(tiktokUrl, medium, `${content}-tiktok`), label: "Mua trên TikTok Shop" },
  ].filter((link): link is { href: string; label: string } => Boolean(link));
  if (links.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong px-4 text-sm font-medium hover:border-wood hover:text-wood"
        >
          {link.label}
          <ExternalIcon size={16} />
          <span className="sr-only">(mở tab mới)</span>
        </a>
      ))}
    </div>
  );
}
