// File .glb của sản phẩm tải lên từ CMS, phục vụ qua tên miền web để three.js tải cùng origin.
// Link luôn kèm ?v=<mốc cập nhật>: đổi file là đổi link, nên cache lâu dài được
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return new Response(null, { status: 404 });
  const res = await fetch(`${API_URL}/api/v1/products/${slug}/model`, { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return new Response(null, { status: res?.status === 404 ? 404 : 502 });
  return new Response(res.body, {
    headers: { "content-type": "model/gltf-binary", "cache-control": "public, max-age=31536000, immutable" },
  });
}
