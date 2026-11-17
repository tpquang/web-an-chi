import * as THREE from "three";

// Nụ trầm hình chóp tròn, đơn vị cm: cao 3,8, đường kính đáy 1,4, đỉnh bo tròn, đáy có lỗ nhỏ
export const CONE = { height: 3.8, radius: 1.4 / 2, tip: 0.14, bevel: 0.05, hole: 0.09 };

const SEGMENTS = 96;

// Mặt cắt từ mép đáy lên đỉnh. Đỉnh là cung tròn tiếp xúc hai cạnh bên nên bo liền, không gãy
export function coneGeometry() {
  const { height: h, radius: r, tip, bevel } = CONE;
  const side = Math.hypot(r, h);
  const cos = h / side;
  const sin = r / side;
  const center = h - tip / sin;
  const from = Math.atan2(sin, cos);
  const profile = [new THREE.Vector2(r - bevel, 0), new THREE.Vector2(r, bevel * 0.8)];
  for (let i = 0; i <= 10; i++) {
    const a = from + ((Math.PI / 2 - from) * i) / 10;
    profile.push(new THREE.Vector2(Math.max(Math.cos(a) * tip, 0), center + Math.sin(a) * tip));
  }
  // Toạ độ ảnh theo chiều cao thật để vân bột không bị kéo thành sọc dọc
  const geometry = new THREE.LatheGeometry(profile, SEGMENTS);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, position.getY(i) / h);
  return geometry;
}

// Đáy phẳng có lỗ ở giữa, lỗ là đĩa tối nằm sát trên đáy
export function coneBaseGeometry() {
  const { radius, bevel, hole } = CONE;
  return new THREE.RingGeometry(hole, radius - bevel, SEGMENTS).rotateX(Math.PI / 2);
}

export function coneHoleGeometry() {
  return new THREE.CircleGeometry(CONE.hole, 24).rotateX(Math.PI / 2).translate(0, 0.002, 0);
}

// Vân bột trầm ép: hạt nhiễu to hơn vân giấy, làm bề mặt sần như ảnh mẫu
export function powderGrain() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 110 + Math.random() * 120;
    image.data.set([v, v, v, 255], i * 4);
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}
