// Ảnh banner và slide trang chủ: thu về tối đa 2400px chiều rộng, nén WebP ở trình duyệt rồi mới gửi.
// Số khớp HOME_IMAGE trong apps/api/src/lib/home.ts
export const SITE_IMAGE = { minWidth: 1200, maxWidth: 2400, maxBytes: 3_000_000, maxInputMb: 20 } as const;
export const ACCEPT = "image/jpeg,image/png,image/webp";

export type SiteImage = { id: string; width: number; height: number };

export async function prepareSiteImage(file: File): Promise<Blob> {
  if (!ACCEPT.split(",").includes(file.type)) throw new Error("Ảnh cần là JPG, PNG hoặc WebP.");
  if (file.size > SITE_IMAGE.maxInputMb * 1_000_000) throw new Error(`Ảnh gốc nặng quá ${SITE_IMAGE.maxInputMb} MB. Bạn chọn ảnh nhẹ hơn.`);
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("Không đọc được ảnh. Bạn thử xuất lại ảnh rồi chọn lại.");
  if (bitmap.width < SITE_IMAGE.minWidth) throw new Error(`Ảnh mới rộng ${bitmap.width} px, cần ít nhất ${SITE_IMAGE.minWidth} px để rõ trên màn lớn.`);

  const scale = Math.min(1, SITE_IMAGE.maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  // Giảm dần chất lượng tới khi dưới giới hạn dung lượng
  for (const quality of [0.86, 0.78, 0.7, 0.6]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (blob && blob.type === "image/webp" && blob.size <= SITE_IMAGE.maxBytes) return blob;
  }
  throw new Error("Ảnh vẫn nặng sau khi nén. Bạn chọn ảnh ít chi tiết hơn hoặc nhỏ hơn.");
}
