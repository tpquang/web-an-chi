"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Bead } from "@/lib/api";

const beadTextureUrl = (texture: NonNullable<Bead["texture"]>) => `/api/bead-textures/${texture.id}?v=${texture.version}`;

// key cố định theo từng hạt để hạt giữ mesh và trượt êm khi thứ tự đổi
export type SceneItem = { key: number; bead: Bead };

// Khoảng cách camera để thấy trọn vòng. Khung hẹp hơn vuông thì lùi thêm, nếu không vòng bị cắt hai bên
const camDistance = (radius: number, aspect: number) => Math.max(radius * 3.4 + 2.5, 6) * Math.max(1, 1 / aspect);

export type SceneHandle = {
  // Hạt từ kho đang kéo qua cảnh, bead null khi thôi kéo. Trả về true khi con trỏ nằm trong khung 3D.
  // touch: hạt nổi phía trên ngón tay để không bị che
  dragOver(bead: Bead | null, clientX: number, clientY: number, touch?: boolean): boolean;
  // Thả hạt từ kho, trả về vị trí chèn hoặc null khi thả ngoài vòng
  drop(clientX: number, clientY: number, touch?: boolean): number | null;
  // Bật tắt tự xoay vòng, trả về trạng thái mới
  spin(): boolean;
};

type Props = {
  items: SceneItem[];
  selected: number | null;
  onSelect(index: number | null): void;
  onMove(from: number, to: number): void;
  onRemove(index: number): void;
  label: string;
};

// Đơn vị trong cảnh là cm, vòng nằm trên mặt phẳng y = 0
const MM = 0.1;
const START = -Math.PI / 2;
const MIN_RADIUS = 1.6;
// Độ cao hạt khi đang gắp
const LIFT = 0.6;
// Tốc độ tiến về đích mỗi giây. Hàm mũ cho cảm giác vào nhanh rồi chậm dần, không vượt đích.
// Với 14/giây, hạt đi được 95% quãng đường sau khoảng 210ms. Lúc ra nhanh hơn lúc vào.
const RATE_IN = 14;
const RATE_OUT = 20;
const RATE_FOLLOW = 24;
// Khoảng đẩy hạt lên trên ngón tay khi kéo bằng cảm ứng, tính bằng px
const FINGER_OFFSET = 56;
// Chạm trượt hạt nhỏ trong khoảng này vẫn tính là chạm trúng hạt gần nhất, tính bằng px
const PICK_SLOP = { mouse: 8, touch: 28 };

const damp = (x: number, target: number, rate: number, dt: number) => target + (x - target) * Math.exp(-rate * dt);
function dampAngle(a: number, target: number, rate: number, dt: number) {
  const d = Math.atan2(Math.sin(target - a), Math.cos(target - a));
  return a + d * (1 - Math.exp(-rate * dt));
}

function layout(sizes: number[]) {
  const total = sizes.reduce((sum, size) => sum + size, 0) || 1;
  const radius = Math.max((total * MM) / (2 * Math.PI), MIN_RADIUS);
  let angle = START;
  const mids = sizes.map((size) => {
    const span = (size / total) * Math.PI * 2;
    angle += span;
    return angle - span / 2;
  });
  return { radius, mids };
}

// Vân gỗ vẽ bằng canvas để hạt trầm không trơn như nhựa khi chưa có ảnh thật
const grainCache = new Map<string, THREE.CanvasTexture>();
function grain(color: string) {
  const cached = grainCache.get(color);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 128);
  const base = new THREE.Color(color);
  for (let i = 0; i < 46; i++) {
    const shade = base.clone().offsetHSL(0, 0, (Math.random() - 0.55) * 0.16);
    ctx.strokeStyle = `#${shade.getHexString()}`;
    ctx.globalAlpha = 0.35 + Math.random() * 0.4;
    ctx.lineWidth = 0.6 + Math.random() * 2.4;
    ctx.beginPath();
    const y = Math.random() * 128;
    ctx.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) ctx.lineTo(x, y + Math.sin(x / 30 + i) * 5 + (Math.random() - 0.5) * 3);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  grainCache.set(color, texture);
  return texture;
}

// Ảnh vân từ CMS. Cách bọc giống hệt phần xem trước ở apps/cms/src/components/BeadPreview.tsx:
// hai cực của hạt nằm ở lỗ xâu dây, ảnh lặp gương hai lần quanh hạt nên nối liền mà không cần chỉnh ảnh
const photoCache = new Map<string, THREE.Texture>();
const loader = typeof window === "undefined" ? null : new THREE.TextureLoader();
// onLoad nhận ảnh qua tham số: ảnh đã có trong cache thì onLoad chạy ngay, trước cả khi photo() trả về
function photo(texture: NonNullable<Bead["texture"]>, onLoad: (tex: THREE.Texture) => void) {
  const url = beadTextureUrl(texture);
  const cached = photoCache.get(url);
  if (cached) {
    if (cached.image) onLoad(cached);
    else cached.userData.waiting.push(onLoad);
    return cached;
  }
  const tex = loader!.load(url, () => {
    for (const fn of tex.userData.waiting as ((t: THREE.Texture) => void)[]) fn(tex);
    tex.userData.waiting = [];
  });
  tex.userData.waiting = [onLoad];
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.MirroredRepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(2, 1);
  tex.anisotropy = 8;
  photoCache.set(url, tex);
  return tex;
}

function material(bead: Bead): THREE.MeshStandardMaterial {
  const roughness = bead.texture?.roughness;
  const mat =
    bead.finish === "metal" ? new THREE.MeshStandardMaterial({ color: bead.color, metalness: 1, roughness: roughness ?? 0.28 })
    : bead.finish === "stone" ? new THREE.MeshPhysicalMaterial({ color: bead.color, roughness: roughness ?? 0.12, clearcoat: 1, transmission: bead.texture ? 0 : 0.25, thickness: 0.5 })
    : new THREE.MeshStandardMaterial({ map: grain(bead.color), roughness: roughness ?? 0.5, metalness: 0 });
  // Có ảnh vân thì hiện vân giả trước, ảnh tải xong mới thay để hạt không trắng trơn lúc chờ
  if (bead.texture) {
    photo(bead.texture, (tex) => {
      mat.map = tex;
      // Ảnh nhân với màu vật liệu: hệ số sáng tối chỉnh ở CMS, 1 là giữ nguyên ảnh
      mat.color.setScalar(bead.texture?.brightness ?? 1);
      mat.needsUpdate = true;
    });
  }
  mat.emissive.setHex(0x6b4a1c);
  mat.emissiveIntensity = 0;
  return mat;
}

function geometry(bead: Bead) {
  const r = (bead.sizeMm * MM) / 2;
  // Chặn hạt dẹt như con lăn, charm hơi dẹt, hạt tròn đều
  if (bead.kind === "CHARM" && bead.sizeMm <= 6) return new THREE.CylinderGeometry(r * 1.4, r * 1.4, r * 1.6, 32).rotateZ(Math.PI / 2);
  // Xoay để hai cực của hình cầu nằm theo lỗ xâu (trục z của hạt là tiếp tuyến vòng)
  const g = new THREE.SphereGeometry(r, 40, 28).rotateX(Math.PI / 2);
  if (bead.kind === "CHARM") g.scale(0.85, 1.05, 1.05);
  return g;
}

// Trạng thái hiển thị của một hạt, tính bằng toạ độ cực để hạt trượt theo cung tròn
type Entry = {
  key: number;
  bead: Bead;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  a: number;
  r: number;
  y: number;
  s: number;
  glow: number;
  opacity: number;
  tiltX: number;
  tiltZ: number;
  delay: number;
  leaving: boolean;
};

type Zone = { hit: THREE.Vector3 | null; insert: number | null; inside: boolean };

type RingDrag = { key: number; from: number; startX: number; startY: number; moved: boolean; zone: Zone };
type StockDrag = { bead: Bead; ghost: Entry; zone: Zone };

function setOpacity(mat: THREE.MeshStandardMaterial, opacity: number) {
  mat.opacity = opacity;
  const transparent = opacity < 0.995;
  if (mat.transparent !== transparent) {
    mat.transparent = transparent;
    mat.depthWrite = !transparent;
    mat.needsUpdate = true;
  }
}

export const BraceletScene = forwardRef<SceneHandle, Props>(function BraceletScene({ items, selected, onSelect, onMove, onRemove, label }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const [removing, setRemoving] = useState(false);
  const api = useRef<{
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    group: THREE.Group;
    cord: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>;
    cordRadius: number;
    entries: Map<number, Entry>;
    keys: number[];
    radius: number;
    camGoal: number | null;
    selectedKey: number | null;
    hoverKey: number | null;
    ring: RingDrag | null;
    stock: StockDrag | null;
    // Hạt vừa thả từ kho, chờ thiết kế cập nhật để nhận key thật
    spawn: { entry: Entry; age: number } | null;
    tempKey: number;
  } | null>(null);
  const callbacks = useRef({ onSelect, onMove, onRemove, setRemoving });
  callbacks.current = { onSelect, onMove, onRemove, setRemoving };

  function create(key: number, bead: Bead): Entry {
    const s = api.current!;
    const mesh = new THREE.Mesh(geometry(bead), material(bead));
    mesh.userData.key = key;
    s.group.add(mesh);
    return { key, bead, mesh, a: START, r: s.radius, y: 0, s: 0, glow: 0, opacity: 1, tiltX: 0, tiltZ: 0, delay: 0, leaving: false };
  }

  function dispose(entry: Entry) {
    entry.mesh.removeFromParent();
    entry.mesh.geometry.dispose();
    entry.mesh.material.dispose();
  }

  // Cho một hạt rời cảnh bằng hiệu ứng thu nhỏ và mờ dần
  function retire(entry: Entry) {
    const s = api.current!;
    entry.leaving = true;
    entry.key = --s.tempKey;
    s.entries.set(entry.key, entry);
  }

  // Dựng cảnh một lần
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

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 7.5, 8.5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI * 0.62;

    const group = new THREE.Group();
    scene.add(group);
    const cordColor = getComputedStyle(el).getPropertyValue("--ink-2").trim() || "gray";
    const cord = new THREE.Mesh(new THREE.TorusGeometry(MIN_RADIUS, 0.035, 8, 120).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: cordColor, roughness: 0.9 }));
    cord.visible = false;
    scene.add(cord);

    api.current = {
      renderer, camera, controls, group, cord, cordRadius: MIN_RADIUS,
      entries: new Map(), keys: [], radius: MIN_RADIUS, camGoal: null,
      selectedKey: null, hoverKey: null, ring: null, stock: null, spawn: null, tempKey: 0,
    };
    const s = api.current;

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      if (api.current) api.current.camGoal = camDistance(api.current.radius, camera.aspect);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const clock = new THREE.Clock();
    const prev = new THREE.Vector3();

    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 1 / 20);
      // Giảm chuyển động thì hạt nhảy thẳng tới chỗ mới, chỉ giữ hiệu ứng mờ
      const still = motion.matches;
      const rate = (r: number) => (still ? Infinity : r);

      // Bố cục đích: các hạt còn lại trên vòng, chừa khe ở chỗ hạt đang gắp sẽ rơi vào
      const dragKey = s.ring?.moved ? s.ring.key : null;
      const order = s.keys.filter((key) => key !== dragKey && s.entries.has(key));
      const gapBead = s.ring?.moved ? s.entries.get(s.ring.key)?.bead : s.stock?.bead;
      const gapAt = (s.ring?.moved ? s.ring.zone.insert : s.stock?.zone.insert) ?? -1;
      const sizes = order.map((key) => s.entries.get(key)!.bead.sizeMm);
      if (gapBead && gapAt >= 0) sizes.splice(gapAt, 0, gapBead.sizeMm);
      const { radius, mids } = layout(sizes);

      order.forEach((key, i) => {
        const e = s.entries.get(key)!;
        if (e.delay > 0) {
          e.delay -= dt;
          e.mesh.visible = false;
          return;
        }
        e.mesh.visible = true;
        const on = key === s.selectedKey;
        e.a = dampAngle(e.a, mids[gapAt >= 0 && i >= gapAt ? i + 1 : i], rate(RATE_IN), dt);
        e.r = damp(e.r, radius, rate(RATE_IN), dt);
        e.y = damp(e.y, on ? 0.18 : 0, rate(RATE_IN), dt);
        e.s = damp(e.s, key === s.hoverKey && !s.ring ? 1.08 : 1, rate(RATE_IN), dt);
        e.glow = damp(e.glow, on ? 1 : 0, RATE_IN, dt);
        e.opacity = damp(e.opacity, 1, RATE_IN, dt);
        e.tiltX = damp(e.tiltX, 0, rate(RATE_IN), dt);
        e.tiltZ = damp(e.tiltZ, 0, rate(RATE_IN), dt);
      });

      // Hạt đang gắp bám theo ngón tay, nghiêng nhẹ theo hướng kéo
      const follow = (e: Entry, zone: Zone, show: boolean) => {
        e.mesh.visible = true;
        const out = zone.insert === null;
        if (zone.hit) {
          prev.set(Math.cos(e.a) * e.r, 0, Math.sin(e.a) * e.r);
          const t = 1 - Math.exp(-rate(RATE_FOLLOW) * dt);
          const x = prev.x + (zone.hit.x - prev.x) * t;
          const z = prev.z + (zone.hit.z - prev.z) * t;
          e.a = Math.atan2(z, x);
          e.r = Math.hypot(x, z);
          if (!still && dt > 0) {
            e.tiltX = damp(e.tiltX, THREE.MathUtils.clamp(((x - prev.x) / dt) * 0.05, -0.5, 0.5), RATE_IN, dt);
            e.tiltZ = damp(e.tiltZ, THREE.MathUtils.clamp(((z - prev.z) / dt) * 0.05, -0.5, 0.5), RATE_IN, dt);
          }
        }
        e.y = damp(e.y, LIFT, rate(RATE_IN), dt);
        e.s = damp(e.s, show ? 1.15 : 0, rate(show ? RATE_IN : RATE_OUT), dt);
        e.glow = damp(e.glow, out ? 0 : 0.6, RATE_IN, dt);
        e.opacity = damp(e.opacity, out ? 0.45 : 1, RATE_IN, dt);
      };
      if (dragKey !== null) {
        const e = s.entries.get(dragKey);
        if (e) follow(e, s.ring!.zone, true);
      }
      if (s.stock) follow(s.stock.ghost, s.stock.zone, s.stock.zone.inside);

      // Hạt thả từ kho mà thiết kế không nhận (đủ số hạt tối đa) thì cho biến mất
      if (s.spawn) {
        s.spawn.age += dt;
        const e = s.spawn.entry;
        e.y = damp(e.y, LIFT, RATE_IN, dt);
        if (s.spawn.age > 0.4) {
          retire(e);
          s.spawn = null;
        }
      }

      for (const e of [...s.entries.values()]) {
        if (e.leaving) {
          e.s = damp(e.s, 0, rate(RATE_OUT), dt);
          e.opacity = damp(e.opacity, 0, RATE_OUT, dt);
          if (e.s < 0.02 || e.opacity < 0.02) {
            dispose(e);
            s.entries.delete(e.key);
            continue;
          }
        }
        apply(e);
      }
      if (s.stock) apply(s.stock.ghost);
      if (s.spawn) apply(s.spawn.entry);

      // Dây co giãn theo vòng; chỉ dựng lại hình khi bán kính đổi đủ nhiều
      const showCord = order.length > 0 || gapAt >= 0;
      s.cord.visible = showCord;
      if (showCord) {
        s.cordRadius = damp(s.cordRadius, radius, rate(RATE_IN), dt);
        if (Math.abs((s.cord.userData.built ?? MIN_RADIUS) - s.cordRadius) > 0.002) {
          s.cord.geometry.dispose();
          s.cord.geometry = new THREE.TorusGeometry(s.cordRadius, 0.035, 8, 120).rotateX(Math.PI / 2);
          s.cord.userData.built = s.cordRadius;
        }
      }

      // Vòng to thì lùi camera dần dần để vẫn thấy trọn
      if (s.camGoal !== null) {
        const dist = camera.position.length();
        const nextDist = damp(dist, s.camGoal, rate(6), dt);
        camera.position.multiplyScalar(nextDist / dist);
        if (Math.abs(nextDist - s.camGoal) < 0.01) s.camGoal = null;
      }

      controls.update();
      renderer.render(scene, camera);
    });

    function apply(e: Entry) {
      e.mesh.position.set(Math.cos(e.a) * e.r, e.y, Math.sin(e.a) * e.r);
      // Trục lỗ xâu theo tiếp tuyến của vòng
      e.mesh.rotation.set(e.tiltZ, -e.a, -e.tiltX, "YXZ");
      e.mesh.scale.setScalar(Math.max(e.s, 0.0001));
      e.mesh.material.emissiveIntensity = e.glow * 0.55;
      setOpacity(e.mesh.material, e.opacity);
    }

    return () => {
      observer.disconnect();
      renderer.setAnimationLoop(null);
      for (const e of s.entries.values()) dispose(e);
      if (s.stock) dispose(s.stock.ghost);
      if (s.spawn) dispose(s.spawn.entry);
      cord.geometry.dispose();
      cord.material.dispose();
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);

  // Đồng bộ thiết kế: hạt mới hiện dần tại chỗ, hạt bị bỏ thu nhỏ rồi biến mất, hạt đổi chỗ thì trượt
  useEffect(() => {
    const s = api.current;
    if (!s) return;
    const seen = new Set(items.map((item) => item.key));
    for (const e of [...s.entries.values()]) {
      if (!e.leaving && !seen.has(e.key)) {
        s.entries.delete(e.key);
        retire(e);
      }
    }
    const { radius, mids } = layout(items.map((item) => item.bead.sizeMm));
    const fresh = items.filter((item) => !s.entries.has(item.key));
    let stagger = 0;
    items.forEach(({ key, bead }, i) => {
      const existing = s.entries.get(key);
      if (existing) {
        if (existing.bead.slug !== bead.slug) {
          existing.mesh.geometry.dispose();
          existing.mesh.material.dispose();
          existing.mesh.geometry = geometry(bead);
          existing.mesh.material = material(bead);
          existing.bead = bead;
          existing.s = 0.6;
        }
        return;
      }
      // Hạt vừa thả từ kho giữ nguyên mesh đang cầm, rơi thẳng vào khe
      if (s.spawn && s.spawn.entry.bead.slug === bead.slug) {
        const e = s.spawn.entry;
        s.spawn = null;
        e.key = key;
        e.mesh.userData.key = key;
        s.entries.set(key, e);
        return;
      }
      const e = create(key, bead);
      e.a = mids[i];
      e.r = radius;
      e.y = 0.35;
      e.opacity = 0;
      // Nhiều hạt cùng xuất hiện thì hiện lần lượt quanh vòng, tổng không quá 400ms
      if (fresh.length > 1) e.delay = (stagger++ / fresh.length) * 0.4;
      s.entries.set(key, e);
    });
    s.keys = items.map((item) => item.key);
    s.radius = radius;
    s.camGoal = camDistance(radius, s.camera.aspect);
  }, [items]);

  useEffect(() => {
    const s = api.current;
    if (s) s.selectedKey = selected !== null ? (items[selected]?.key ?? null) : null;
  }, [selected, items]);

  function ray(clientX: number, clientY: number, height: number): Zone {
    const s = api.current!;
    const rect = s.renderer.domElement.getBoundingClientRect();
    const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    const pointer = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    const caster = new THREE.Raycaster();
    caster.setFromCamera(pointer, s.camera);
    const hit = caster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -height), new THREE.Vector3());
    // Giữ hạt đang gắp trong tầm nhìn khi ngón tay ra khỏi khung
    if (hit) {
      const limit = s.radius + 2.5;
      const len = Math.hypot(hit.x, hit.z);
      if (len > limit) hit.multiplyScalar(limit / len);
    }
    return { hit, insert: null, inside };
  }

  // Vị trí chèn khi thả tại điểm trên màn hình, null khi điểm nằm xa vòng (bỏ hạt)
  function zone(clientX: number, clientY: number, without: number | null, touch = false): Zone {
    const s = api.current!;
    const z = ray(clientX, touch ? clientY - FINGER_OFFSET : clientY, LIFT);
    // Ra khỏi khung tính theo ngón tay thật, không theo điểm đã đẩy lên
    const rect = s.renderer.domElement.getBoundingClientRect();
    z.inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    if (!z.hit || !z.inside) return z;
    const order = s.keys.filter((key) => key !== without);
    if (!order.length) return { ...z, insert: 0 };
    const dist = Math.hypot(z.hit.x, z.hit.z);
    if (Math.abs(dist - s.radius) > Math.max(1.3, s.radius * 0.6)) return z;
    let angle = Math.atan2(z.hit.z, z.hit.x);
    while (angle < START) angle += Math.PI * 2;
    const { mids } = layout(order.map((key) => s.entries.get(key)?.bead.sizeMm ?? 10));
    const index = mids.findIndex((mid) => angle < mid);
    return { ...z, insert: index === -1 ? order.length : index };
  }

  useImperativeHandle(ref, () => ({
    dragOver(bead, clientX, clientY, touch) {
      const s = api.current;
      if (!s) return false;
      if (!bead) {
        if (s.stock) retire(s.stock.ghost);
        s.stock = null;
        return false;
      }
      const z = zone(clientX, clientY, null, touch);
      if (!s.stock || s.stock.bead.slug !== bead.slug) {
        if (s.stock) retire(s.stock.ghost);
        const ghost = create(--s.tempKey, bead);
        ghost.y = LIFT;
        if (z.hit) {
          ghost.a = Math.atan2(z.hit.z, z.hit.x);
          ghost.r = Math.hypot(z.hit.x, z.hit.z);
        }
        s.stock = { bead, ghost, zone: z };
      }
      s.stock.zone = z;
      return z.inside;
    },
    drop(clientX, clientY, touch) {
      const s = api.current;
      if (!s?.stock) return null;
      const z = zone(clientX, clientY, null, touch);
      const { ghost } = s.stock;
      s.stock = null;
      if (z.insert === null) {
        retire(ghost);
        return null;
      }
      if (s.spawn) retire(s.spawn.entry);
      s.spawn = { entry: ghost, age: 0 };
      return z.insert;
    },
    spin() {
      const s = api.current;
      if (!s) return false;
      s.controls.autoRotate = !s.controls.autoRotate;
      s.controls.autoRotateSpeed = 4;
      return s.controls.autoRotate;
    },
  }));

  // Chạm hạt để chọn. Giữ và kéo để gắp hạt: thả vào khe để đổi chỗ, kéo ra xa vòng để bỏ. Kéo chỗ trống để xoay.
  useEffect(() => {
    const s = api.current!;
    const canvas = s.renderer.domElement;
    let empty: { x: number; y: number } | null = null;

    const pick = (clientX: number, clientY: number, touch: boolean) => {
      const rect = canvas.getBoundingClientRect();
      const caster = new THREE.Raycaster();
      caster.setFromCamera(new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1), s.camera);
      const meshes = s.keys.map((key) => s.entries.get(key)?.mesh).filter((m): m is Entry["mesh"] => !!m);
      const hit = caster.intersectObjects(meshes, false)[0];
      if (hit) return hit.object.userData.key as number;
      // Hạt 6-8mm trên điện thoại chỉ to bằng nửa đầu ngón tay, nên lấy hạt gần điểm chạm nhất
      let best: number | null = null;
      let bestDist: number = touch ? PICK_SLOP.touch : PICK_SLOP.mouse;
      const p = new THREE.Vector3();
      for (const mesh of meshes) {
        p.setFromMatrixPosition(mesh.matrixWorld).project(s.camera);
        const d = Math.hypot(rect.left + ((p.x + 1) / 2) * rect.width - clientX, rect.top + ((1 - p.y) / 2) * rect.height - clientY);
        if (d < bestDist) {
          bestDist = d;
          best = mesh.userData.key as number;
        }
      }
      return best;
    };

    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      // Ngón thứ hai chạm vào thì nhường cho thao tác chụm phóng to
      if (s.ring) return;
      const key = pick(event.clientX, event.clientY, event.pointerType === "touch");
      if (key === null) {
        empty = { x: event.clientX, y: event.clientY };
        return;
      }
      s.ring = { key, from: s.keys.indexOf(key), startX: event.clientX, startY: event.clientY, moved: false, zone: { hit: null, insert: null, inside: true } };
      s.controls.enabled = false;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const move = (event: PointerEvent) => {
      const drag = s.ring;
      if (!drag) {
        if (event.pointerType === "mouse" && !event.buttons) {
          s.hoverKey = pick(event.clientX, event.clientY, false);
          canvas.style.cursor = s.hoverKey !== null ? "grab" : "";
        }
        return;
      }
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
      drag.moved = true;
      drag.zone = zone(event.clientX, event.clientY, drag.key, event.pointerType === "touch");
      callbacks.current.setRemoving(drag.zone.insert === null);
    };
    const up = (event: PointerEvent) => {
      if (empty) {
        if (Math.hypot(event.clientX - empty.x, event.clientY - empty.y) < 6) callbacks.current.onSelect(null);
        empty = null;
      }
      const drag = s.ring;
      if (!drag) return;
      s.ring = null;
      s.controls.enabled = true;
      canvas.style.cursor = "";
      callbacks.current.setRemoving(false);
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      if (!drag.moved) return callbacks.current.onSelect(drag.from);
      const at = event.type === "pointercancel" ? drag.from : drag.zone.insert;
      if (at === null) {
        // Bỏ hạt khỏi bố cục ngay để hạt mờ dần tại chỗ thả, không trượt về khe cũ
        s.keys = s.keys.filter((key) => key !== drag.key);
        return callbacks.current.onRemove(drag.from);
      }
      // Vị trí chèn tính trên vòng đã nhấc hạt ra, đổi về chỉ số trên vòng đầy đủ
      const to = at >= drag.from ? at + 1 : at;
      if (to !== drag.from && to !== drag.from + 1) callbacks.current.onMove(drag.from, to);
    };
    const leave = () => {
      if (!s.ring) {
        s.hoverKey = null;
        canvas.style.cursor = "";
      }
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("pointerleave", leave);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={host} role="img" aria-label={label} className="relative size-full touch-none [&>canvas]:size-full">
      <p
        aria-hidden={!removing}
        className={`pointer-events-none absolute top-14 left-1/2 z-10 whitespace-nowrap -translate-x-1/2 rounded-full bg-surface/90 px-3 py-1 text-sm text-err shadow-e1 transition-opacity ${
          removing ? "opacity-100 duration-(--d-base) ease-(--ease-out)" : "opacity-0 duration-(--d-fast) ease-(--ease-exit)"
        }`}
      >
        Thả ra để bỏ hạt này
      </p>
    </div>
  );
});
