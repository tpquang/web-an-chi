import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Xem file .glb của charm, xoay bằng tay. data null thì để trống khung
export function ModelPreview({ data, onError }: { data: ArrayBuffer | null; onError(message: string): void }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ group: THREE.Group; camera: THREE.PerspectiveCamera; controls: OrbitControls } | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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

    const camera = new THREE.PerspectiveCamera(30, 1, 0.001, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    const group = new THREE.Group();
    scene.add(group);
    api.current = { group, camera, controls };

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
      group.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);

  useEffect(() => {
    const s = api.current;
    if (!s) return;
    s.group.clear();
    setInfo(null);
    if (!data) return;
    let live = true;
    new GLTFLoader().parse(
      data,
      "",
      (gltf) => {
        if (!live) return;
        const model = gltf.scene;
        // Đặt charm vào giữa khung và lùi camera vừa đủ thấy trọn, file xuất theo đơn vị nào cũng được
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(box.getCenter(new THREE.Vector3()));
        s.group.add(model);
        const radius = Math.max(size.length() / 2, 1e-4);
        const dist = radius / Math.sin(THREE.MathUtils.degToRad(s.camera.fov / 2)) * 1.15;
        s.camera.position.set(0, dist * 0.3, dist);
        s.camera.near = dist / 100;
        s.camera.far = dist * 10;
        s.camera.updateProjectionMatrix();
        s.controls.minDistance = dist * 0.4;
        s.controls.maxDistance = dist * 3;
        s.controls.target.set(0, 0, 0);
        let triangles = 0;
        model.traverse((o) => {
          const g = (o as THREE.Mesh).geometry;
          if (g) triangles += (g.index ? g.index.count : g.attributes.position.count) / 3;
        });
        setInfo(`${Math.round(triangles).toLocaleString("vi-VN")} tam giác`);
      },
      () => live && onError("Không đọc được file 3D. Xuất lại từ Blender bằng glTF Binary (.glb)."),
    );
    return () => {
      live = false;
    };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative size-full">
      <div ref={host} className="size-full touch-none [&>canvas]:size-full" />
      {info && <p className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-surface/90 px-3 py-1 text-xs tabular-nums shadow-e1">{info}</p>}
    </div>
  );
}
