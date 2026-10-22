/* Toàn bộ toán tổng hợp. Không có JSX, không đụng DOM ⇒ chạy được cả ở server (API) lẫn trình duyệt.
   Ba luật không thương lượng:
   1 · Tỷ lệ = SUM(tử) / SUM(mẫu), tính lại từ tổng. Không bao giờ lấy trung bình tỷ lệ từng dòng.
   2 · Cột ATTRIBUTE (ngân sách, công suất…) lặp ở mọi dòng của một thực thể ⇒ MAX theo thực thể rồi mới cộng.
   3 · Cột ảnh chụp (agg 'last' / 'avg', ví dụ headcount) không cộng qua ngày. */
import {
  ALERT_DIM, CFG, COLUMNS, FILTER_DIM, LOSS, METRICS, PRIMARY, SECONDARY, labelOf, lower, meets, metric,
  type Threshold,
} from './config';
import { fmt, isoAt, ddmm } from './format';
import type { Agg, Filters, Grain, Group, Meta, Period, Preset, Row } from './types';

const SUM_COLS = COLUMNS.filter((c) => c.role === 'METRIC' && (c.agg ?? 'sum') === 'sum').map((c) => c.name);
const SNAP_COLS = COLUMNS.filter((c) => c.role === 'METRIC' && (c.agg === 'last' || c.agg === 'avg'));
const ATTR_COLS = COLUMNS.filter((c) => c.role === 'ATTRIBUTE');

export function colTotals(rows: Row[]): Agg {
  const s: Agg = {};
  for (const c of SUM_COLS) s[c] = 0;
  for (const r of rows) for (const c of SUM_COLS) s[c] += r.m[c] ?? 0;

  for (const c of SNAP_COLS) {
    const byT = new Map<number, number>();
    for (const r of rows) byT.set(r.t, (byT.get(r.t) ?? 0) + (r.m[c.name] ?? 0));
    if (!byT.size) { s[c.name] = 0; continue; }
    if (c.agg === 'last') s[c.name] = byT.get(Math.max(...byT.keys())) ?? 0;
    else s[c.name] = [...byT.values()].reduce((a, b) => a + b, 0) / byT.size;
  }

  for (const c of ATTR_COLS) {
    const ent = c.entity ?? SECONDARY;
    const per = new Map<string, number>();
    for (const r of rows) {
      const k = r.d[ent] ?? '';
      per.set(k, Math.max(per.get(k) ?? -Infinity, r.m[c.name] ?? 0));
    }
    s[c.name] = [...per.values()].reduce((a, b) => a + b, 0);
  }
  return s;
}

const term = (s: Agg, t: string): number => (t.startsWith('-') ? -(s[t.slice(1)] ?? 0) : (s[t] ?? 0));

export function withMetrics(s: Agg): Agg {
  const out: Agg = { ...s };
  for (const m of CFG.metrics) {
    if (m.col) { out[m.key] = s[m.col] ?? 0; continue; }
    const n = (m.num ?? []).reduce((a, t) => a + term(s, t), 0);
    const scale = m.scale ?? 1;
    if (!m.den || !m.den.length) { out[m.key] = n * scale; continue; }
    const d = m.den.reduce((a, t) => a + term(s, t), 0);
    out[m.key] = d ? (n / d) * scale : 0;
  }
  return out;
}

export const agg = (rows: Row[]): Agg => withMetrics(colTotals(rows));

export function group(rows: Row[], dim: string): Group[] {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const k = r.d[dim] ?? '';
    let a = m.get(k);
    if (!a) m.set(k, (a = []));
    a.push(r);
  }
  return [...m].map(([k, rs]) => ({ k, n: rs.length, v: agg(rs) }));
}

export const sortBy = (gs: Group[], key: string): Group[] => gs.sort((a, b) => (b.v[key] ?? 0) - (a.v[key] ?? 0));

export const GRAIN_VI: Record<Grain, string> = { day: 'Ngày', week: 'Tuần', month: 'Tháng' };

/* Gom theo kỳ. Tuần tính từ ngày đầu của dữ liệu (k = floor(t/7)), nhãn là ngày đầu tuần.
   span (khoảng t của bộ lọc): có thì trả về MỌI kỳ trong khoảng, kỳ không có dòng nào vẫn có mặt với n = 0
   (chỉ số cộng = 0, tỷ lệ không xác định — xem valueOf). Không có span thì chỉ các kỳ có dữ liệu. */
export function byGrain(rows: Row[], grain: Grain, from: string, span?: { from: number; to: number }): Period[] {
  const keyOf = (t: number, date: string): number | string =>
    grain === 'day' ? t : grain === 'week' ? Math.floor(t / 7) : date.slice(0, 7);
  const m = new Map<number | string, Row[]>();
  if (span) {
    for (let t = span.from; t <= span.to; t++) {
      const k = keyOf(t, isoAt(from, t));
      if (!m.has(k)) m.set(k, []);
    }
  }
  for (const r of rows) {
    const k = keyOf(r.t, r.date);
    let a = m.get(k);
    if (!a) m.set(k, (a = []));
    a.push(r);
  }
  const years = new Set([...m.keys()].map((k) => (grain === 'month' ? String(k) : isoAt(from, grain === 'week' ? (k as number) * 7 : (k as number))).slice(0, 4))).size;
  const label = (k: number | string): string => {
    if (grain === 'day') return ddmm(isoAt(from, k as number));
    if (grain === 'week') return ddmm(isoAt(from, (k as number) * 7));
    const s = String(k);
    return 'T' + Number(s.slice(5, 7)) + (years > 1 ? '/' + s.slice(2, 4) : '');
  };
  return [...m]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, rs]) => ({ k, label: label(k), n: rs.length, v: agg(rs) }));
}

/* Giá trị chỉ số để VẼ: tỷ lệ có mẫu số 0 (vd. ADR của ngày không có room night) là null — không xác định,
   không phải 0. Chart ngắt đoạn, bảng ghi "—". Chỉ số cộng được trả về số (0 khi trống). */
export function valueOf(v: Agg, key: string): number | null {
  const m = METRICS[key];
  if (m?.den?.length && m.den.reduce((s, t) => s + term(v, t), 0) === 0) return null;
  return v[key] ?? 0;
}

/* ── Bộ lọc ─────────────────────────────────────────────────────────────── */
export function presetOf(n: number, days: number): Preset {
  if (n >= days) return 'all';
  return n === 7 || n === 30 || n === 90 ? n : 'custom';
}

export function defaultFilters(days: number): Filters {
  const n = Math.min(CFG.defaultDays || 30, Math.max(1, days));
  return {
    param: CFG.defaultParam, preset: presetOf(n, days),
    from: Math.max(0, days - n), to: Math.max(0, days - 1),
    primary: [], secondary: [], filter: 'all', losing: false,
  };
}

function dimsMatch(r: Row, f: Filters): boolean {
  if (f.primary.length && !f.primary.includes(r.d[PRIMARY])) return false;
  if (f.secondary.length && !f.secondary.includes(r.d[SECONDARY])) return false;
  if (FILTER_DIM && f.filter !== 'all' && r.d[FILTER_DIM] !== f.filter) return false;
  return true;
}

export function applyFilters(rows: Row[], f: Filters): Row[] {
  let losing: Set<string> | null = null;
  const loss = LOSS;
  if (f.losing && loss) {
    const inRange = rows.filter((r) => r.t >= f.from && r.t <= f.to);
    losing = new Set(group(inRange, ALERT_DIM).filter((g) => meets(g.v[loss.metric], loss)).map((g) => g.k));
  }
  return rows.filter((r) =>
    r.t >= f.from && r.t <= f.to && dimsMatch(r, f) && (!losing || losing.has(r.d[ALERT_DIM])));
}

/* Chỉ bộ lọc dimension, bỏ khoảng ngày — trang "Theo thời gian" cần đủ mọi tháng. */
export const applyDims = (rows: Row[], f: Filters): Row[] => rows.filter((r) => dimsMatch(r, f));

/* Kỳ trước = cùng số ngày, ngay trước from, cùng bộ lọc dimension. */
export function prevRows(rows: Row[], f: Filters): Row[] {
  const len = f.to - f.from + 1;
  return rows.filter((r) => r.t >= f.from - len && r.t <= f.from - 1 && dimsMatch(r, f));
}

export function filterCount(f: Filters): number {
  return f.primary.length + f.secondary.length + (f.filter !== 'all' ? 1 : 0) + (f.losing ? 1 : 0);
}

/* ── Cảnh báo ngưỡng ────────────────────────────────────────────────────── */
export type Alert = { th: Threshold; label: string; tone: 'bad' | 'warn' | 'ink3'; keys: string[] };

export function alertLabel(t: Threshold): string {
  if (t.alert) return t.alert;
  const m = metric(t.metric);
  if (t.kind === 'loss') return `${labelOf(ALERT_DIM)} đang lỗ`;
  if (t.kind === 'resource') return `${m.label} ${t.op} ${fmt(m.format, t.value)}`;
  return `${m.label} vượt ${fmt(m.format, t.value)}`;
}

export function alerts(filtered: Row[], all: Row[]): Alert[] {
  const out: Alert[] = [];
  const present = group(filtered, ALERT_DIM);
  for (const t of CFG.thresholds) {
    if (t.kind === 'target') continue;
    const life = METRICS[t.metric]?.window === 'all';
    const base = life ? new Map(group(all, ALERT_DIM).map((g) => [g.k, g.v])) : null;
    const keys = present.filter((g) => meets((base?.get(g.k) ?? g.v)[t.metric], t)).map((g) => g.k);
    out.push({ th: t, label: alertLabel(t), tone: t.kind === 'loss' ? 'bad' : t.kind === 'unit_cost' ? 'warn' : 'ink3', keys });
  }
  return out;
}

export const alertTotal = (as: Alert[]): number => as.reduce((s, a) => s + a.keys.length, 0);

/* ── Ngưỡng tính riêng cho từng property ───────────────────────────────────
   Ngưỡng có rule p75 / p25 / median_x1.25 được tính lại trên dữ liệu của property đang xem (giá trị chỉ số
   theo từng booking — hoặc từng dòng khi không có mã booking —, bỏ đơn vị có mẫu số 0), làm tròn 2 chữ số có nghĩa theo hướng có lợi cho mục tiêu
   (lên với p75 / median_x1.25, xuống với p25) — cùng luật dashboard-design dùng khi soạn thiết kế.
   byProperty[property] (con số người dùng chốt) thắng mọi tính toán. */
function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const i = (sorted.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
function round2(v: number, dir: 'up' | 'down'): number {
  if (!Number.isFinite(v) || v === 0) return v;
  const p = 10 ** (Math.floor(Math.log10(Math.abs(v))) - 1);
  return (dir === 'up' ? Math.ceil(v / p) : Math.floor(v / p)) * p;
}

export function thresholdTargets(rows: Row[], property: string): Record<string, number> {
  const out: Record<string, number> = {};
  // Đơn vị tính phân vị: mỗi booking (gộp các dòng phòng cùng mã r.e), không có mã thì mỗi dòng.
  // Gộp theo booking để ADR = booking_total / tổng room night của cả booking, không lệch ở booking nhiều phòng.
  const byE = new Map<string, Row[]>();
  rows.forEach((r, i) => {
    const k = r.e || `#${i}`;
    let a = byE.get(k);
    if (!a) byE.set(k, (a = []));
    a.push(r);
  });
  const units = [...byE.values()].map((rs) => ({ s: colTotals(rs) }));
  for (const t of CFG.thresholds) {
    const fixed = t.byProperty?.[property];
    if (fixed !== undefined) { out[t.key] = fixed; continue; }
    if (t.rule !== 'p75' && t.rule !== 'p25' && t.rule !== 'median_x1.25') continue;
    const m = METRICS[t.metric];
    const ratio = !!m?.den?.length;
    const vals = units
      .filter((u) => !ratio || m.den!.reduce((s, c) => s + (u.s[c.replace(/^-/, '')] ?? 0), 0) !== 0)
      .map((u) => withMetrics(u.s)[t.metric] ?? 0)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    if (!vals.length) continue;
    if (t.rule === 'p75') out[t.key] = round2(quantile(vals, 0.75), 'up');
    else if (t.rule === 'p25') out[t.key] = round2(quantile(vals, 0.25), 'down');
    else out[t.key] = round2(quantile(vals, 0.5) * 1.25, 'up');
  }
  return out;
}

/* ── Tóm tắt cho script kiểm tra (GET /api/data?summary=1) ───────────────── */
export function summary(rows: Row[], meta: Meta) {
  const f = defaultFilters(meta.days);
  const cur = agg(rows.filter((r) => r.t >= f.from && r.t <= f.to));
  const all = agg(rows);
  const pick = (a: Agg) => Object.fromEntries(CFG.kpis.map((k) => [k, a[k] ?? 0]));
  return {
    count: rows.length,
    from: meta.from,
    to: meta.to,
    days: meta.days,
    defaultPeriod: { from: isoAt(meta.from, f.from), to: isoAt(meta.from, f.to), rows: rows.filter((r) => r.t >= f.from && r.t <= f.to).length },
    groups: { [PRIMARY]: new Set(rows.map((r) => r.d[PRIMARY])).size, [SECONDARY]: new Set(rows.map((r) => r.d[SECONDARY])).size },
    kpisDefault: pick(cur),
    kpisAll: pick(all),
  };
}

export const dimLabelLower = (dim: string): string => lower(labelOf(dim));
