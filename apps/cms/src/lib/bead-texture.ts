// Quy cách ảnh vân vật liệu cho hạt 3D. API kiểm lại cạnh ảnh và dung lượng.
export const TEXTURE_SIDE = 1024;
export const MAX_INPUT_MB = 20;
// iPhone tự đổi ảnh HEIC sang JPEG khi chọn file trên web
export const ACCEPT = "image/jpeg,image/png,image/webp";

export type Crop = { x: number; y: number; side: number };

export type CheckResult = { level: "ok" | "warn" | "error"; label: string; detail: string };

// Ô cắt vuông lớn nhất đặt giữa ảnh, dùng làm vị trí ban đầu
export function centerCrop(width: number, height: number): Crop {
  const side = Math.min(width, height);
  return { x: (width - side) / 2, y: (height - side) / 2, side };
}

export function clampCrop(crop: Crop, width: number, height: number): Crop {
  const side = Math.min(Math.max(crop.side, TEXTURE_SIDE), width, height);
  return { side, x: Math.min(Math.max(crop.x, 0), width - side), y: Math.min(Math.max(crop.y, 0), height - side) };
}

// Vẽ phần đã cắt ra canvas vuông 1024px, đây chính là ảnh sẽ lưu
export function renderCrop(source: CanvasImageSource, crop: Crop, target: HTMLCanvasElement) {
  target.width = TEXTURE_SIDE;
  target.height = TEXTURE_SIDE;
  const ctx = target.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, crop.x, crop.y, crop.side, crop.side, 0, 0, TEXTURE_SIDE, TEXTURE_SIDE);
}

// Kiểm ảnh đã cắt: đủ sáng, sáng đều, đủ nét, không có nền trắng hay đen lọt vào khung
export function checkTexture(canvas: HTMLCanvasElement, sourceShort: number): CheckResult[] {
  const N = 96;
  const small = document.createElement("canvas");
  small.width = N;
  small.height = N;
  const ctx = small.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(canvas, 0, 0, N, N);
  const { data } = ctx.getImageData(0, 0, N, N);
  const luma = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) luma[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;

  const mean = luma.reduce((s, v) => s + v, 0) / luma.length;
  // Độ sáng từng góc phần tư, lệch nhiều là có bóng đổ hoặc đèn chiếu một bên
  const quad = [0, 0, 0, 0];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) quad[(y < N / 2 ? 0 : 2) + (x < N / 2 ? 0 : 1)] += luma[y * N + x] / ((N * N) / 4);
  const spread = Math.max(...quad) - Math.min(...quad);
  // Điểm gần trắng hoặc gần đen là nền hay lóa đèn lọt vào khung
  const clipped = luma.filter((v) => v > 0.96 || v < 0.03).length / luma.length;
  // Độ nét: phương sai của Laplacian, ảnh mờ thì vân bị nhoè
  let sum = 0;
  let sq = 0;
  let count = 0;
  for (let y = 1; y < N - 1; y++)
    for (let x = 1; x < N - 1; x++) {
      const i = y * N + x;
      const lap = 4 * luma[i] - luma[i - 1] - luma[i + 1] - luma[i - N] - luma[i + N];
      sum += lap;
      sq += lap * lap;
      count++;
    }
  const sharp = sq / count - (sum / count) ** 2;

  const results: CheckResult[] = [];
  results.push(
    sourceShort >= TEXTURE_SIDE
      ? { level: "ok", label: "Độ phân giải", detail: `Phần cắt rộng ${Math.round(sourceShort)} px, đủ ${TEXTURE_SIDE} px.` }
      : { level: "error", label: "Độ phân giải", detail: `Phần cắt chỉ rộng ${Math.round(sourceShort)} px, cần ít nhất ${TEXTURE_SIDE} px. Thu nhỏ khung cắt ít lại hoặc chụp gần hơn.` },
  );
  results.push(
    mean < 0.12 ? { level: "error", label: "Độ sáng", detail: "Ảnh quá tối, vân không rõ. Chụp ở chỗ sáng hơn." }
    : mean > 0.88 ? { level: "error", label: "Độ sáng", detail: "Ảnh quá sáng, mất vân. Giảm sáng hoặc tránh nắng trực tiếp." }
    : { level: "ok", label: "Độ sáng", detail: "Đủ sáng." },
  );
  results.push(
    spread > 0.22 ? { level: "error", label: "Ánh sáng đều", detail: "Một bên ảnh sáng, một bên tối. Hạt sẽ có vệt loang. Chụp dưới ánh sáng tản, không đèn chiếu một bên." }
    : spread > 0.12 ? { level: "warn", label: "Ánh sáng đều", detail: "Ánh sáng hơi lệch một bên. Dùng được nhưng nên chụp lại nếu được." }
    : { level: "ok", label: "Ánh sáng đều", detail: "Sáng đều khắp khung." },
  );
  results.push(
    clipped > 0.06 ? { level: "error", label: "Chỉ có vật liệu trong khung", detail: "Khung có vùng trắng hoặc đen lớn, có thể là nền, mép miếng gỗ hoặc lóa đèn. Kéo khung vào giữa mặt vật liệu." }
    : clipped > 0.015 ? { level: "warn", label: "Chỉ có vật liệu trong khung", detail: "Có vài điểm lóa hoặc nền. Kiểm lại mép khung." }
    : { level: "ok", label: "Chỉ có vật liệu trong khung", detail: "Không thấy nền lọt vào." },
  );
  results.push(
    sharp < 0.0004 ? { level: "warn", label: "Độ nét", detail: "Ảnh có vẻ mờ hoặc vân rất mịn. Kiểm lại hạt xem trước, mờ thì chụp lại và chạm màn hình để lấy nét." }
    : { level: "ok", label: "Độ nét", detail: "Vân rõ." },
  );
  return results;
}

// Lưu WebP; trình duyệt không hỗ trợ thì lưu PNG
export async function exportTexture(canvas: HTMLCanvasElement): Promise<Blob> {
  const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
  if (webp && webp.type === "image/webp") return webp;
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!png) throw new Error("Trình duyệt không xuất được ảnh. Bạn thử Chrome hoặc Safari bản mới.");
  return png;
}
