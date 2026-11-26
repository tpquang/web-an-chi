"use client";

import { useEffect, useMemo, useState } from "react";
import type { Bead, BraceletRules } from "@/lib/api";
import { cm } from "@/lib/bracelet";
import { BRACELET_EDIT_PARAM as EDIT_PARAM } from "@/lib/links";
import { type BraceletDesign, type BraceletGift, cart, readCart } from "@/lib/cart";
import { openCartDrawer } from "@/lib/cart-drawer";
import { showToast } from "../ui/toast";
import type { SceneItem } from "./bracelet-scene";

// Vòng vừa khi chiều dài lệch không quá khoảng này so với cỡ cần
const FIT_TOLERANCE_MM = 5;
// Chuỗi quấn được coi là đúng số vòng khi lệch không quá chừng này vòng: dây thun giãn hoặc chùng bù phần lẻ
const WRAP_TOLERANCE = 0.4;
// Số bước hoàn tác giữ lại
const HISTORY = 50;
// Bản nháp vòng đang thiết kế, tải lại trang hay quay lại sau vẫn còn
const DRAFT_KEY = "anchi-bracelet-draft";
type Draft = Omit<BraceletDesign, "accent"> & { accent: boolean; editing?: string | null };


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
  const [history, setHistory] = useState<{ ring: RingItem[]; wraps: number }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [wristCm, setWristCmState] = useState(startWristCm);
  const [fit, setFitState] = useState(startFit.id);
  const [cord, setCord] = useState(rules.cords[0].id);
  // 1 là vòng một tầng; 3 hoặc 4 là chuỗi 108 hạt quấn quanh cổ tay
  const [wraps, setWrapsState] = useState(1);
  // Chuỗi có hạt chủ và hai dây tua, khách tự tick
  const [accent, setAccent] = useState(true);
  // Ghi chú cho shop: quà tặng và yêu cầu khác
  const [gift, setGift] = useState<BraceletGift>({});
  const [note, setNote] = useState("");
  const mala = wraps > 1;
  // Mã vòng trong giỏ đang được sửa; lưu thì thay vòng đó thay vì thêm vòng mới
  const [editing, setEditing] = useState<string | null>(null);
  // Đã nạp bản nháp hoặc vòng cần sửa: bỏ qua form khởi tạo
  const [restored, setRestored] = useState(false);
  const [ready, setReady] = useState(false);

  function load(d: Draft | BraceletDesign) {
    const slugs = d.beads.filter((slug) => bySlug.has(slug));
    if (!slugs.length) return false;
    setRingState(slugs.map(ringItem));
    setHistory([]);
    setSelected(null);
    setWrapsState(d.wraps && d.wraps > 1 ? d.wraps : 1);
    setAccent(d.accent ?? false);
    if (d.wristCm >= rules.wristCm.min && d.wristCm <= rules.wristCm.max) setWristCmState(d.wristCm);
    if (rules.fits.some((f) => f.id === d.fit)) setFitState(d.fit);
    if (rules.cords.some((c) => c.id === d.cord)) setCord(d.cord);
    setGift(d.gift ?? {});
    setNote(d.note ?? "");
    return true;
  }

  // Lần đầu: ưu tiên vòng cần sửa trên URL, sau đó tới bản nháp. Chạy sau khi có trình duyệt để HTML khớp server
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get(EDIT_PARAM);
    const item = code ? readCart().find((i) => i.slug === code && i.design) : undefined;
    if (item?.design && load(item.design)) {
      setEditing(item.slug);
      setRestored(true);
    } else {
      try {
        const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as Draft | null;
        if (draft && Array.isArray(draft.beads) && load(draft)) {
          // Vòng đang sửa đã bị xoá khỏi giỏ thì bản nháp thành vòng mới
          const still = draft.editing && readCart().some((i) => i.slug === draft.editing);
          setEditing(still ? draft.editing! : null);
          setRestored(true);
        }
      } catch {}
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mỗi thay đổi ghi lại bản nháp
  useEffect(() => {
    if (!ready) return;
    const draft: Draft = { beads: ring.map((i) => i.slug), cord, fit, wristCm, wraps, accent, gift, note, editing };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [ready, ring, cord, fit, wristCm, wraps, accent, gift, note, editing]);

  // Mọi thay đổi vòng đi qua đây để hoàn tác được
  function setRing(next: RingItem[]) {
    setHistory((h) => [...h.slice(-HISTORY + 1), { ring, wraps }]);
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
  const beadCount = ringBeads.filter((bead) => bead.kind === "BEAD").length;
  const charmCount = ring.length - beadCount;
  // Số vòng chuỗi quấn được trên cổ tay này
  const turns = lengthMm / Math.max(targetMm, 1);
  // Trần chung rules.maxBeads (200) hạt và charm; ngoài ra khách xâu dài ngắn tuỳ ý
  const maxItems = rules.maxBeads;
  // Hạt chính là hạt trầm dùng nhiều nhất, để tự lấp đầy và ước số hạt
  const mainBead = ringBeads.filter((bead) => bead.kind === "BEAD").sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0))[0] ?? firstBead;

  // Hạt chủ và tua: thêm chừng này hạt cùng loại hạt chính
  const accentCount = mala && accent && mainBead ? rules.mala.accentBeads : 0;
  const accentVnd = accentCount * (mainBead?.priceVnd ?? 0);
  const beadsVnd = ringBeads.reduce((sum, bead) => sum + bead.priceVnd, 0) + accentVnd;
  const totalVnd = beadsVnd + rules.feeVnd;

  const stockNeed = new Map(counts);
  if (accentCount && mainBead) stockNeed.set(mainBead.slug, (stockNeed.get(mainBead.slug) ?? 0) + accentCount);
  const outOfStock = [...stockNeed].find(([slug, count]) => (bySlug.get(slug)?.stock ?? 0) < count);
  // Gợi ý cho vừa tay: chỉ để khách tham khảo, không chặn lưu vòng
  const malaHint = () => {
    if (beadCount !== rules.mala.beads) return `Chuỗi cần đúng ${rules.mala.beads} hạt trầm, đang có ${beadCount} hạt.`;
    if (charmCount > rules.mala.maxCharms) return `Chuỗi gắn tối đa ${rules.mala.maxCharms} charm.`;
    if (Math.abs(turns - wraps) <= WRAP_TOLERANCE) return null;
    const best = mainBead && malaBead(wraps, targetMm, mainBead);
    const hint = best && best.sizeMm !== mainBead?.sizeMm ? `Chọn hạt ${best.sizeMm} mm để quấn ${wraps} vòng.` : "Chuỗi này chưa hợp cỡ tay, bạn đổi cỡ hạt hoặc chọn vòng đơn.";
    return `Hạt ${mainBead?.sizeMm} mm quấn được khoảng ${turns.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} vòng trên cổ tay ${wristCm.toLocaleString("vi-VN")} cm. ${hint}`;
  };
  const hint = mala
    ? malaHint()
    : diff < -FIT_TOLERANCE_MM ? `Còn thiếu ${cm(-diff)} cm để vừa cổ tay ${wristCm.toLocaleString("vi-VN")} cm.`
    : diff > FIT_TOLERANCE_MM ? `Vòng dư ${cm(diff)} cm so với cổ tay, vẫn đặt được nếu bạn muốn đeo rộng hoặc quấn thêm.`
    : null;
  // Chỉ chặn lưu khi vòng trống hoặc shop thiếu hạt
  const problem = ring.length === 0 ? "Vòng chưa có hạt nào." : outOfStockProblem();
  function outOfStockProblem() {
    return outOfStock ? `Shop chỉ còn ${bySlug.get(outOfStock[0])?.stock} hạt ${bySlug.get(outOfStock[0])?.name}.` : null;
  }

  // Hạt cùng loại trầm có cỡ quấn gần đúng số vòng nhất. Ưu tiên hạt còn hàng, rồi hạt cùng phân loại
  function malaBead(n: number, target: number, current: Bead) {
    const grade = current.slug.replace(/^.*?\d+mm/, "");
    const keptMm = ring.reduce((sum, item) => sum + (bySlug.get(item.slug)?.kind === "BEAD" ? 0 : (bySlug.get(item.slug)?.sizeMm ?? 0)), 0);
    const score = (bead: Bead) => Math.abs((rules.mala.beads * bead.sizeMm + keptMm) / target - n);
    return beads
      .filter((bead) => bead.kind === "BEAD" && bead.material === current.material)
      .sort((a, b) => score(a) - score(b) || Number(b.stock > 0) - Number(a.stock > 0) || Number(b.slug.endsWith(grade)) - Number(a.slug.endsWith(grade)))[0];
  }

  // Dòng tóm tắt: gộp hạt trùng loại, giữ thứ tự xuất hiện trên vòng
  const lines = [...counts].flatMap(([slug, count]) => {
    const bead = bySlug.get(slug);
    return bead ? [{ bead, count, vnd: bead.priceVnd * count }] : [];
  });

  function insert(slug: string, at?: number) {
    if (ring.length >= maxItems) {
      showToast({ type: "error", title: "Đã đủ số hạt tối đa", desc: `Một vòng có tối đa ${rules.maxBeads} hạt và charm.` });
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
    // Chuỗi giữ đủ 108 hạt; cổ tay đổi thì đổi cỡ hạt cho vừa số vòng quấn
    if (mala) {
      const best = malaBead(wraps, target, mainBead);
      if (best && best.slug !== mainBead.slug) rebuild(best.slug, wraps, target);
      else if (beadCount !== rules.mala.beads) rebuild(mainBead.slug, wraps, target);
      return;
    }
    const next = [...ring];
    let length = lengthMm;
    while (length + mainBead.sizeMm / 2 < target && next.length < maxItems) {
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
    rebuild(slug, wraps, targetMm);
  }

  // Dựng lại vòng toàn hạt này: một tầng thì đủ dài theo cổ tay, chuỗi thì đủ 108 hạt
  function rebuild(slug: string, n: number, target: number) {
    const bead = bySlug.get(slug);
    if (!bead) return;
    const kept = ring.filter((item) => bySlug.get(item.slug)?.kind !== "BEAD");
    const keptMm = kept.reduce((sum, item) => sum + (bySlug.get(item.slug)?.sizeMm ?? 0), 0);
    const count = n > 1 ? rules.mala.beads : Math.max(1, Math.round((target - keptMm) / bead.sizeMm));
    // Charm rải đều giữa các hạt trầm như vị trí cũ
    const next: RingItem[] = Array.from({ length: count }, () => ringItem(slug));
    ring.forEach((item, i) => {
      if (bySlug.get(item.slug)?.kind === "BEAD") return;
      next.splice(Math.round((i / Math.max(ring.length, 1)) * next.length), 0, item);
    });
    setRing(next.slice(0, n > 1 ? Math.min(rules.maxBeads, rules.mala.beads + rules.mala.maxCharms) : rules.maxBeads));
    setSelected(null);
  }

  // Form khởi tạo: dựng vòng mới toàn hạt đã chọn theo loại vòng và cỡ tay. Vẫn đi qua setRing để hoàn tác được
  function setup({ wraps: n, slug, wrist, fitId }: BraceletSetupValues) {
    const bead = bySlug.get(slug);
    if (!bead) return;
    const ease = rules.fits.find((f) => f.id === fitId)?.easeCm ?? easeCm;
    const target = Math.round((wrist + ease) * 10);
    const count = n > 1 ? rules.mala.beads : Math.min(rules.maxBeads, Math.max(rules.minBeads, Math.round(target / bead.sizeMm)));
    setWrapsState(n);
    setWristCmState(wrist);
    setFitState(fitId);
    setRing(Array.from({ length: count }, () => ringItem(slug)));
    setSelected(null);
  }

  function setWraps(n: number) {
    if (!mainBead || n === wraps) return;
    setWrapsState(n);
    rebuild(n > 1 ? (malaBead(n, targetMm, mainBead)?.slug ?? mainBead.slug) : mainBead.slug, n, targetMm);
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
    setRingState(last.ring);
    setWrapsState(last.wraps);
    setSelected(null);
  }

  function reset() {
    setWrapsState(1);
    setRing(initialRing());
    setSelected(null);
  }

  // Chỉ gửi phần quà tặng khách đã chọn; thiệp không có lời nhắn vẫn tính là có thiệp
  const card = gift.card === undefined ? undefined : gift.card.trim();
  const giftValue = gift.box || gift.wrap || card !== undefined ? { ...(gift.box ? { box: true } : {}), ...(gift.wrap ? { wrap: true } : {}), ...(card !== undefined ? { card } : {}) } : null;

  // Lưu vòng vào giỏ rồi mở bảng giỏ hàng bên phải để khách thấy ngay. Vòng chưa hợp lệ thì báo lý do
  // Thiết kế gửi đi (giỏ hàng hoặc đặt chờ). Vòng chưa hợp lệ thì báo lý do và trả null
  function design(title: string): BraceletDesign | null {
    if (problem) {
      showToast({ type: "error", title, desc: problem });
      return null;
    }
    return {
      beads: ring.map((item) => item.slug),
      cord,
      fit,
      wristCm,
      ...(mala ? { wraps, ...(accent ? { accent } : {}) } : {}),
      ...(giftValue ? { gift: giftValue } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
  }

  function addToCart() {
    const value = design("Vòng chưa lưu được");
    if (!value) return;
    if (editing) {
      cart.replaceBracelet(editing, value);
      showToast({ type: "success", title: "Đã cập nhật vòng trong giỏ" });
      setEditing(null);
      dropEditParam();
    } else cart.addBracelet(value);
    openCartDrawer();
  }

  // Thôi sửa: vòng trong giỏ giữ nguyên, thiết kế đang mở thành vòng mới
  function stopEditing() {
    setEditing(null);
    dropEditParam();
  }

  function dropEditParam() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(EDIT_PARAM)) return;
    url.searchParams.delete(EDIT_PARAM);
    window.history.replaceState(window.history.state, "", url);
  }

  return {
    rules, beads, ring, sceneItems, ringBeads, counts, lines, selected, setSelected,
    wristCm, setWristCm, fit, setFit, cord, setCord, wraps, setWraps, turns, accent: mala && accent, setAccent, accentCount, accentVnd,
    lengthMm, targetMm, easeCm, mainBead, totalVnd, problem, hint, editing, stopEditing, restored, canUndo: history.length > 0,
    insert, move, removeAt, autoFill, swapMain, undo, reset, addToCart, setup, gift, setGift, note, setNote,
  };
}

export type BraceletSetupValues = { wraps: number; slug: string; wrist: number; fitId: string };

export type BraceletState = ReturnType<typeof useBracelet>;
