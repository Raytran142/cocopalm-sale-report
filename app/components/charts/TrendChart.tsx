'use client';
/* Area một chuỗi (trang Tổng quan) và line nhiều đường (trang theo dimension) — cùng một hàm vẽ.
   SVG tay, kích thước px cứng. Nhãn trục x cuối neo 'end' để không bị overflow:hidden của card xén. */
import { useId, type MouseEvent } from 'react';
import { maxOf } from '@/lib/tokens';
import { hideTip, showTip } from '../Tip';

/* values[i] = null: kỳ không xác định (tỷ lệ có mẫu số 0) ⇒ đường ngắt đoạn tại đó, tooltip ghi "—". */
export type Series = { name: string; color: string; values: (number | null)[]; area?: boolean; width?: number };

export function TrendChart({ w, h, labels, series, fmt, int }: {
  w: number;
  h: number;
  labels: string[];
  series: Series[];
  fmt: (v: number) => string;
  int?: boolean; // chỉ số đếm: mốc trục Y là số nguyên (0 · 1 · 2), không chia 3 đều ra 0,67
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const pl = 56, pr = 12, pt = 12, pb = 24;
  const iw = Math.max(20, w - pl - pr), ih = Math.max(20, h - pt - pb);
  const n = labels.length;
  const top = maxOf(series.flatMap((s) => s.values.filter((v): v is number => v !== null)));
  const ystep = int ? Math.max(1, Math.ceil((top * 1.12) / 3)) : 0;
  const max = int ? ystep * 3 : top * 1.12;
  const x = (i: number) => pl + (n < 2 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v: number) => pt + ih - (Math.max(0, v) / max) * ih;
  const step = Math.max(1, Math.ceil(n / Math.max(3, Math.floor(iw / 78))));

  function onMove(e: MouseEvent<SVGSVGElement>) {
    const b = e.currentTarget.getBoundingClientRect();
    const sc = b.width / w;
    const j = Math.round(((e.clientX - b.left) / sc - pl) / iw * (n - 1));
    if (j < 0 || j >= n) return hideTip();
    showTip(e, labels[j], series.map((s) => ({ name: s.name, color: s.color, v: s.values[j] == null ? '—' : fmt(s.values[j] as number) })));
  }

  return (
    <svg width={w} height={h} onMouseMove={onMove} onMouseLeave={hideTip}>
      {[0, 1, 2, 3].map((i) => {
        const yy = pt + ih - (i * ih) / 3;
        return (
          <g key={i}>
            <line x1={pl} y1={yy} x2={w - pr} y2={yy} style={{ stroke: 'var(--fill4)' }} strokeWidth={1} />
            <text x={pl - 9} y={yy + 4} textAnchor="end" fontSize={10.5} style={{ fill: 'var(--label2)' }}>{fmt((max * i) / 3)}</text>
          </g>
        );
      })}
      {series.map((s, si) => {
        // Chia thành các đoạn liền (bỏ điểm null); mỗi đoạn bắt đầu bằng M, vùng tô đóng theo từng đoạn.
        const segs: number[][] = [];
        s.values.forEach((v, i) => {
          if (v === null) return;
          const last = segs[segs.length - 1];
          if (last && last[last.length - 1] === i - 1) last.push(i);
          else segs.push([i]);
        });
        const path = (idx: number[]) => idx.map((i, j) => `${j ? 'L' : 'M'}${x(i).toFixed(1)} ${y(s.values[i] as number).toFixed(1)}`).join(' ');
        const d = segs.map(path).join(' ');
        if (!d) return null;
        const area = segs.map((g) => `${path(g)} L${x(g[g.length - 1]).toFixed(1)} ${pt + ih} L${x(g[0]).toFixed(1)} ${pt + ih}Z`).join(' ');
        const gid = `g${uid}${si}`;
        return (
          <g key={s.name}>
            {s.area && (
              <>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" style={{ stopColor: s.color, stopOpacity: 0.22 }} />
                    <stop offset="1" style={{ stopColor: s.color, stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                <path d={area} fill={`url(#${gid})`} />
              </>
            )}
            <path d={d} fill="none" style={{ stroke: s.color }} strokeWidth={s.width ?? 2.2}
                  strokeLinecap="round" strokeLinejoin="round" />
            {/* điểm đứng một mình (hai bên đều null) không vẽ được thành đường ⇒ chấm tròn */}
            {segs.filter((g) => g.length === 1).map((g) => (
              <circle key={g[0]} cx={x(g[0])} cy={y(s.values[g[0]] as number)} r={2.4} style={{ fill: s.color }} />
            ))}
          </g>
        );
      })}
      {labels.map((l, i) =>
        i % step === 0 || i === n - 1 ? (
          <text key={i} x={x(i)} y={h - 7} textAnchor={i === n - 1 && n > 1 ? 'end' : 'middle'} fontSize={10.5}
                style={{ fill: 'var(--label2)' }}>{l}</text>
        ) : null,
      )}
    </svg>
  );
}
