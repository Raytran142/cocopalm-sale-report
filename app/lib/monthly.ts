/* Toán của trang "Theo thời gian": gom theo tháng lịch (theo cột DATE), so tháng trước (MoM)
   và cùng tháng năm trước (YoY). Không JSX, không DOM.
   Trang này BỎ QUA khoảng ngày của bộ lọc (30 ngày không đủ để so tháng) nhưng giữ bộ lọc dimension. */
import { agg, group, sortBy } from './aggregate';
import { PRIMARY } from './config';
import type { Agg, Group, Row } from './types';

/* cut: ngày cuối có dữ liệu của tháng chưa trọn (0 = tháng trọn). */
export type Month = { k: string; label: string; rows: Row[]; v: Agg; partial: boolean; empty: boolean; cut: number };

const p2 = (n: number): string => String(n).padStart(2, '0');
export const shiftMonth = (k: string, by: number): string => {
  const [y, m] = k.split('-').map(Number);
  const i = y * 12 + (m - 1) + by;
  return `${Math.floor(i / 12)}-${p2((i % 12) + 1)}`;
};
export const prevMonthKey = (k: string): string => shiftMonth(k, -1);
export const yearAgoKey = (k: string): string => shiftMonth(k, -12);
export const monthLabel = (k: string): string => `T${Number(k.slice(5, 7))}/${k.slice(2, 4)}`;
export const monthLong = (k: string): string => `Tháng ${Number(k.slice(5, 7))}/${k.slice(0, 4)}`;

const lastDay = (k: string): number => {
  const [y, m] = k.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

/* Mọi tháng liên tục từ tháng đầu đến tháng cuối của DỮ LIỆU GỐC (from/to của meta), kể cả tháng trống,
   để trục thời gian không bị khuyết khi bộ lọc dimension loại hết dòng của một tháng.
   Tháng cuối là "chưa trọn" nếu ngày cuối của dữ liệu chưa tới cuối tháng. */
export function months(rows: Row[], from: string, to: string): Month[] {
  const by = new Map<string, Row[]>();
  for (const r of rows) {
    const k = r.date.slice(0, 7);
    let a = by.get(k);
    if (!a) by.set(k, (a = []));
    a.push(r);
  }
  const first = from.slice(0, 7), last = to.slice(0, 7);
  const out: Month[] = [];
  for (let k = first; k <= last; k = shiftMonth(k, 1)) {
    const rs = by.get(k) ?? [];
    const partial = k === last && Number(to.slice(8, 10)) < lastDay(k);
    out.push({
      k, label: monthLabel(k), rows: rs, v: agg(rs), empty: !rs.length,
      partial, cut: partial ? Number(to.slice(8, 10)) : 0,
    });
  }
  return out;
}

/* Tháng mặc định: tháng trọn gần nhất (so MoM của tháng đang dở với tháng đủ là so lệch). */
export function defaultMonth(ms: Month[]): string {
  for (let i = ms.length - 1; i >= 0; i--) if (!ms[i].partial) return ms[i].k;
  return ms[ms.length - 1]?.k ?? '';
}

/* % thay đổi; null khi kỳ so sánh không có dữ liệu (không được hiểu là +∞ hay 0). */
export function change(cur: number, base: number | null | undefined): number | null {
  if (base === null || base === undefined || !Number.isFinite(base) || base === 0) return null;
  return (cur - base) / Math.abs(base);
}

/* Tháng chưa trọn (dữ liệu tới ngày N) so với ngày 1..N của tháng so sánh — cùng số ngày,
   không so nửa tháng với cả tháng. */
export type Compare = { cur: Month; mom: Month | null; yoy: Month | null };
export function compareOf(ms: Month[], k: string): Compare | null {
  const idx = new Map(ms.map((m) => [m.k, m]));
  const cur = idx.get(k);
  if (!cur) return null;
  const pick = (key: string): Month | null => {
    const m = idx.get(key);
    if (!m || m.empty) return null;
    if (!cur.cut) return m;
    const rs = m.rows.filter((r) => Number(r.date.slice(8, 10)) <= cur.cut);
    return { ...m, rows: rs, v: agg(rs), empty: !rs.length, cut: cur.cut };
  };
  return { cur, mom: pick(prevMonthKey(k)), yoy: pick(yearAgoKey(k)) };
}

/* Nhãn kỳ so sánh, ghi rõ khi chỉ lấy ngày 1..N. */
export const baseLabel = (m: Month): string => (m.cut ? `1–${m.cut}/${monthLabel(m.k).slice(1)}` : monthLabel(m.k));

/* Chênh lệch theo nhóm giữa tháng đang xem và tháng trước: nhóm nào kéo tăng / kéo giảm. */
export type Delta = { k: string; cur: number; base: number; d: number };
export function deltaBy(cur: Row[], base: Row[], dim: string, key: string): Delta[] {
  const a = new Map(group(cur, dim).map((g) => [g.k, g.v[key] ?? 0]));
  const b = new Map(group(base, dim).map((g) => [g.k, g.v[key] ?? 0]));
  const keys = new Set([...a.keys(), ...b.keys()]);
  return [...keys]
    .map((k) => ({ k, cur: a.get(k) ?? 0, base: b.get(k) ?? 0, d: (a.get(k) ?? 0) - (b.get(k) ?? 0) }))
    .sort((x, y) => y.d - x.d);
}

/* Nhóm của trục chính, xếp theo tổng toàn kỳ (thứ tự màu cố định trên chart chồng). */
export const primaryOrder = (rows: Row[], key: string): Group[] => sortBy(group(rows, PRIMARY), key);
