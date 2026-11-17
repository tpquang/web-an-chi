import * as THREE from "three";
import { CONE, coneBaseGeometry, coneGeometry, coneHoleGeometry, powderGrain } from "./cone-geometry";
import { BOX, bodyGeometry, bottomGeometry, lidGeometry, lidPanelGeometry, paperGrain } from "./round-box-geometry";

// Mỗi mô hình trả về nhóm đặt đáy ở y = 0, chiều cao để căn giữa khung và khoảng cách camera thấy trọn
export type Built = { group: THREE.Group; height: number; distance: number; footprint: number };
export type Loader = (url: string) => Promise<THREE.Texture>;

const BROWN = 0x5a3b26; // allow-color
const CREAM = 0xf0e7db; // allow-color
// Màu bột trầm ép theo ảnh nụ mẫu
const POWDER = 0xc8964f; // allow-color
const HOLE = 0x3a2615; // allow-color

// Hộp tròn nụ trầm dựng từ hai ảnh in ở design/assets (xuất từ Figma cùng tỉ lệ: nắp 400, nhãn thân 1253 × 434, 1253 ≈ π × 400).
// Ảnh bọc ở public/models/hop-tron, xuất lại bằng: qlmanage -t -s 4096 vo-hop-tron.pdf rồi sips sang JPEG
export async function buildBox(load: Loader): Promise<Built> {
  const [body, lid] = await Promise.all([load("/models/hop-tron/than.jpg"), load("/models/hop-tron/nap.jpg")]);
  // Giấy in mờ hơi nhám: độ nhám thật = 1 × độ xám của vân (0,6 đến 0,8)
  const grain = paperGrain();
  const paper = (options: THREE.MeshStandardMaterialParameters) =>
    new THREE.MeshStandardMaterial({ roughness: 1, roughnessMap: grain, bumpMap: grain, bumpScale: 0.6, ...options });
  const group = new THREE.Group();
  group.add(
    new THREE.Mesh(bodyGeometry(), paper({ map: body })),
    new THREE.Mesh(bottomGeometry(), paper({ color: CREAM })),
    new THREE.Mesh(lidGeometry(), paper({ color: BROWN, side: THREE.DoubleSide })),
    new THREE.Mesh(lidPanelGeometry(), paper({ map: lid })),
  );
  return { group, height: BOX.height, distance: 30, footprint: BOX.radius * 3.2 };
}

// Hai nụ trầm: một nụ đứng, một nụ nằm quay đáy ra trước để thấy lỗ, giống ảnh nụ mẫu
export async function buildCones(): Promise<Built> {
  const grain = powderGrain();
  const powder = new THREE.MeshStandardMaterial({ color: POWDER, roughness: 1, roughnessMap: grain, bumpMap: grain, bumpScale: 2.5 });
  const make = () => {
    const cone = new THREE.Group();
    cone.add(new THREE.Mesh(coneGeometry(), powder), new THREE.Mesh(coneBaseGeometry(), powder));
    cone.add(new THREE.Mesh(coneHoleGeometry(), new THREE.MeshStandardMaterial({ color: HOLE, roughness: 1 })));
    return cone;
  };
  const standing = make();
  standing.position.set(-0.9, 0, -0.4);
  // Nằm trên cạnh bên: trục chúc xuống đúng nửa góc đỉnh thì cạnh bên nằm phẳng trên bàn,
  // nâng lên r × cos(nửa góc) cho cạnh chạm bàn, rồi quay đáy về phía camera
  const half = Math.atan2(CONE.radius, CONE.height);
  const tipped = make();
  tipped.rotation.x = Math.PI / 2 + half;
  const lying = new THREE.Group();
  lying.add(tipped);
  lying.rotation.y = Math.PI - 0.7;
  lying.position.set(1.1, CONE.radius * Math.cos(half), 1.6);
  const group = new THREE.Group();
  group.add(standing, lying);
  return { group, height: CONE.height, distance: 15, footprint: 6.5 };
}
