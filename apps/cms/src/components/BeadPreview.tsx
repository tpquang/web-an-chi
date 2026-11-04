import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Props = {
  // Canvas vuông chứa ảnh vân đã cắt; đổi version mỗi khi nội dung canvas đổi
  source: HTMLCanvasElement | null;
  version: number;
  sizeMm: number;
  roughness: number;
  finish: string;
};

const MM = 0.1;
const COUNT = 7;

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

export function BeadPreview({ source, version, sizeMm, roughness, finish }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ texture: THREE.CanvasTexture | null; material: THREE.MeshPhysicalMaterial; beads: THREE.Mesh[]; group: THREE.Group; camera: THREE.PerspectiveCamera; controls: OrbitControls } | null>(null);

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
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotateSpeed = 1.2;

    const group = new THREE.Group();
    scene.add(group);
    const material = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.5 });
    api.current = { texture: null, material, beads: [], group, camera, controls };

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
    return () => {
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

  // Một đoạn vòng có hạt to ở giữa để xem cả cận cảnh lẫn lúc xâu thành chuỗi
  useEffect(() => {
    const s = api.current;
    if (!s) return;
    for (const bead of s.beads) {
      bead.geometry.dispose();
      bead.removeFromParent();
    }
    const r = (sizeMm * MM) / 2;
    const geometry = new THREE.SphereGeometry(r, 64, 48).rotateX(Math.PI / 2);
    const ring = (COUNT * sizeMm * MM * 2.4) / (2 * Math.PI);
    const step = (sizeMm * MM) / ring;
    s.beads = Array.from({ length: COUNT }, (_, i) => {
      const angle = Math.PI / 2 + (i - (COUNT - 1) / 2) * step;
      const mesh = new THREE.Mesh(geometry, s.material);
      mesh.position.set(Math.cos(angle) * ring, 0, Math.sin(angle) * ring - ring);
      mesh.rotation.y = -angle;
      s.group.add(mesh);
      return mesh;
    });
    const dist = r * 9 + 0.4;
    s.camera.position.set(0, dist * 0.55, dist);
    s.controls.minDistance = r * 3;
    s.controls.maxDistance = dist * 2;
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
  }, [roughness, finish]);

  return <div ref={host} className="size-full touch-none [&>canvas]:size-full" />;
}
