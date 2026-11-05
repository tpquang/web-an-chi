// Ảnh sản phẩm, bài viết tải lên từ CMS, phục vụ qua tên miền web để next/image tối ưu được
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return new Response(null, { status: 404 });
  const res = await fetch(`${API_URL}/api/v1/media/${id}`, { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return new Response(null, { status: res?.status === 404 ? 404 : 502 });
  return new Response(res.body, {
    headers: {
      "content-type": res.headers.get("content-type") ?? "image/webp",
      // Ảnh đã tải không bao giờ bị sửa, đổi ảnh là id mới
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
