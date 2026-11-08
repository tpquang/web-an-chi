import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Props = {
  // Canvas vuông chứa ảnh vân đã cắt; đổi version mỗi khi nội dung canvas đổi
  source: HTMLCanvasElement | null;
  version: number;
  sizeMm: number;
  roughness: number;
  // Hệ số nhân vào màu ảnh, giống web: 1 giữ nguyên
  brightness?: number;
  finish: string;
  // Gắn hàm chụp chính hạt đang dựng thành ảnh vuông nền trong, dùng làm ảnh hạt ở trang thiết kế vòng
  captureRef?: MutableRefObject<(() => Promise<Blob | null>) | null>;
};

export const THUMB_SIDE = 256;

const MM = 0.1;

// Cách bọc ảnh giống hệt web: hai cực của hạt nằm ở lỗ xâu dây, ảnh lặp gương hai lần quanh hạt
// nên nối liền mà không cần chỉnh ảnh. Sửa ở đây thì sửa cả apps/web/src/components/bracelet/bracelet-scene.tsx
export function wrapTexture<T extends THREE.Texture>(texture: T): T {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(2, 1);
  texture.anisotropy = 8;
  return texture;
}

export function BeadPreview({ source, version, sizeMm, roughness, brightness = 1, finish, captureRef }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ texture: THREE.CanvasTexture | null; material: THREE.MeshPhysicalMaterial; beads: THREE.Mesh[]; group: THREE.Group; camera: THREE.PerspectiveCamera; controls: OrbitControls; scene: THREE.Scene } | null>(null);

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a2a1f, 0.9));
    const sun = new THREE.DirectionalLight(0xffe2c0, 1.6);
    sun.position.set(4, 8, 5);
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    // Xoay bằng tay để soi vân từng góc, không tự quay
    controls.autoRotate = false;
    controls.rotateSpeed = 0.8;

    const group = new THREE.Group();
    scene.add(group);
    const material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.5 });
    api.current = { texture: null, material, beads: [], group, camera, controls, scene };

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });
    // Chụp hạt bằng renderer riêng, góc nhìn cố định và nền trong suốt, để mọi loại trầm có ảnh cùng khung
    // dù người dùng đang xoay hạt hay chọn cỡ nào. Hạt chiếm khoảng 80% khung, lỗ xâu nằm ngang như trên vòng
    if (captureRef) {
      captureRef.current = async () => {
        const s = api.current;
        const bead = s?.beads[0];
        if (!s || !bead) return null;
        const shot = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        shot.setPixelRatio(1);
        shot.setSize(THUMB_SIDE, THUMB_SIDE, false);
        shot.toneMapping = renderer.toneMapping;
        shot.setClearColor(0x000000, 0);
        const r = (bead.geometry as THREE.SphereGeometry).parameters.radius;
        const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
        const dist = r / Math.sin(THREE.MathUtils.degToRad(15)) / 0.8;
        cam.position.set(0, dist * 0.32, dist * 0.95);
        cam.lookAt(0, 0, 0);
        const rotation = s.group.rotation.clone();
        s.group.rotation.set(0, 0, 0);
        shot.render(s.scene, cam);
        s.group.rotation.copy(rotation);
        const blob = await new Promise<Blob | null>((resolve) => shot.domElement.toBlob(resolve, "image/webp", 0.9));
        const out = blob && blob.type === "image/webp" ? blob : await new Promise<Blob | null>((resolve) => shot.domElement.toBlob(resolve, "image/png"));
        shot.dispose();
        return out;
      };
    }
    return () => {
      if (captureRef) captureRef.current = null;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      for (const bead of api.current?.beads ?? []) bead.geometry.dispose();
      api.current?.texture?.dispose();
      material.dispose();
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);

  // Đúng một hạt ở giữa khung, lỗ xâu nằm ngang như trên vòng
  useEffect(() => {
    const s = api.current;
    if (!s) return;
    for (const bead of s.beads) {
      bead.geometry.dispose();
      bead.removeFromParent();
    }
    const r = (sizeMm * MM) / 2;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48).rotateX(Math.PI / 2), s.material);
    s.group.add(mesh);
    s.beads = [mesh];
    const dist = r * 4.5;
    s.camera.position.set(0, dist * 0.35, dist);
    s.controls.minDistance = r * 2.2;
    s.controls.maxDistance = r * 8;
    s.controls.target.set(0, 0, 0);
  }, [sizeMm]);

  useEffect(() => {
    const s = api.current;
    if (!s) return;
    if (!source) {
      s.texture?.dispose();
      s.texture = null;
      s.material.map = null;
    } else if (!s.texture || s.texture.image !== source) {
      s.texture?.dispose();
      s.texture = wrapTexture(new THREE.CanvasTexture(source));
      s.material.map = s.texture;
    } else s.texture.needsUpdate = true;
    s.material.needsUpdate = true;
  }, [source, version]);

  useEffect(() => {
    const s = api.current;
    if (!s) return;
    s.material.roughness = roughness;
    s.material.metalness = finish === "metal" ? 1 : 0;
    s.material.clearcoat = finish === "stone" ? 1 : 0;
    s.material.color.setScalar(brightness);
  }, [roughness, brightness, finish]);

  return <div ref={host} className="size-full touch-none [&>canvas]:size-full" />;
}
