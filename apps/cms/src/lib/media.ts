import { api, publicUrl } from "./api";

// Ảnh sản phẩm, ảnh bài viết. Mặc định thu về tối đa 2000px và nén WebP ở trình duyệt rồi mới gửi;
// bỏ chọn nén thì gửi ảnh gốc. Số khớp MEDIA_SPEC trong apps/api/src/modules/admin/admin.media.ts
export const MEDIA = { maxSide: 2000, maxBytes: 8_000_000, targetBytes: 600_000, maxInputMb: 25 } as const;
export const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp";

export type UploadedMedia = { id: string; path: string; width: number; height: number; size: number; mime: string };

async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("Không đọc được ảnh. Bạn thử xuất lại ảnh rồi chọn lại.");
  const scale = Math.min(1, MEDIA.maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // Giảm dần chất lượng tới khi đủ nhẹ; ảnh vẫn nặng thì lấy bản nhẹ nhất dưới giới hạn tối đa
  let best: Blob | null = null;
  for (const quality of [0.85, 0.78, 0.7, 0.6]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob || blob.type !== "image/webp") throw new Error("Trình duyệt này chưa nén được WebP. Bạn bỏ chọn nén hoặc dùng Chrome, Edge.");
    best = blob;
    if (blob.size <= MEDIA.targetBytes) break;
  }
  if (!best || best.size > MEDIA.maxBytes) throw new Error("Ảnh vẫn nặng sau khi nén. Bạn chọn ảnh nhỏ hơn.");
  return best;
}

export async function uploadMedia(file: File, { compress: shouldCompress }: { compress: boolean }): Promise<UploadedMedia> {
  if (!MEDIA_ACCEPT.split(",").includes(file.type)) throw new Error("Ảnh cần là JPG, PNG hoặc WebP.");
  if (file.size > MEDIA.maxInputMb * 1_000_000) throw new Error(`Ảnh gốc nặng quá ${MEDIA.maxInputMb} MB.`);
  if (!shouldCompress && file.size > MEDIA.maxBytes) throw new Error(`Ảnh gốc nặng quá ${MEDIA.maxBytes / 1_000_000} MB. Bạn bật nén WebP hoặc chọn ảnh nhẹ hơn.`);
  const body = shouldCompress ? await compress(file) : file;
  return api.upload<UploadedMedia>(`/media?name=${encodeURIComponent(file.name)}`, body, "POST");
}

// Ảnh tải lên lưu dạng /api/media/<id> (web phục vụ qua proxy). CMS xem trước thẳng từ API
export function mediaSrc(url: string | null | undefined) {
  if (!url) return "";
  const m = /^\/api\/media\/([a-z0-9]+)$/i.exec(url);
  return m ? publicUrl(`/media/${m[1]}`) : url;
}

export const formatBytes = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.round(n / 1000)} KB`);
