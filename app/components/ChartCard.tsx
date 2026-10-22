/* Card chart: tiêu đề (chead 43px) → legend (nếu có, NẰM TRÊN chart) → vùng vẽ.
   Bề rộng là số px cứng từ layout(). padding .card = 14 = CARD_PAD — đổi một bên là chart bị xén. */
import type { ReactNode } from 'react';
import { GRAIN_VI } from '@/lib/aggregate';
import { COUNT_METRIC, metric } from '@/lib/config';
import type { Grain, Trend } from '@/lib/types';

export function ChartCard({ width, title, sub, right, legend, children }: {
  width: number;
  title: string;
  sub: string;
  right?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="card" style={{ width, flex: `0 0 ${width}px` }}>
      <div className="chead">
        <div><div className="ct">{title}</div><div className="cs">{sub}</div></div>
        {right}
      </div>
      {legend}
      {children}
    </div>
  );
}

/* Ngày/Tuần/Tháng: CHỈ đặt ở card có trục thời gian. Bảng theo kỳ dùng chung biến grain, không có nút riêng. */
export function GrainSeg({ grain, onGrain }: { grain: Grain; onGrain: (g: Grain) => void }) {
  return (
    <div className="seg sm">
      {(['day', 'week', 'month'] as const).map((g) => (
        <button key={g} className={grain === g ? 'on' : undefined} onClick={() => onGrain(g)}>{GRAIN_VI[g]}</button>
      ))}
    </div>
  );
}

/* Chọn chỉ số cho một chart xu hướng (vd. Doanh thu booking / Số booking). Đặt cạnh GrainSeg trong `right`. */
export function MetricSeg({ value, options, onChange }: {
  value: string;
  options: { k: string; label: string }[];
  onChange: (k: string) => void;
}) {
  return (
    <div className="seg sm">
      {options.map((o) => (
        <button key={o.k} className={value === o.k ? 'on' : undefined} onClick={() => onChange(o.k)}>{o.label}</button>
      ))}
    </div>
  );
}

/* Chỉ số mà chart xu hướng đang vẽ: chỉ số đang chọn trong bộ lọc, hoặc Số booking. */
export const trendKey = (param: string, trend: Trend): string => (trend === 'count' && COUNT_METRIC ? COUNT_METRIC : param);

/* Nút "Doanh thu booking | Số booking" của chart xu hướng. Không có chỉ số đếm thì không hiện. */
export function TrendSeg({ param, trend, onTrend }: { param: string; trend: Trend; onTrend: (t: Trend) => void }) {
  if (!COUNT_METRIC || param === COUNT_METRIC) return null;
  return (
    <MetricSeg value={trend} onChange={(k) => onTrend(k as Trend)}
               options={[{ k: 'param', label: metric(param).label }, { k: 'count', label: metric(COUNT_METRIC).label }]} />
  );
}

/* Nhiều nút điều khiển ở đầu card: xếp ngang, cách 8px. */
export const Controls = ({ children }: { children: ReactNode }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
);

/* Legend: chỉ màu ↔ tên nhóm, không kèm số. Chỉ donut (two = 2 hàng, 44px) và line nhiều đường (24px). */
export function Legend({ items, two }: { items: { name: string; color: string }[]; two?: boolean }) {
  return (
    <div className={two ? 'lgd two' : 'lgd'}>
      {items.map((i) => (
        <span className="li" key={i.name}><i style={{ background: i.color }} /><b>{i.name}</b></span>
      ))}
    </div>
  );
}
