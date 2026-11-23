import * as THREE from "three";

// Phần trang trí của chuỗi 108 hạt: hạt chủ (hạt lớn nối hai đầu chuỗi), nút chặn dáng nút chai bên dưới,
// rồi hai dây tua mỗi dây 3 hạt, cuối dây là nút thắt. Đơn vị cm, trục y hướng lên.

// Hạt chủ to hơn hạt chuỗi khoảng chừng này lần
export const GURU_SCALE = 1.7;
// Đoạn dây trống từ nút chặn tới hạt tua đầu tiên
const DROP = 0.9;
const TUBE_RADIUS = 0.03;

export type Push = (p: THREE.Vector3, radius: number) => void;

export type Tassel = {
  group: THREE.Group;
  slug: string;
  // at: tâm hạt chủ nằm trên đường dây chuỗi; tangent: hướng dây tại đó.
  // push: đẩy một điểm ra khỏi da khi đeo trên tay (không đeo thì để nguyên)
  place(at: THREE.Vector3, tangent: THREE.Vector3, push: Push): void;
  // Mô phỏng dây tua một bước. turn: góc camera vừa xoay, coi như vòng bị xoay ngược lại (pivot để dành, dây xoay quanh điểm treo)
  // nên dây tua bị trễ, văng theo quán tính rồi đung đưa về thẳng đứng
  step(dt: number, turn: THREE.Quaternion | null, pivot: THREE.Vector3): void;
  dispose(): void;
};

// Nút chai: thân hơi thon xuống dưới, hai mép bo tròn
function corkGeometry(top: number, bottom: number, height: number) {
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
  const bevel = Math.min(top, height) * 0.25;
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(top - bevel + Math.sin(a) * bevel, -bevel + Math.cos(a) * bevel));
  }
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(bottom - bevel + Math.cos(a) * bevel, -height + bevel - Math.sin(a) * bevel));
  }
  pts.push(new THREE.Vector2(0, -height));
  return new THREE.LatheGeometry(pts, 40);
}

// Nút thắt cuối dây tua: các vòng dây cuộn chồng nên mặt ngoài gợn sóng
function knotGeometry(radius: number, height: number) {
  const pts: THREE.Vector2[] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const envelope = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.5;
    const ridge = 1 - 0.12 * Math.abs(Math.sin(t * Math.PI * 5));
    pts.push(new THREE.Vector2(Math.max(0.001, radius * envelope * ridge * (1 - 0.25 * t)), -t * height));
  }
  return new THREE.LatheGeometry(pts, 24);
}

export function buildTassel(slug: string, beadMm: number, wood: THREE.Material, cordColor: string): Tassel {
  const d = beadMm * 0.1;
  const guruD = d * GURU_SCALE;
  const corkH = guruD * 0.55;
  const group = new THREE.Group();
  const cordMat = new THREE.MeshStandardMaterial({ color: cordColor, roughness: 0.85 });

  const shadow = <T extends THREE.Mesh>(m: T) => {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  // Hạt chủ: lỗ xâu theo trục z để quay theo hướng dây chuỗi
  const guru = shadow(new THREE.Mesh(new THREE.SphereGeometry(guruD / 2, 48, 32).rotateX(Math.PI / 2), wood));
  const cork = shadow(new THREE.Mesh(corkGeometry(guruD * 0.3, guruD * 0.24, corkH), wood));
  const beadGeo = new THREE.SphereGeometry(d / 2, 32, 24);
  const beads = Array.from({ length: 6 }, () => shadow(new THREE.Mesh(beadGeo, wood)));
  const knotGeo = knotGeometry(d * 0.36, d * 1.3);
  const knots = [0, 1].map(() => shadow(new THREE.Mesh(knotGeo, cordMat)));
  const cords = [0, 1].map(() => shadow(new THREE.Mesh(new THREE.BufferGeometry(), cordMat)));

  const down = new THREE.Vector3(0, -1, 0);
  const Z = new THREE.Vector3(0, 0, 1);
  const Y = new THREE.Vector3(0, 1, 0);

  // Dây tua là chuỗi điểm nối bằng đoạn cố định độ dài (tích phân Verlet). Điểm đầu gắn vào đáy nút chặn
  const SEG = 0.12;
  const beadS = (k: number) => DROP + d / 2 + k * d * 1.02;
  const knotS = beadS(2) + d / 2 + 0.05;
  const count = Math.ceil(knotS / SEG) + 1;
  const beadIdx = [0, 1, 2].map((k) => Math.round(beadS(k) / SEG));
  const knotIdx = count - 1;
  // Khoảng cách giữa hai dây ở mỗi điểm: tách dần ra từ nút chặn rồi giữ hơn một hạt
  const apart = Array.from({ length: count }, (_, i) => Math.min((i * SEG) / 0.7, 1) * d * 1.24);
  const strands = [0, 1].map(() => ({
    pos: Array.from({ length: count }, () => new THREE.Vector3()),
    prev: Array.from({ length: count }, () => new THREE.Vector3()),
  }));
  const anchor = new THREE.Vector3();
  const side = new THREE.Vector3(1, 0, 0);
  let push: Push = () => {};
  let ready = false;

  function rest() {
    strands.forEach((strand, i) => {
      const sign = i ? 1 : -1;
      strand.pos.forEach((p, k) => {
        p.copy(anchor).addScaledVector(down, k * SEG).addScaledVector(side, (sign * apart[k]) / 2);
        strand.prev[k].copy(p);
      });
    });
    ready = true;
  }

  function place(at: THREE.Vector3, tangent: THREE.Vector3, pushFn: Push) {
    push = pushFn;
    // Hạt chủ to hơn nên nhô ra ngoài, mặt trong vẫn nằm cùng mặt với các hạt chuỗi
    const outward = new THREE.Vector3(at.x, 0, at.z).normalize();
    const center = at.clone().addScaledVector(outward, (guruD - d) / 2);
    guru.position.copy(center);
    guru.quaternion.setFromUnitVectors(Z, tangent);

    // Lỗ thứ ba của hạt chủ quay xuống: nút chặn treo thẳng dưới hạt chủ
    const corkTop = center.clone().addScaledVector(down, guruD * 0.46);
    push(corkTop, guruD * 0.3);
    cork.position.copy(corkTop);
    const next = corkTop.clone().addScaledVector(down, corkH);
    side.set(tangent.x, 0, tangent.z).normalize();
    // Đổi chỗ xa (bật tắt đeo thử) thì đặt lại dây cho khỏi văng; dịch nhẹ thì để dây tự đung đưa theo
    const jump = anchor.distanceTo(next) > 1.5;
    anchor.copy(next);
    if (!ready || jump) rest();
    step(0, null, anchor);
  }

  const GRAVITY = 981;
  const DAMP = 0.93; // phần vận tốc mất đi mỗi giây vì ma sát không khí và dây: dừng sau vài nhịp lắc
  const SWING = 0.35;
  const MAX_KICK = 0.04;
  const soft = new THREE.Quaternion();
  const SUB = 1 / 120;
  let carry = 0;
  const tmp = new THREE.Vector3();
  const dir = new THREE.Vector3();

  function step(dt: number, turn: THREE.Quaternion | null, pivot: THREE.Vector3) {
    if (!ready) return;
    // Camera xoay một góc thì trong khung của vòng, dây tua (vốn đứng yên) bị kéo lệch đúng góc ấy quanh tâm xoay
    // Chỉ lấy một phần góc xoay, quanh điểm treo: dây đung đưa nhẹ chứ không văng
    if (turn) {
      soft.identity().slerp(turn, SWING);
      for (const strand of strands)
        for (let k = 1; k < count; k++) {
          tmp.copy(strand.pos[k]);
          strand.pos[k].sub(anchor).applyQuaternion(soft).add(anchor);
          // Giới hạn mỗi khung hình dịch tối đa chừng này, kéo camera thật nhanh cũng không hất tung dây
          dir.subVectors(strand.pos[k], tmp);
          if (dir.length() > MAX_KICK) strand.pos[k].copy(tmp).addScaledVector(dir.normalize(), MAX_KICK);
        }
    }
    carry = Math.min(carry + dt, 0.1);
    const keep = Math.pow(1 - DAMP, SUB);
    while (carry >= SUB) {
      carry -= SUB;
      for (const strand of strands) {
        for (let k = 1; k < count; k++) {
          const p = strand.pos[k];
          tmp.copy(p).sub(strand.prev[k]).multiplyScalar(keep);
          strand.prev[k].copy(p);
          p.add(tmp).addScaledVector(down, GRAVITY * SUB * SUB);
        }
      }
      for (let it = 0; it < 10; it++) {
        for (const strand of strands) {
          strand.pos[0].copy(anchor);
          for (let k = 0; k < count - 1; k++) {
            const a = strand.pos[k];
            const b = strand.pos[k + 1];
            dir.subVectors(b, a);
            const len = dir.length() || 1e-6;
            const fix = (len - SEG) / len;
            if (k === 0) b.addScaledVector(dir, -fix);
            else {
              a.addScaledVector(dir, fix / 2);
              b.addScaledVector(dir, -fix / 2);
            }
          }
        }
        // Hai dây không lồng vào nhau: điểm cùng độ dài trên hai dây giữ đủ xa
        for (let k = 1; k < count; k++) {
          const a = strands[0].pos[k];
          const b = strands[1].pos[k];
          dir.subVectors(b, a);
          const len = dir.length();
          if (len < apart[k]) {
            if (len < 1e-5) dir.copy(side);
            else dir.divideScalar(len);
            const fix = (apart[k] - len) / 2;
            a.addScaledVector(dir, -fix);
            b.addScaledVector(dir, fix);
          }
        }
        // Gặp da thì nằm áp lên da
        for (const strand of strands)
          for (let k = 1; k < count; k++) push(strand.pos[k], beadIdx.includes(k) ? d / 2 : k === knotIdx ? d * 0.36 : TUBE_RADIUS);
      }
      // Dây không giãn: đi từ điểm treo xuống, đoạn nào dài quá thì kéo điểm dưới lại đúng độ dài
      for (const strand of strands) {
        for (let k = 1; k < count; k++) {
          dir.subVectors(strand.pos[k], strand.pos[k - 1]);
          const len = dir.length();
          if (len > SEG) {
            const fixed = tmp.copy(strand.pos[k - 1]).addScaledVector(dir, SEG / len);
            // Phần bị kéo lại cũng bỏ khỏi vận tốc, không thì dây bật ngược như lò xo
            strand.prev[k].add(fixed).sub(strand.pos[k]);
            strand.pos[k].copy(fixed);
          }
        }
      }
    }
    draw();
  }

  // Hướng dây tại điểm k, để lỗ hạt và nút thắt xuôi theo dây
  const along = (pts: THREE.Vector3[], k: number) =>
    dir.subVectors(pts[Math.min(k + 1, count - 1)], pts[Math.max(k - 1, 0)]).normalize();

  function draw() {
    strands.forEach((strand, i) => {
      beadIdx.forEach((k, j) => {
        const m = beads[i * 3 + j];
        m.position.copy(strand.pos[k]);
        m.quaternion.setFromUnitVectors(Y, along(strand.pos, k));
      });
      knots[i].position.copy(strand.pos[knotIdx]);
      // Nút thắt dựng từ gốc xuống dưới theo trục -y: xoay -y về hướng dây đi xuống
      knots[i].quaternion.setFromUnitVectors(down, dir.subVectors(strand.pos[knotIdx], strand.pos[knotIdx - 1]).normalize());
      cords[i].geometry.dispose();
      cords[i].geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([cork.position.clone().addScaledVector(down, corkH * 0.5), ...strand.pos]), count * 2, TUBE_RADIUS, 6, false);
    });
  }

  return {
    group,
    slug,
    place,
    step,
    dispose() {
      group.removeFromParent();
      for (const m of [guru, cork, ...cords]) m.geometry.dispose();
      beadGeo.dispose();
      knotGeo.dispose();
      cordMat.dispose();
    },
  };
}
