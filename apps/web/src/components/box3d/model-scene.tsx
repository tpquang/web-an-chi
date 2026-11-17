"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildIncenseBox } from "./incense-box";
import { buildBox, buildCones, type Built, type Loader } from "./models";

export type SceneModel = "box" | "cone" | "incense";

const builders: Record<SceneModel, (load: Loader) => Promise<Built>> = { box: buildBox, cone: () => buildCones(), incense: buildIncenseBox };

type Props = { model: SceneModel; label: string; onReady(): void; onError(): void };

// Khung xem 3D dùng chung: ánh sáng, xoay, phóng to, bóng đổ. Hình dáng từng mô hình ở models.ts
export function ModelScene({ model, label, onReady, onError }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const turn = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Giữ màu gần bản gốc, ACES làm nâu ngả cam và kem ngả xám. Giảm sáng chung để nét chữ mảnh không bị chói mờ
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.92;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
    // Đèn chiếu chếch từ trước để mặt trên không bị loá và chỗ hằn có bóng
    const sun = new THREE.DirectionalLight(0xffffff, 0.75); // allow-color
    sun.position.set(10, 14, 24);
    scene.add(sun);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI * 0.58;
    // Tự xoay chậm để khách biết là xoay được, chạm vào là dừng hẳn
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotateSpeed = 1.5;
    controls.addEventListener("start", () => (controls.autoRotate = false));

    const loader = new THREE.TextureLoader();
    const load: Loader = (url) =>
      loader.loadAsync(url).then((texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return texture;
      });

    let distance = 30;
    let root: THREE.Group | null = null;
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      // Khung hẹp thì lùi camera để vẫn thấy trọn
      camera.position.setLength(distance * Math.max(1, 1 / camera.aspect));
      camera.updateProjectionMatrix();
    };

    let live = true;
    builders[model](load)
      .then((built) => {
        if (!live) return;
        // Gốc mô hình ở đáy, dời xuống nửa chiều cao để nằm giữa khung
        root = built.group;
        root.position.y = -built.height / 2;
        root.add(contactShadow(built.footprint));
        scene.add(root);
        turn.current = root;
        distance = built.distance;
        controls.minDistance = distance * 0.55;
        controls.maxDistance = distance * 1.6;
        camera.position.set(0, distance / 3, distance);
        resize();
        onReady();
      })
      .catch(() => live && onError());

    controls.target.set(0, -0.3, 0);
    camera.position.set(0, 10, 28);
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      live = false;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      root?.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.MeshStandardMaterial | undefined;
        material?.map?.dispose();
        material?.bumpMap?.dispose();
        material?.alphaMap?.dispose();
        material?.dispose();
      });
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      turn.current = null;
    };
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bàn phím: mũi tên trái phải để xoay
  function onKey(event: React.KeyboardEvent) {
    if (!turn.current || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    event.preventDefault();
    turn.current.rotation.y += event.key === "ArrowLeft" ? -0.3 : 0.3;
  }

  return (
    <div
      ref={host}
      role="img"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKey}
      className="size-full cursor-grab touch-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wood active:cursor-grabbing [&>canvas]:size-full"
    />
  );
}

// Bóng mềm dưới đáy vẽ bằng canvas, không cần bật đổ bóng thật
function contactShadow(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(0,0,0,0.45)"); // allow-color
  gradient.addColorStop(0.55, "rgba(0,0,0,0.18)"); // allow-color
  gradient.addColorStop(1, "rgba(0,0,0,0)"); // allow-color
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  shadow.position.y = -0.02;
  return shadow;
}
