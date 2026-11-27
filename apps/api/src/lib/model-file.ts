import express from "express";
import { HttpError } from "../middleware/errors.js";

// File 3D tải lên từ CMS (charm, sản phẩm): chỉ nhận glTF Binary, kiểm 4 byte đầu là "glTF".
// maxBytes phải khớp MAX_MB ở apps/cms/src/components/ModelUploadModal.tsx
export const MODEL_SPEC = { maxBytes: 15_000_000 } as const;

export const modelBody = express.raw({ type: ["model/gltf-binary", "application/octet-stream"], limit: MODEL_SPEC.maxBytes });

export function readGlb(body: unknown, name: unknown, fallbackName: string) {
  if (!Buffer.isBuffer(body) || body.length < 12 || body.toString("ascii", 0, 4) !== "glTF") {
    throw new HttpError(400, "File không phải .glb hợp lệ. Xuất file từ Blender bằng glTF Binary (.glb).", "BAD_MODEL");
  }
  const data = new Uint8Array(body);
  return { data, fileName: String(name ?? fallbackName).slice(0, 120), size: data.length };
}
