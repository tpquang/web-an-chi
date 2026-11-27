import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { Built } from "./models";

// Cạnh lớn nhất của vật sau khi co, cùng cỡ với các mô hình dựng bằng code để khung xem dùng chung khoảng cách camera
const TARGET_SIZE = 12;
const FOV = 30;

// Mô hình .glb tải lên từ CMS (quy cách ở skill anchi-media mục 2). File xuất theo đơn vị nào cũng được:
// co về TARGET_SIZE, đặt giữa theo chiều ngang và đáy ở y = 0 như các builder khác
export async function buildGlb(url: string): Promise<Built> {
  const gltf = await new GLTFLoader().loadAsync(url);
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const scale = TARGET_SIZE / Math.max(size.x, size.y, size.z, 1e-6);
  model.scale.setScalar(scale);
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

  const group = new THREE.Group();
  group.add(model);
  const height = size.y * scale;
  const radius = (size.length() * scale) / 2;
  return {
    group,
    height,
    footprint: Math.max(size.x, size.z) * scale * 1.4,
    distance: (radius / Math.sin(THREE.MathUtils.degToRad(FOV / 2))) * 1.1,
  };
}
