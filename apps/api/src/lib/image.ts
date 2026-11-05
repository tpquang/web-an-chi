// Đọc loại và kích thước ảnh từ phần đầu file, không cần thư viện xử lý ảnh
export function imageInfo(buf: Buffer): { mime: string; width: number; height: number } | null {
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const chunk = buf.toString("ascii", 12, 16);
    if (chunk === "VP8X") return { mime: "image/webp", width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (chunk === "VP8 ") return { mime: "image/webp", width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return { mime: "image/webp", width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
    }
    return null;
  }
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return { mime: "image/png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  return null;
}
