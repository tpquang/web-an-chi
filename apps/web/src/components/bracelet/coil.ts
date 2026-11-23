import * as THREE from "three";

// Đường dây xâu của vòng quấn nhiều vòng (chuỗi 108 hạt) hoặc vòng đeo trên tay.
// Đơn vị cm. Trục cổ tay là trục y, góc θ quay quanh trục y giống vòng một tầng.

export type Surface = {
  // Bán kính bề mặt mà dây ôm vào tại góc θ, độ cao h (chưa cộng bán kính hạt)
  radius(theta: number, h: number): number;
};

export type CoilSpec = {
  surface: Surface;
  // Độ cao vòng dưới cùng
  h0: number;
  // Khoảng cách theo trục giữa hai vòng quấn kề nhau
  pitch: number;
  wraps: number;
  // Bán kính hạt lớn nhất, tâm hạt cách bề mặt đúng khoảng này
  beadRadius: number;
  // Độ chùng: dây dài hơn vòng ôm khít thì hạt cách da thêm khoảng này
  gap: number;
  // Góc của điểm đầu dây (chỗ hạt chủ), để hạt chủ quay về phía người xem
  phase?: number;
};

export type Coil = {
  // Vị trí và hướng dây tại phân số chiều dài t ∈ [0, 1)
  at(t: number, pos: THREE.Vector3, tangent: THREE.Vector3): void;
  length: number;
  // Điểm mẫu để dựng ống dây
  points: THREE.Vector3[];
};

// Đoạn cuối của vòng cuối vắt chéo ra ngoài các vòng dưới để quay về điểm đầu, như chuỗi quấn thật
const CROSS = 0.22;
const SAMPLES_PER_WRAP = 360;

const smooth = (x: number) => x * x * (3 - 2 * x);

export function coilPoint(spec: CoilSpec, u: number, out: THREE.Vector3) {
  const { wraps: n, pitch, h0, beadRadius, gap, surface } = spec;
  const theta = (spec.phase ?? 0) + u * Math.PI * 2;
  let h = h0;
  let extra = gap;
  if (n > 1) {
    const rise = n - CROSS;
    if (u < rise) h = h0 + (pitch * (n - 1) * u) / rise;
    else {
      const s = (u - rise) / CROSS;
      h = h0 + pitch * (n - 1) * (1 - smooth(s));
      // Đè lên các vòng bên dưới nên đẩy ra ngoài khoảng một hạt
      extra += beadRadius * 2.2 * Math.max(0, Math.sin(Math.PI * s)) ** 0.6;
    }
  }
  const r = surface.radius(theta, h) + beadRadius + extra;
  return out.set(Math.cos(theta) * r, h, Math.sin(theta) * r);
}

export function buildCoil(spec: CoilSpec): Coil {
  const count = Math.max(spec.wraps, 1) * SAMPLES_PER_WRAP;
  const pts: THREE.Vector3[] = [];
  const cum = new Float64Array(count + 1);
  for (let i = 0; i <= count; i++) {
    pts.push(coilPoint(spec, (i / count) * spec.wraps, new THREE.Vector3()));
    if (i > 0) cum[i] = cum[i - 1] + pts[i].distanceTo(pts[i - 1]);
  }
  const length = cum[count];
  const at = (t: number, pos: THREE.Vector3, tangent: THREE.Vector3) => {
    const target = (((t % 1) + 1) % 1) * length;
    let lo = 0;
    let hi = count;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= target) lo = mid;
      else hi = mid;
    }
    const seg = cum[hi] - cum[lo] || 1;
    pos.lerpVectors(pts[lo], pts[hi], (target - cum[lo]) / seg);
    tangent.subVectors(pts[hi], pts[lo]).normalize();
  };
  const step = Math.max(1, Math.floor(count / (120 * Math.max(spec.wraps, 1))));
  return { at, length, points: pts.filter((_, i) => i % step === 0 && i < count) };
}

// Vòng nổi giữa khung khi thiết kế: bề mặt là hình trụ, các vòng quấn xếp đều quanh y = 0
export function floatingCoil(lengthCm: number, wraps: number, beadRadius: number, phase = 0): Coil {
  // Hai vòng kề nhau cách hơn một đường kính hạt để hạt không đè lên nhau
  const pitch = beadRadius * 2.2;
  const make = (center: number) =>
    buildCoil({ surface: { radius: () => Math.max(center - beadRadius, 0.3) }, h0: (-pitch * (wraps - 1)) / 2, pitch, wraps, beadRadius, gap: 0, phase });
  // Đường xoắn và đoạn vắt chéo dài hơn vòng tròn phẳng, chỉnh bán kính một lần để dây đúng chiều dài chuỗi
  const guess = lengthCm / (Math.PI * 2 * wraps);
  const first = make(guess);
  return make(guess * (lengthCm / first.length));
}
