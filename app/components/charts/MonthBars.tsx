'use client';
/* Cột theo tháng + vạch cùng kỳ năm trước (YoY), và cột chồng theo nhóm.
   Tháng đang chọn tô --focus; tháng chưa trọn vẽ nhạt để không bị đọc như một tháng đủ.
   Bấm một cột = chọn tháng đó cho cả trang. */
import type { MouseEvent } from 'react';
import { maxOf } from '@/lib/tokens';
import { hideTip, showTip, type TipRow } from '../Tip';

const PL = 56, PR = 10, PT = 12, PB = 24;

function Axis({ w, ih, max, fmt }: { w: number; ih: number; max: number; fmt: (v: number) => string }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const yy = PT + ih - (i * ih) / 3;
        return (
          <g key={i}>
            <line x1={PL} y1={yy} x2={w - PR} y2={yy} style={{ stroke: 'var(--fill4)' }} strokeWidth={1} />
            <text x={PL - 9} y={yy + 4} textAnchor="end" fontSize={10.5} style={{ fill: 'var(--label2)' }}>{fmt((max * i) / 3)}</text>
          </g>
        );
      })}
    </>
  );
}

export type MonthBar = { k: string; label: string; v: number; ly: number | null; partial: boolean; tip: TipRow[]; title: string };

export function MonthBars({ w, h, items, selected, onSelect, fmt }: {
  w: number; h: number; items: MonthBar[]; selected: string; onSelect: (k: string) => void; fmt: (v: number) => string;
}) {
  const iw = Math.max(20, w - PL - PR), ih = Math.max(20, h - PT - PB);
  const n = Math.max(1, items.length), slot = iw / n, bw = Math.min(46, slot * 0.62);
  const max = maxOf(items.flatMap((i) => [i.v, i.ly ?? 0])) * 1.12;
  const y = (v: number) => PT + ih - (Math.max(0, v) / max) * ih;
  const tip = (e: MouseEvent, it: MonthBar) => showTip(e, it.title, it.tip);
  return (
    <svg width={w} height={h} onMouseLeave={hideTip}>
      <Axis w={w} ih={ih} max={max} fmt={fmt} />
      {items.map((it, i) => {
        const cx = PL + slot * i + slot / 2, top = y(it.v);
        const on = it.k === selected;
        return (
          <g key={it.k} onClick={() => onSelect(it.k)} onMouseMove={(e) => tip(e, it)} style={{ cursor: 'pointer' }}>
            <rect x={PL + slot * i} y={PT} width={slot} height={ih} fill="transparent" />
            <rect x={cx - bw / 2} y={top} width={bw} height={Math.max(0, PT + ih - top)} rx={4}
                  style={{ fill: on ? 'var(--focus)' : 'var(--series-4)', opacity: it.partial ? 0.45 : 1 }} />
            {it.ly !== null && (
              <line x1={cx - bw / 2 - 4} x2={cx + bw / 2 + 4} y1={y(it.ly)} y2={y(it.ly)}
                    style={{ stroke: 'var(--ink)' }} strokeWidth={2.2} strokeLinecap="round" />
            )}
            <text x={cx} y={h - 7} textAnchor="middle" fontSize={10.5}
                  style={{ fill: on ? 'var(--ink)' : 'var(--label2)', fontWeight: on ? 600 : undefined }}>
              {it.label}{it.partial ? '*' : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export type Stack = { name: string; color: string; values: number[] };

export function StackedMonths({ w, h, labels, keys, stacks, selected, onSelect, fmt }: {
  w: number; h: number; labels: string[]; keys: string[]; stacks: Stack[];
  selected: string; onSelect: (k: string) => void; fmt: (v: number) => string;
}) {
  const iw = Math.max(20, w - PL - PR), ih = Math.max(20, h - PT - PB);
  const n = Math.max(1, labels.length), slot = iw / n, bw = Math.min(34, slot * 0.62);
  const totals = labels.map((_, i) => stacks.reduce((s, st) => s + Math.max(0, st.values[i] ?? 0), 0));
  const max = maxOf(totals) * 1.08;
  const hOf = (v: number) => (Math.max(0, v) / max) * ih;
  const step = Math.max(1, Math.ceil(n / Math.max(3, Math.floor(iw / 44))));
  return (
    <svg width={w} height={h} onMouseLeave={hideTip}>
      <Axis w={w} ih={ih} max={max} fmt={fmt} />
      {labels.map((l, i) => {
        const cx = PL + slot * i + slot / 2;
        let base = PT + ih;
        const on = keys[i] === selected;
        const rows: TipRow[] = stacks.map((s) => ({ name: s.name, color: s.color, v: fmt(s.values[i] ?? 0) }));
        return (
          <g key={keys[i]} onClick={() => onSelect(keys[i])} style={{ cursor: 'pointer' }}
             onMouseMove={(e) => showTip(e, `${l} · ${fmt(totals[i])}`, rows)}>
            <rect x={PL + slot * i} y={PT} width={slot} height={ih} fill="transparent" />
            {stacks.map((s) => {
              const hh = hOf(s.values[i] ?? 0);
              base -= hh;
              return hh > 0 ? <rect key={s.name} x={cx - bw / 2} y={base} width={bw} height={hh}
                                    style={{ fill: s.color, opacity: on || !selected ? 1 : 0.55 }} /> : null;
            })}
            {(i % step === 0 || i === n - 1) && (
              <text x={cx} y={h - 7} textAnchor="middle" fontSize={10.5}
                    style={{ fill: on ? 'var(--ink)' : 'var(--label2)', fontWeight: on ? 600 : undefined }}>{l}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* Thanh phân kỳ quanh trục 0: nhóm nào kéo tăng (phải, --ok), kéo giảm (trái, --bad). */
export type DeltaBar = { k: string; name: string; d: number; lab: string; sub: string };

export function DeltaBars({ w, h, items }: { w: number; h: number; items: DeltaBar[] }) {
  const pl = 104, pr = 8, lab = 64;
  const iw = Math.max(40, w - pl - pr - lab * 2);
  const mid = pl + lab + iw / 2;
  const n = Math.max(1, items.length), slot = h / n, bh = Math.min(26, Math.max(8, slot * 0.54));
  const max = maxOf(items.map((i) => Math.abs(i.d)));
  return (
    <svg width={w} height={h}>
      <line x1={mid} x2={mid} y1={0} y2={h} style={{ stroke: 'var(--line)' }} strokeWidth={1} />
      {items.map((it, i) => {
        const y = i * slot + (slot - bh) / 2;
        const len = Math.max(it.d ? 3 : 0, (Math.abs(it.d) / max) * (iw / 2));
        const up = it.d >= 0;
        return (
          <g key={it.k}>
            <title>{`${it.k} · ${it.lab} · ${it.sub}`}</title>
            <text x={pl - 10} y={y + bh / 2 + 4} textAnchor="end" fontSize={12} style={{ fill: 'var(--label)' }}>{it.name}</text>
            <rect x={up ? mid : mid - len} y={y} width={len} height={bh} rx={4}
                  style={{ fill: up ? 'var(--ok)' : 'var(--bad)' }} />
            <text x={up ? mid + len + 6 : mid - len - 6} y={y + bh / 2 + 4} textAnchor={up ? 'start' : 'end'}
                  fontSize={11.5} style={{ fill: 'var(--label2)' }}>{it.lab}</text>
          </g>
        );
      })}
    </svg>
  );
}
