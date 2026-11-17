import * as THREE from "three";

// Hộp tròn nụ trầm, đơn vị cm. Hộp cao 9, đường kính 8,5. Nắp cao 3 phủ đúng dải nâu 1/3 trên của nhãn thân.
// Nắp và thân cùng đường kính, chỗ giáp nhau có đường hằn. Mép nắp cuộn tròn, mặt nắp thụt xuống 0,5
export const BOX = {
  height: 9,
  radius: 8.5 / 2,
  lidHeight: 3,
  // Độ dày mép cuộn của nắp
  rim: 0.26,
  // Mặt nắp thấp hơn mép nắp
  recess: 0.5,
  // Bo ở đường hằn giữa nắp và thân, bo đáy hộp
  seam: 0.07,
  bevel: 0.1,
  // Rãnh hằn sâu chỗ mặt nắp gặp thành trong của mép: sâu và rộng
  crease: 0.15,
  creaseWidth: 0.1,
};

const SEGMENTS = 160;

// Các điểm trên cung tròn tâm (cx, cy), góc tính bằng radian, 0 là hướng ra ngoài trục hộp
function arc(cx: number, cy: number, r: number, from: number, to: number, steps = 8) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return new THREE.Vector2(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  });
}

// Thân hộp: mặt cắt đi từ đáy lên, xoay quanh trục. Toạ độ nhãn theo chiều cao để ảnh in không bị méo ở chỗ bo.
// Bắt đầu ở -90° để khối logo "Nụ trầm" (1/4 chiều dài nhãn) quay ra trước
export function bodyGeometry() {
  const { height, radius: r, lidHeight, seam, bevel } = BOX;
  const joint = height - lidHeight;
  const profile = [
    ...arc(r - bevel, bevel, bevel, -Math.PI / 2, 0),
    new THREE.Vector2(r, joint - seam),
    ...arc(r - seam, joint - seam, seam, 0, Math.PI / 2, 4),
    // Phần thân nằm trong nắp, để đường hằn không bị hở
    new THREE.Vector2(r - seam, joint + 0.4),
  ];
  return heightUv(new THREE.LatheGeometry(profile, SEGMENTS, -Math.PI / 2));
}

// Toạ độ ảnh theo chiều cao thật thay vì theo số điểm mặt cắt, để nhãn và vân giấy không bị kéo giãn
function heightUv(geometry: THREE.LatheGeometry) {
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, position.getY(i) / BOX.height);
  return geometry;
}

// Đáy hộp phẳng, nhỏ hơn thân đúng phần bo
export function bottomGeometry() {
  return new THREE.CircleGeometry(BOX.radius - BOX.bevel, SEGMENTS).rotateX(Math.PI / 2);
}

// Thành nắp, mép cuộn và lòng nắp thụt xuống. Mặt nắp có in logo là một đĩa riêng
export function lidGeometry() {
  const { height, radius: r, lidHeight, seam, rim, recess, crease, creaseWidth } = BOX;
  const joint = height - lidHeight;
  const half = rim / 2;
  const floor = height - recess;
  const profile = [
    ...arc(r - seam, joint + seam, seam, -Math.PI / 2, 0, 4),
    new THREE.Vector2(r, height - half),
    ...arc(r - half, height - half, half, 0, Math.PI, 10),
    // Thành trong đi thẳng xuống quá mặt nắp thành rãnh hằn, rồi lên lại mặt nắp
    new THREE.Vector2(r - rim, floor - crease),
    new THREE.Vector2(r - rim - creaseWidth / 2, floor - crease),
    new THREE.Vector2(r - rim - creaseWidth, floor),
  ];
  return heightUv(new THREE.LatheGeometry(profile, SEGMENTS));
}

// Mặt nắp: đĩa ở đáy lòng nắp, ảnh in nắp phủ trọn đĩa. Nhìn từ trước thì chữ đứng thẳng.
// Ảnh nắp là hình tròn trong khung vuông nền trắng, thu toạ độ vào 3% để mép đĩa không lấy phải viền trắng
export function lidPanelGeometry() {
  const { height, radius, rim, recess, creaseWidth } = BOX;
  // Đĩa luồn xuống dưới mép rãnh 0,6 mm và thấp hơn 0,1 mm, để khe giữa đĩa và thành nắp không lộ nền thành viền sáng
  const geometry = new THREE.CircleGeometry(radius - rim - creaseWidth + 0.06, SEGMENTS).rotateX(-Math.PI / 2).translate(0, height - recess - 0.01, 0);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * 0.97, 0.5 + (uv.getY(i) - 0.5) * 0.97);
  return geometry;
}

// Vân giấy: nhiễu xám nhỏ lặp lại, dùng làm bump và độ nhám để mặt giấy hơi sần, không bóng
export function paperGrain() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 150 + Math.random() * 60;
    image.data.set([v, v, v, 255], i * 4);
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(30, 10);
  return texture;
}
