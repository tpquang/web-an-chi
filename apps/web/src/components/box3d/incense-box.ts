import * as THREE from "three";
import type { Built, Loader } from "./models";
import { paperGrain } from "./round-box-geometry";

// Hộp nhang trầm chữ nhật, đơn vị cm, dựng từ ảnh in design/assets/Hop huong.pdf (900 × 1950).
// Ảnh in là bốn mặt trải phẳng theo thứ tự: hông trái, mặt sau, hông phải, mặt trước (vạch gấp đo trên ảnh).
// File in không ghi kích thước thật nên chỉ giữ đúng tỉ lệ: mặt trước rộng 7, các cạnh khác suy theo ảnh
const FOLDS = [0, 0.1101, 0.5, 0.6101, 1];
const WIDTH = 7;
const DEPTH = (WIDTH * (FOLDS[1] - FOLDS[0])) / (FOLDS[4] - FOLDS[3]);
const HEIGHT = (WIDTH * 1950) / (900 * (FOLDS[4] - FOLDS[3]));

const CREAM = 0xefe6da; // allow-color
const BROWN = 0x5a3b26; // allow-color
// Màu bột trầm của thân nhang
const STICK = 0x7a5536; // allow-color
const INSIDE = 0xd9ccbb; // allow-color

// Một mặt hông hoặc mặt chính: tấm phẳng lấy dải ảnh [u0, u1], quay quanh trục đứng rồi đẩy ra mép hộp
function panel(width: number, u0: number, u1: number, angle: number, offset: number) {
  const geometry = new THREE.PlaneGeometry(width, HEIGHT);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
  geometry.translate(0, HEIGHT / 2, offset);
  return geometry.rotateY(angle);
}

// Bó nhang bên trong: que đứng thẳng xếp kín lòng hộp, chỉ thấy qua ô cửa sổ ở mặt trước
function sticks(material: THREE.Material) {
  const radius = 0.11;
  const length = HEIGHT - 0.6;
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 8).translate(0, length / 2 + 0.1, 0);
  const cols = Math.floor((WIDTH - 0.3) / (radius * 2.05));
  const rows = Math.floor((DEPTH - 0.3) / (radius * 1.8));
  const mesh = new THREE.InstancedMesh(geometry, material, cols * rows);
  const matrix = new THREE.Matrix4();
  let i = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Hàng so le và lệch nhẹ ngẫu nhiên cho giống bó nhang thật
      const x = -WIDTH / 2 + 0.25 + col * radius * 2.05 + (row % 2) * radius + (Math.random() - 0.5) * 0.04;
      const z = -DEPTH / 2 + 0.25 + row * radius * 1.8;
      const tilt = (Math.random() - 0.5) * 0.01;
      matrix.makeRotationZ(tilt).setPosition(x, 0, z);
      mesh.setMatrixAt(i++, matrix);
    }
  }
  return mesh;
}

export async function buildIncenseBox(load: Loader): Promise<Built> {
  const [print, windowMask] = await Promise.all([load("/models/hop-nhang/vo.jpg"), load("/models/hop-nhang/cua-so.png")]);
  windowMask.colorSpace = THREE.NoColorSpace;
  const grain = paperGrain();
  const paper = (options: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial({ roughness: 1, roughnessMap: grain, bumpMap: grain, bumpScale: 0.6, ...options });
  const printed = paper({ map: print });
  // Mặt trước có ô cửa sổ: phần trắng của ảnh in là chỗ khoét, đọc từ mặt nạ đen trắng
  const front = paper({ map: print, alphaMap: windowMask, alphaTest: 0.5 });

  const [left, back, right, frontStart] = FOLDS;
  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(panel(WIDTH, frontStart, FOLDS[4], 0, DEPTH / 2), front),
    new THREE.Mesh(panel(DEPTH, right, frontStart, -Math.PI / 2, WIDTH / 2), printed),
    new THREE.Mesh(panel(WIDTH, back, right, Math.PI, DEPTH / 2), printed),
    new THREE.Mesh(panel(DEPTH, left, back, Math.PI / 2, WIDTH / 2), printed),
    // Nắp trên màu kem như nền ảnh in, đáy màu nâu như dải dưới
    new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, DEPTH).rotateX(-Math.PI / 2).translate(0, HEIGHT, 0), paper({ color: CREAM })),
    new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, DEPTH).rotateX(Math.PI / 2), paper({ color: BROWN })),
    // Lòng hộp: khối nhỏ hơn một chút, chỉ vẽ mặt trong, để nhìn qua cửa sổ không thấy mặt sau ảnh in
    new THREE.Mesh(new THREE.BoxGeometry(WIDTH - 0.04, HEIGHT - 0.04, DEPTH - 0.04).translate(0, HEIGHT / 2, 0), paper({ color: INSIDE, side: THREE.BackSide })),
    sticks(new THREE.MeshStandardMaterial({ color: STICK, roughness: 1, bumpMap: grain, bumpScale: 1.5 })),
  );
  // Hộp cao và hẹp: lùi camera theo chiều cao, bóng đổ theo cạnh dài
  return { group, height: HEIGHT, distance: HEIGHT * 2.4, footprint: WIDTH * 1.8 };
}
