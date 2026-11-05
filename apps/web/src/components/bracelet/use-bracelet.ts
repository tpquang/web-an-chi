"use client";

import { useMemo, useState } from "react";
import type { Bead, BraceletRules } from "@/lib/api";
import { cm } from "@/lib/bracelet";
import { cart } from "@/lib/cart";
import { cartHref } from "@/lib/links";
import { showToast } from "../ui/toast";
import type { SceneItem } from "./bracelet-scene";

// Vòng vừa khi chiều dài lệch không quá khoảng này so với cỡ cần
const FIT_TOLERANCE_MM = 5;
// Số bước hoàn tác giữ lại
const HISTORY = 50;

// Mỗi hạt trên vòng có key riêng để cảnh 3D biết hạt nào trượt đi đâu
type RingItem = { key: number; slug: string };
let nextKey = 0;
const ringItem = (slug: string): RingItem => ({ key: ++nextKey, slug });

export function useBracelet(rules: BraceletRules, beads: Bead[]) {
  const bySlug = useMemo(() => new Map(beads.map((bead) => [bead.slug, bead])), [beads]);
  const firstBead = beads.find((bead) => bead.kind === "BEAD" && bead.sizeMm === 8 && bead.stock > 0) ?? beads.find((bead) => bead.kind === "BEAD");
  const startWristCm = 15;
  const startFit = rules.fits[1] ?? rules.fits[0];
  // Vòng mẫu khi mới vào: hạt trầm 8 mm vừa cỡ tay mặc định
  const initialRing = () =>
    firstBead ? Array.from({ length: Math.round(((startWristCm + startFit.easeCm) * 10) / firstBead.sizeMm) }, () => ringItem(firstBead.slug)) : [];

  const [ring, setRingState] = useState<RingItem[]>(initialRing);
  const [history, setHistory] = useState<RingItem[][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [wristCm, setWristCmState] = useState(startWristCm);
  const [fit, setFitState] = useState(startFit.id);
  const [cord, setCord] = useState(rules.cords[0].id);

  // Mọi thay đổi vòng đi qua đây để hoàn tác được
  function setRing(next: RingItem[]) {
    setHistory((h) => [...h.slice(-HISTORY + 1), ring]);
    setRingState(next);
  }

  const sceneItems = useMemo<SceneItem[]>(
    () => ring.flatMap(({ key, slug }) => (bySlug.has(slug) ? [{ key, bead: bySlug.get(slug)! }] : [])),
    [ring, bySlug],
  );
  const ringBeads = useMemo(() => sceneItems.map((item) => item.bead), [sceneItems]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const { slug } of ring) map.set(slug, (map.get(slug) ?? 0) + 1);
    return map;
  }, [ring]);

  const lengthMm = ringBeads.reduce((sum, bead) => sum + bead.sizeMm, 0);
  const easeCm = rules.fits.find((f) => f.id === fit)?.easeCm ?? 1;
  const targetMm = Math.round((wristCm + easeCm) * 10);
  const diff = lengthMm - targetMm;
  // Hạt chính là hạt trầm dùng nhiều nhất, để tự lấp đầy và ước số hạt
  const mainBead = ringBeads.filter((bead) => bead.kind === "BEAD").sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0))[0] ?? firstBead;

  const beadsVnd = ringBeads.reduce((sum, bead) => sum + bead.priceVnd, 0);
  const totalVnd = beadsVnd + rules.feeVnd;

  const outOfStock = [...counts].find(([slug, count]) => (bySlug.get(slug)?.stock ?? 0) < count);
  const problem =
    ring.length < rules.minBeads ? `Vòng cần ít nhất ${rules.minBeads} hạt.`
    : lengthMm > rules.maxLengthMm ? `Vòng dài tối đa ${cm(rules.maxLengthMm)} cm. Bạn bớt hạt hoặc chọn hạt nhỏ hơn.`
    : diff < -FIT_TOLERANCE_MM ? `Còn thiếu ${cm(-diff)} cm để vừa cổ tay ${wristCm.toLocaleString("vi-VN")} cm.`
    : diff > FIT_TOLERANCE_MM ? `Vòng đang dư ${cm(diff)} cm. Bạn bớt hạt hoặc đổi kiểu đeo.`
    : outOfStock ? `Shop chỉ còn ${bySlug.get(outOfStock[0])?.stock} hạt ${bySlug.get(outOfStock[0])?.name}.`
    : null;

  // Dòng tóm tắt: gộp hạt trùng loại, giữ thứ tự xuất hiện trên vòng
  const lines = [...counts].flatMap(([slug, count]) => {
    const bead = bySlug.get(slug);
    return bead ? [{ bead, count, vnd: bead.priceVnd * count }] : [];
  });

  function insert(slug: string, at?: number) {
    if (ring.length >= rules.maxBeads) {
      showToast({ type: "error", title: "Đã đủ số hạt tối đa", desc: `Một vòng có tối đa ${rules.maxBeads} hạt.` });
      return;
    }
    const index = at ?? (selected !== null ? selected + 1 : ring.length);
    setRing([...ring.slice(0, index), ringItem(slug), ...ring.slice(index)]);
    setSelected(index);
  }

  function move(from: number, to: number) {
    const next = [...ring];
    const [item] = next.splice(from, 1);
    const at = to > from ? to - 1 : to;
    next.splice(at, 0, item);
    setRing(next);
    setSelected(at);
  }

  function removeAt(index: number) {
    setRing(ring.filter((_, i) => i !== index));
    setSelected(ring.length > 1 ? Math.min(index, ring.length - 2) : null);
  }

  // Lấp đầy bằng hạt chính cho tới khi vừa cỡ tay, giữ nguyên các charm đã đặt
  function autoFill(target = targetMm) {
    if (!mainBead) return;
    const next = [...ring];
    let length = lengthMm;
    while (length + mainBead.sizeMm / 2 < target && next.length < rules.maxBeads) {
      next.push(ringItem(mainBead.slug));
      length += mainBead.sizeMm;
    }
    while (length - mainBead.sizeMm / 2 > target) {
      const index = next.findLastIndex((item) => item.slug === mainBead.slug);
      if (index === -1) break;
      next.splice(index, 1);
      length -= mainBead.sizeMm;
    }
    if (next.length !== ring.length) setRing(next);
  }

  // Đổi toàn bộ hạt trầm trên vòng sang loại khác, charm giữ nguyên chỗ. Số hạt tính lại cho vừa tay
  function swapMain(slug: string) {
    const bead = bySlug.get(slug);
    if (!bead) return;
    const kept = ring.filter((item) => bySlug.get(item.slug)?.kind !== "BEAD");
    const keptMm = kept.reduce((sum, item) => sum + (bySlug.get(item.slug)?.sizeMm ?? 0), 0);
    const count = Math.max(1, Math.round((targetMm - keptMm) / bead.sizeMm));
    // Charm rải đều giữa các hạt trầm như vị trí cũ
    const next: RingItem[] = Array.from({ length: count }, () => ringItem(slug));
    ring.forEach((item, i) => {
      if (bySlug.get(item.slug)?.kind === "BEAD") return;
      next.splice(Math.round((i / Math.max(ring.length, 1)) * next.length), 0, item);
    });
    setRing(next.slice(0, rules.maxBeads));
    setSelected(null);
  }

  // Đổi cỡ tay thì thêm bớt hạt chính cho vừa luôn, khách không phải tự đếm
  function setWristCm(value: number) {
    const wrist = Math.min(rules.wristCm.max, Math.max(rules.wristCm.min, Math.round(value * 2) / 2));
    setWristCmState(wrist);
    autoFill(Math.round((wrist + easeCm) * 10));
  }

  function setFit(id: string) {
    setFitState(id);
    autoFill(Math.round((wristCm + (rules.fits.find((f) => f.id === id)?.easeCm ?? easeCm)) * 10));
  }

  function undo() {
    const last = history.at(-1);
    if (!last) return;
    setHistory(history.slice(0, -1));
    setRingState(last);
    setSelected(null);
  }

  function reset() {
    setRing(initialRing());
    setSelected(null);
  }

  function addToCart() {
    if (problem) {
      showToast({ type: "error", title: "Vòng chưa đặt được", desc: problem });
      return;
    }
    cart.addBracelet({
      beads: ring.map((item) => item.slug),
      cord,
      fit,
      wristCm,
    });
    showToast({ title: "Đã thêm vòng vào giỏ", desc: "Bạn có thể đặt hàng hoặc thiết kế thêm vòng khác.", action: { href: cartHref, label: "Xem giỏ hàng" } });
  }

  return {
    rules, beads, ring, sceneItems, ringBeads, counts, lines, selected, setSelected,
    wristCm, setWristCm, fit, setFit, cord, setCord,
    lengthMm, targetMm, easeCm, mainBead, totalVnd, problem, canUndo: history.length > 0,
    insert, move, removeAt, autoFill, swapMain, undo, reset, addToCart,
  };
}

export type BraceletState = ReturnType<typeof useBracelet>;
