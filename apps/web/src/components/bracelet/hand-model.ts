import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { buildCoil, type Coil, type Surface } from "./coil";

// Mô hình bàn tay scan, đơn vị cm, bàn tay dựng đứng ngón hướng lên trục y, cẳng tay cắt ở y = 0.
// Sau khi nạp: xoay để trục cẳng tay trùng trục y, dời tâm cổ tay về gốc toạ độ.
const BASE = "/models/ban-tay/";
const THETA_STEPS = 96;
const H_STEP = 0.1;

export type Hand = {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  // Chu vi cổ tay của mô hình (cm), để phóng mô hình cho khớp cổ tay khách
  wristCm: number;
  // Bề mặt da ở kích thước gốc
  skin(theta: number, h: number): number;
  hMin: number;
  hMax: number;
  dispose(): void;
};

type Seg = [number, number, number, number];

// Cắt lưới tam giác bằng mặt phẳng y = h, ra các đoạn thẳng trên mặt phẳng xz
function slice(pos: ArrayLike<number>, tris: number[], h: number): Seg[] {
  const segs: Seg[] = [];
  const pts: number[] = [];
  for (const t of tris) {
    pts.length = 0;
    for (let e = 0; e < 3; e++) {
      const a = t * 9 + e * 3;
      const b = t * 9 + ((e + 1) % 3) * 3;
      const ya = pos[a + 1] - h;
      const yb = pos[b + 1] - h;
      if ((ya < 0) === (yb < 0)) continue;
      const k = ya / (ya - yb);
      pts.push(pos[a] + (pos[b] - pos[a]) * k, pos[a + 2] + (pos[b + 2] - pos[a + 2]) * k);
    }
    if (pts.length === 4) segs.push([pts[0], pts[1], pts[2], pts[3]]);
  }
  return segs;
}

// Khoảng cách từ trục tới da theo hướng θ: lấy giao gần nhất với các đoạn cắt
function rayHit(segs: Seg[], theta: number) {
  const dx = Math.cos(theta);
  const dz = Math.sin(theta);
  let best = Infinity;
  for (const [x1, z1, x2, z2] of segs) {
    const ex = x2 - x1;
    const ez = z2 - z1;
    const den = dx * ez - dz * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (x1 * ez - z1 * ex) / den;
    const s = (x1 * dz - z1 * dx) / den;
    if (t > 0 && s >= 0 && s <= 1 && t < best) best = t;
  }
  return best;
}

function perimeter(radii: Float32Array) {
  let sum = 0;
  for (let i = 0; i < radii.length; i++) {
    const a = (i / radii.length) * Math.PI * 2;
    const b = ((i + 1) / radii.length) * Math.PI * 2;
    const r1 = radii[i];
    const r2 = radii[(i + 1) % radii.length];
    sum += Math.hypot(Math.cos(b) * r2 - Math.cos(a) * r1, Math.sin(b) * r2 - Math.sin(a) * r1);
  }
  return sum;
}

// Tâm lát cắt theo khung bao, đỡ lệch hơn trung bình đỉnh vì lưới scan dày mỏng không đều
function sliceCenter(pos: ArrayLike<number>, y: number, band = 0.4) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    if (Math.abs(pos[i + 1] - y) > band) continue;
    x0 = Math.min(x0, pos[i]);
    x1 = Math.max(x1, pos[i]);
    z0 = Math.min(z0, pos[i + 2]);
    z1 = Math.max(z1, pos[i + 2]);
  }
  return new THREE.Vector3((x0 + x1) / 2, y, (z0 + z1) / 2);
}

// Lưới OBJ tách rời từng tam giác nên tính pháp tuyến thẳng sẽ ra mặt phẳng lổn nhổn.
// Gộp các đỉnh trùng vị trí (kể cả ở đường nối UV), cộng pháp tuyến các mặt quanh đỉnh có trọng số
// theo diện tích, rồi chuẩn hoá: ánh sáng chuyển mượt như da thật, ảnh normal map lo phần nếp nhăn
function smoothNormals(geo: THREE.BufferGeometry) {
  const pos = geo.attributes.position.array as Float32Array;
  const sums = new Map<string, THREE.Vector3>();
  const keyOf = (i: number) => `${Math.round(pos[i * 3] * 1e4)},${Math.round(pos[i * 3 + 1] * 1e4)},${Math.round(pos[i * 3 + 2] * 1e4)}`;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const keys: string[] = [];
  for (let i = 0; i < pos.length / 3; i += 3) {
    a.fromArray(pos, i * 3);
    b.fromArray(pos, i * 3 + 3);
    c.fromArray(pos, i * 3 + 6);
    // Tích có hướng chưa chuẩn hoá: độ dài bằng hai lần diện tích tam giác
    const face = c.clone().sub(b).cross(a.clone().sub(b));
    for (let k = 0; k < 3; k++) {
      const key = keyOf(i + k);
      keys[i + k] = key;
      const sum = sums.get(key);
      if (sum) sum.add(face);
      else sums.set(key, face.clone());
    }
  }
  const normals = new Float32Array(pos.length);
  keys.forEach((key, i) => {
    const n = sums.get(key)!.clone().normalize();
    normals.set([n.x, n.y, n.z], i * 3);
  });
  geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
}

export function analyzeHand(geometry: THREE.BufferGeometry) {
  const geo = geometry.index ? geometry.toNonIndexed() : geometry;
  let pos = geo.attributes.position.array as Float32Array;

  // Trục cẳng tay qua tâm hai lát cắt: gần chỗ cắt và ngang cổ tay
  const low = sliceCenter(pos, 1);
  const high = sliceCenter(pos, 5);
  const dir = high.clone().sub(low).normalize();
  const rot = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(dir, new THREE.Vector3(0, 1, 0)));
  geo.applyMatrix4(new THREE.Matrix4().makeTranslation(-low.x, -low.y, -low.z)).applyMatrix4(rot);
  pos = geo.attributes.position.array as Float32Array;

  // Gom tam giác theo dải độ cao để cắt lát nhanh
  const triCount = pos.length / 9;
  const yMax = 12;
  const buckets: number[][] = Array.from({ length: Math.ceil(yMax / 0.5) + 1 }, () => []);
  for (let t = 0; t < triCount; t++) {
    const ys = [pos[t * 9 + 1], pos[t * 9 + 4], pos[t * 9 + 7]];
    const lo = Math.max(0, Math.floor(Math.min(...ys) / 0.5));
    const hi = Math.min(buckets.length - 1, Math.floor(Math.max(...ys) / 0.5));
    for (let b = lo; b <= hi; b++) buckets[b].push(t);
  }

  // Bảng bán kính da theo độ cao và góc, từ sát chỗ cắt tới gần lòng bàn tay
  const rows: { h: number; radii: Float32Array; perimeter: number }[] = [];
  for (let h = 0.4; h <= 9; h += H_STEP) {
    const tris = buckets[Math.min(buckets.length - 1, Math.floor(h / 0.5))];
    const segs = slice(pos, tris, h);
    const radii = new Float32Array(THETA_STEPS);
    for (let i = 0; i < THETA_STEPS; i++) radii[i] = rayHit(segs, (i / THETA_STEPS) * Math.PI * 2);
    // Hướng không trúng da (lỗ lưới) lấy theo hai bên
    for (let i = 0; i < THETA_STEPS; i++) {
      if (Number.isFinite(radii[i])) continue;
      let a = 1;
      while (a < THETA_STEPS && !Number.isFinite(radii[(i + a) % THETA_STEPS])) a++;
      radii[i] = radii[(i + a) % THETA_STEPS];
    }
    if (!radii.every(Number.isFinite)) continue;
    rows.push({ h, radii, perimeter: perimeter(radii) });
  }

  // Cổ tay là chỗ thắt nhỏ nhất trước khi loe ra bàn tay
  const wrist = rows.reduce((best, row) => (row.h > 2 && row.h < 8 && row.perimeter < best.perimeter ? row : best), rows[Math.floor(rows.length / 2)]);
  const wristH = wrist.h;
  geo.applyMatrix4(new THREE.Matrix4().makeTranslation(0, -wristH, 0));
  for (const row of rows) row.h -= wristH;

  const skin = (theta: number, h: number) => {
    const fi = (h - rows[0].h) / H_STEP;
    const i0 = THREE.MathUtils.clamp(Math.floor(fi), 0, rows.length - 1);
    const i1 = Math.min(i0 + 1, rows.length - 1);
    const fh = THREE.MathUtils.clamp(fi - i0, 0, 1);
    const ft = ((((theta / (Math.PI * 2)) % 1) + 1) % 1) * THETA_STEPS;
    const j0 = Math.floor(ft) % THETA_STEPS;
    const j1 = (j0 + 1) % THETA_STEPS;
    const fj = ft - Math.floor(ft);
    const r0 = rows[i0].radii[j0] * (1 - fj) + rows[i0].radii[j1] * fj;
    const r1 = rows[i1].radii[j0] * (1 - fj) + rows[i1].radii[j1] * fj;
    return r0 * (1 - fh) + r1 * fh;
  };

  smoothNormals(geo);
  return { geometry: geo, skin, wristCm: wrist.perimeter, hMin: rows[0].h, hMax: rows[rows.length - 1].h };
}

export async function loadHand(): Promise<Hand> {
  const tex = new THREE.TextureLoader();
  const [obj, map, normalMap, roughnessMap, aoMap] = await Promise.all([
    new OBJLoader().loadAsync(`${BASE}tay.obj`),
    tex.loadAsync(`${BASE}da.jpg`),
    tex.loadAsync(`${BASE}normal.jpg`),
    tex.loadAsync(`${BASE}do-nham.jpg`),
    tex.loadAsync(`${BASE}ao.jpg`),
  ]);
  map.colorSpace = THREE.SRGBColorSpace;
  for (const t of [map, normalMap, roughnessMap, aoMap]) t.anisotropy = 4;
  let source: THREE.BufferGeometry | null = null;
  obj.traverse((child) => {
    if (!source && (child as THREE.Mesh).isMesh) source = (child as THREE.Mesh).geometry;
  });
  if (!source) throw new Error("Mô hình tay không có lưới");
  const { geometry, skin, wristCm, hMin, hMax } = analyzeHand(source);
  // Da có tán xạ dưới bề mặt: sheen ấm ở rìa và độ nhám từ bản scan
  const material = new THREE.MeshPhysicalMaterial({
    map,
    // Ảnh scan chụp đèn mạnh nên hơi sáng; hạ một chút để da không trắng bệch dưới đèn cảnh
    color: new THREE.Color(0.7, 0.64, 0.6),
    envMapIntensity: 0.4,
    normalMap,
    roughnessMap,
    roughness: 1,
    aoMap,
    aoMapIntensity: 0.8,
    sheen: 0.12,
    sheenRoughness: 0.6,
    sheenColor: new THREE.Color(0xd9785f),
    specularIntensity: 0.4,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return {
    mesh,
    wristCm,
    skin,
    hMin,
    hMax,
    dispose() {
      geometry.dispose();
      material.dispose();
      for (const t of [map, normalMap, roughnessMap, aoMap]) t.dispose();
    },
  };
}

// Vòng đeo trên tay đứng. Trọng lực kéo chuỗi trượt xuống cẳng tay (cẳng tay loe dần) tới khi các vòng
// quấn ôm khít: tổng chu vi các vòng xếp chồng bằng chiều dài chuỗi. Vòng quá rộng thì dừng ở mép cắt
// và chùng đều; quá chật thì dây thun giãn ôm sát chỗ cổ tay nhỏ nhất.
export function wornCoil(hand: Hand, scale: number, lengthCm: number, wraps: number, beadRadius: number, phase = 0): Coil {
  const surface: Surface = { radius: (theta, h) => hand.skin(theta, h / scale) * scale };
  // Hai vòng kề nhau cách hơn một đường kính hạt để hạt không đè lên nhau
  const pitch = beadRadius * 2.2;
  const ring = (h: number) => {
    let sum = 0;
    const steps = 48;
    let px = 0, pz = 0;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const r = surface.radius(a, h) + beadRadius;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (i > 0) sum += Math.hypot(x - px, z - pz);
      px = x;
      pz = z;
    }
    return sum;
  };
  const stack = (h0: number) => {
    let sum = 0;
    for (let k = 0; k < wraps; k++) sum += ring(h0 + k * pitch);
    return sum;
  };
  const low = hand.hMin * scale + beadRadius;
  const high = Math.min(0.6 * scale, hand.hMax * scale - pitch * wraps);
  // Chỗ thắt nhất của cả chồng vòng
  let valley = high;
  let valleyLen = Infinity;
  for (let h = low; h <= high; h += 0.05) {
    const len = stack(h);
    if (len < valleyLen) {
      valleyLen = len;
      valley = h;
    }
  }
  // Từ dưới lên, chỗ đầu tiên chuỗi đủ dài để ôm là chỗ chuỗi trượt xuống tới
  let h0 = valley;
  for (let h = low; h <= valley; h += 0.02) {
    if (stack(h) <= lengthCm) {
      h0 = h;
      break;
    }
  }
  const slack = Math.max(0, lengthCm - stack(h0));
  const base = { surface, h0, pitch, wraps, beadRadius, phase };
  // Chùng chia đều thành khoảng hở quanh da. Chỉnh một lần theo độ dài thật của đường xoắn
  const first = buildCoil({ ...base, gap: slack / (Math.PI * 2 * wraps) });
  const extra = (lengthCm - first.length) / (Math.PI * 2 * wraps);
  return extra > 0.005 ? buildCoil({ ...base, gap: slack / (Math.PI * 2 * wraps) + extra }) : first;
}
