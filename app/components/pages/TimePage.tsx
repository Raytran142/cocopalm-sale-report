/* Trang "Theo thời gian" — doanh thu thay đổi qua các tháng, so tháng trước (MoM) và cùng kỳ năm trước (YoY).
   Thay băng KPI chuẩn bằng băng KPI của THÁNG ĐANG CHỌN. Bỏ qua khoảng ngày của bộ lọc, giữ bộ lọc dimension.
   Bố cục giữ khung 30/70 (Row 2) và 40/60 (Row 3) như các trang khác. */
import type { ReactNode } from 'react';
import { agg } from '@/lib/aggregate';
import { CFG, PRIMARY, isAdditive, labelOf, lower, metric } from '@/lib/config';
import { fmt, pct } from '@/lib/format';
import type { IconName } from '@/lib/icons';
import {
  baseLabel, change, compareOf, deltaBy, monthLabel, monthLong, primaryOrder, yearAgoKey, type Month,
} from '@/lib/monthly';
import { LGD1, seriesColor, type Layout } from '@/lib/tokens';
import { ChartCard, Legend } from '../ChartCard';
import { Icon } from '../Icon';
import { DeltaBars, MonthBars, StackedMonths } from '../charts/MonthBars';
import { SparkLine } from '../charts/SparkLine';
import { short } from './OverviewPage';

const DEFAULT_ICONS: IconName[] = ['coins', 'trending-up', 'target', 'gauge', 'chart-pie'];

/* Mũi tên + % có màu theo chiều tốt của chỉ số; null ⇒ "—" (kỳ so sánh không có dữ liệu). */
function Delta({ d, better }: { d: number | null; better?: string }) {
  if (d === null) return <span className="del n">—</span>;
  const good = better === 'lower' ? d < 0 : d > 0;
  const cls = Math.abs(d) < 0.002 ? 'n' : good ? 'u' : 'd';
  return <span className={`del ${cls}`}><Icon name={d >= 0 ? 'arrow-up' : 'arrow-down'} className="lu-xs" />{pct(Math.abs(d))}</span>;
}

const signed = (d: number | null): string => (d === null ? '—' : (d >= 0 ? '+' : '−') + pct(Math.abs(d)));

function MonthKpis({ ms, sel, kpiW }: { ms: Month[]; sel: string; kpiW: number }) {
  const c = compareOf(ms, sel);
  if (!c) return <div id="kpis" />;
  return (
    <div id="kpis">
      {CFG.kpis.map((k, i) => {
        const m = metric(k);
        const f = (x: number) => fmt(m.format, x);
        const v = c.cur.v[k] ?? 0;
        const mom = change(v, c.mom?.v[k]);
        const yoy = change(v, c.yoy?.v[k]);
        const values = ms.map((x) => x.v[k] ?? 0);
        const base = values.length ? values.reduce((s, x) => s + x, 0) / values.length : null;
        const note: ReactNode = c.yoy
          ? <>YoY {signed(yoy)} · {baseLabel(c.yoy)}: {f(c.yoy.v[k] ?? 0)}</>
          : <>YoY: chưa có dữ liệu {monthLabel(yearAgoKey(c.cur.k))}</>;
        return (
          <div className="card kpi" key={k}>
            <div className="kl"><Icon name={m.icon ?? DEFAULT_ICONS[i % 5]} className="lu-sm" />{m.label}</div>
            <div className="kv">{f(v)}<Delta d={mom} better={m.better} /></div>
            <div className="kspark"><SparkLine w={kpiW - 28} h={34} values={values} color={k === CFG.defaultParam ? 'var(--focus)' : 'var(--series-2)'} base={base} /></div>
            <div className="ks"><Icon name="clock" className="lu-xs" />{note}</div>
          </div>
        );
      })}
    </div>
  );
}

export function TimePage({ ms, rows, L, param, sel, onSel }: {
  ms: Month[];
  rows: Month['rows'];
  L: Layout;
  param: string;
  sel: string;
  onSel: (k: string) => void;
}) {
  const p = metric(param);
  const f = (v: number) => fmt(p.format, v);
  const sk = isAdditive(param) ? param : CFG.donutMetric; // cột chồng / chênh lệch nhóm chỉ cộng được với chỉ số gốc
  const sm = metric(sk);
  const fs = (v: number) => fmt(sm.format, v);
  const c = compareOf(ms, sel);
  const pl = lower(labelOf(PRIMARY));

  const bars = ms.map((m) => {
    const cm = compareOf(ms, m.k)!;
    const lyv = cm.yoy ? cm.yoy.v[param] ?? 0 : null;
    const v = m.v[param] ?? 0;
    return {
      k: m.k, label: m.label, v, ly: lyv, partial: m.partial,
      title: monthLong(m.k) + (m.partial ? ` (tới ngày ${m.cut})` : ''),
      tip: [
        { name: p.label, color: 'var(--focus)', v: f(v) },
        { name: 'MoM', color: 'var(--series-4)', v: signed(change(v, cm.mom?.v[param])) },
        { name: 'Cùng kỳ năm trước', color: 'var(--ink)', v: cm.yoy ? `${f(lyv ?? 0)} (${signed(change(v, lyv))})` : 'chưa có dữ liệu' },
      ],
    };
  });

  const order = primaryOrder(rows, sk);
  const stacks = order.map((g, i) => ({
    name: g.k, color: seriesColor(null, i),
    values: ms.map((m) => agg(m.rows.filter((r) => r.d[PRIMARY] === g.k))[sk] ?? 0),
  }));

  const deltas = c?.mom ? deltaBy(c.cur.rows, c.mom.rows, PRIMARY, sk) : [];
  const yoyCount = bars.filter((b) => b.ly !== null).length;
  const hasPartial = ms.some((m) => m.partial);

  return (
    <>
      <MonthKpis ms={ms} sel={sel} kpiW={L.kpiW} />
      <div id="row2">
        <ChartCard width={L.a} title={`${pl[0].toUpperCase() + pl.slice(1)} kéo tăng / giảm`}
                   sub={c?.mom ? `${sm.label} · ${c.cur.cut ? baseLabel(c.cur) : monthLabel(c.cur.k)} so với ${baseLabel(c.mom)}` : 'Chưa có tháng trước để so'}>
          <div className="plot">
            {deltas.length
              ? <DeltaBars w={L.p2a.w} h={L.p2a.h}
                           items={deltas.map((d) => ({
                             k: d.k, name: short(d.k, 13), d: d.d,
                             lab: (d.d >= 0 ? '+' : '−') + fs(Math.abs(d.d)), sub: `${fs(d.base)} → ${fs(d.cur)}`,
                           }))} />
              : <div className="cs">Không có dữ liệu để so sánh</div>}
          </div>
        </ChartCard>
        <ChartCard width={L.b} title={`${p.label} theo tháng`}
                   sub={`Vạch đen = cùng kỳ năm trước (${yoyCount ? yoyCount + ' tháng có' : 'chưa có tháng nào'})${hasPartial ? ' · * chưa trọn tháng, so cùng số ngày' : ''} · bấm cột để chọn tháng`}
                   legend={<Legend items={[{ name: 'Tháng đang chọn', color: 'var(--focus)' }, { name: 'Tháng khác', color: 'var(--series-4)' }, { name: 'Cùng kỳ năm trước', color: 'var(--ink)' }]} />}>
          <div className="plot">
            <MonthBars w={L.p2b.w} h={L.p2b.h - LGD1} items={bars} selected={sel} onSelect={onSel} fmt={f} />
          </div>
        </ChartCard>
      </div>
      <div id="row3">
        <ChartCard width={L.c} title={`${sm.label} tháng theo ${pl}`} sub="Cột chồng · đưa chuột để xem từng kênh"
                   legend={<Legend items={stacks.map((s) => ({ name: short(s.name, 12), color: s.color }))} />}>
          <div className="plot">
            <StackedMonths w={L.p3c.w} h={L.p3c.h - LGD1} labels={ms.map((m) => m.label)} keys={ms.map((m) => m.k)}
                           stacks={stacks} selected={sel} onSelect={onSel} fmt={fs} />
          </div>
        </ChartCard>
        <ChartCard width={L.d} title="Bảng theo tháng" sub={`MoM / YoY tính trên ${p.label} · bấm dòng để chọn tháng`}>
          <MonthTable ms={ms} sel={sel} onSel={onSel} param={param} />
        </ChartCard>
      </div>
    </>
  );
}

function MonthTable({ ms, sel, onSel, param }: { ms: Month[]; sel: string; onSel: (k: string) => void; param: string }) {
  // Card 60% chỉ chứa ~6 cột: chỉ số đang chọn + room night + ADR, rồi MoM / YoY
  const keys = [...new Set([param, 'room_night', 'adr'])].filter((k) => CFG.metrics.some((m) => m.key === k));
  const pm = metric(param);
  const cls = (d: number | null) => {
    if (d === null || Math.abs(d) < 0.002) return undefined;
    const good = pm.better === 'lower' ? d < 0 : d > 0;
    return { color: good ? 'var(--ok)' : 'var(--bad)' };
  };
  const rows = [...ms].reverse(); // tháng mới nhất lên đầu
  return (
    <div className="tscroll">
      <table>
        <thead><tr><th>Tháng</th>{keys.map((k) => <th key={k}>{metric(k).label}</th>)}<th>MoM</th><th>YoY</th></tr></thead>
        <tbody>
          {rows.map((m) => {
            const c = compareOf(ms, m.k)!;
            const v = m.v[param] ?? 0;
            const mom = change(v, c.mom?.v[param]), yoy = change(v, c.yoy?.v[param]);
            const on = m.k === sel;
            return (
              <tr key={m.k} onClick={() => onSel(m.k)}
                  style={{ cursor: 'pointer', background: on ? 'var(--sub2)' : undefined, fontWeight: on ? 600 : undefined }}>
                <td>{m.label}{m.partial ? '*' : ''}</td>
                {keys.map((k) => <td key={k}>{m.empty ? '—' : fmt(metric(k).format, m.v[k] ?? 0)}</td>)}
                <td style={cls(mom)}>{signed(mom)}</td>
                <td style={cls(yoy)}>{signed(yoy)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
