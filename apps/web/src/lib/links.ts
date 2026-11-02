// Mọi link nội bộ sinh từ đây để đổi cấu trúc URL chỉ sửa một chỗ
export const productsHref = "/san-pham";
export const postsHref = "/bai-viet";
export const cartHref = "/gio-hang";
export const checkoutHref = "/thanh-toan";
export const orderLookupHref = "/tra-cuu-don-hang";
export const aboutHref = "/gioi-thieu";
export const loginHref = "/dang-nhap";
export const registerHref = "/dang-ky";
export const accountHref = "/tai-khoan";

export const productHref = (slug: string) => `/san-pham/${slug}`;
export const categoryHref = (slug: string) => `/danh-muc/${slug}`;
export const postHref = (slug: string) => `/bai-viet/${slug}`;
export const topicHref = (slug: string) => `/chu-de/${slug}`;
export const orderHref = (code: string) => `/don-hang/${code}`;

// Trang 1 không có ?trang để không tạo hai URL cho cùng nội dung
export function pagedHref(base: string, page: number) {
  return page <= 1 ? base : `${base}?trang=${page}`;
}

// Link ra sàn hay kênh khác gắn UTM theo anchi-growth mục 4
export function outboundHref(url: string, medium: string, content: string) {
  try {
    const target = new URL(url);
    target.searchParams.set("utm_source", "anchi");
    target.searchParams.set("utm_medium", medium);
    target.searchParams.set("utm_content", content);
    return target.toString();
  } catch {
    return url;
  }
}
