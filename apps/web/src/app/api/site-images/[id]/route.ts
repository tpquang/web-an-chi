// Ảnh banner và slide trang chủ đi qua tên miền web, để next/image tối ưu được mà không cần khai báo tên miền API
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return new Response(null, { status: 404 });
  const res = await fetch(`${API_URL}/api/v1/settings/images/${id}`, { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return new Response(null, { status: res?.status === 404 ? 404 : 502 });
  return new Response(res.body, {
    headers: {
      "content-type": res.headers.get("content-type") ?? "image/webp",
      // Ảnh không sửa tại chỗ: thay ảnh là tạo id mới
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
