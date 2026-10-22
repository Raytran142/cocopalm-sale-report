'use client';
/* Trang dashboard: CHỈ giữ state và bố cục. Toán ở lib/aggregate.ts, hình vẽ ở components/.
   Dữ liệu tải MỘT lần từ /api/data; mọi thao tác lọc chạy trên mảng đã có trong bộ nhớ. */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FilterDrawer } from '@/components/FilterDrawer';
import { ExportModal } from '@/components/ExportModal';
import { GreetBar, type Chip } from '@/components/GreetBar';
import { KpiBand } from '@/components/KpiBand';
import { Shell } from '@/components/Shell';
import { Sidebar, navItems } from '@/components/Sidebar';
import { Tip } from '@/components/Tip';
import { TopBar } from '@/components/TopBar';
import { DimPage } from '@/components/pages/DimPage';
import { OverviewPage } from '@/components/pages/OverviewPage';
import { SourcePage } from '@/components/pages/SourcePage';
import { TimePage } from '@/components/pages/TimePage';
import { defaultMonth, monthLabel, months } from '@/lib/monthly';
import { ALERT_DIM, FILTER_DIM, PRIMARY, SECONDARY, appName, applyTargets, labelOf, lower } from '@/lib/config';
import { alertTotal, alerts as alertsOf, applyDims, applyFilters, defaultFilters, filterCount, prevRows, type Alert } from '@/lib/aggregate';
import { clockOf, ddmm, isoAt, vi } from '@/lib/format';
import { SIDE_RAIL, SIDE_WIDE, layout } from '@/lib/tokens';
import type { DataErr, DataOk, Filters, Grain, Meta, PageId, Row, TableMode, Trend } from '@/lib/types';

type Load = 'loading' | 'error' | 'ready';

export default function DashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [load, setLoad] = useState<Load>('loading');
  const [err, setErr] = useState<DataErr | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState<Filters>(() => defaultFilters(0));
  const [page, setPage] = useState<PageId>('home');
  const [grain, setGrain] = useState<Grain>('day'); // mặc định theo ngày (dùng chung chart xu hướng và bảng theo kỳ)
  const [trend, setTrend] = useState<Trend>('count'); // chart xu hướng: Số booking (mặc định) hay chỉ số đang chọn — dùng chung 3 trang
  const [shareMode, setShareMode] = useState<Trend>('count'); // donut tỷ trọng ở tab Theo kênh OTA và Theo loại phòng: Số booking (mặc định) hay chỉ số đang chọn — dùng chung
  const [tableMode, setTableMode] = useState<TableMode>('group'); // bảng chỉ số đầy đủ (tab kênh OTA, loại phòng): theo nhóm hay theo kỳ — dùng chung
  const [rail, setRail] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [drawer, setDrawer] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pop, setPop] = useState<'notif' | 'acct' | 'prop' | null>(null);
  const [month, setMonth] = useState<string | null>(null); // tháng đang chọn ở trang "Theo thời gian"; null = mặc định
  const req = useRef(0); // đổi property liên tục: chỉ nhận phản hồi của lần gọi cuối
  const want = useRef<string | null>(null); // property của lần gọi cuối (để "Thử lại" gọi đúng property)

  /* first = tải mới (mở trang hoặc đổi property): đặt lại bộ lọc và tháng vì nhóm của property khác nhau.
     property = tab muốn xem; null ⇒ server chọn mặc định. Property đang xem được nhớ trong localStorage. */
  const fetchData = useCallback(async (first: boolean, property: string | null) => {
    const id = ++req.current;
    want.current = property;
    if (first) setLoad('loading');
    else setSyncing(true);
    try {
      const q = property ? `?property=${encodeURIComponent(property)}` : '';
      const res = await fetch('/api/data' + q, { cache: 'no-store' });
      const json = (await res.json()) as DataOk | DataErr;
      if (id !== req.current) return;
      if ('error' in json) throw json;
      applyTargets(json.meta.targets ?? {}); // trước setRows: lần vẽ kế tiếp đọc ngưỡng của property mới
      setRows(json.rows);
      setMeta(json.meta);
      try { localStorage.setItem('property', json.meta.property); } catch { /* chế độ riêng tư: bỏ qua */ }
      // khoảng ngày mặc định tính từ NGÀY CUỐI TRONG DỮ LIỆU, không phải từ hôm nay
      if (first) { setFilters(defaultFilters(json.meta.days)); setMonth(null); }
      setErr(null);
      setLoad('ready');
    } catch (e) {
      if (id !== req.current) return;
      setErr(e && typeof e === 'object' && 'error' in e ? (e as DataErr) : { error: e instanceof Error ? e.message : 'Không gọi được /api/data' });
      if (first) setLoad('error');
    } finally {
      if (id === req.current) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('property'); } catch { /* bỏ qua */ }
    void fetchData(true, saved);
  }, [fetchData]);

  useEffect(() => { if (meta) document.title = appName(meta.property); }, [meta]);

  const property = meta?.property ?? null;
  const switchProperty = (p: string) => {
    setPop(null);
    if (p !== property) void fetchData(true, p);
  };

  useEffect(() => {
    if (document.documentElement.dataset.theme === 'dark') setTheme('dark');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDrawer(false); setExporting(false); setPop(null); } };
    const onClick = (e: MouseEvent) => { if (!(e.target as Element).closest?.('.wrap')) setPop(null); };
    addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => { removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, []);

  function toggleTheme() {
    const t = theme === 'light' ? 'dark' : 'light';
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch { /* chế độ riêng tư: bỏ qua */ }
  }

  const filtered = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const prev = useMemo(() => prevRows(rows, filters), [rows, filters]);
  const al = useMemo(() => alertsOf(filtered, rows), [filtered, rows]);
  const L = useMemo(() => layout(rail ? SIDE_RAIL : SIDE_WIDE), [rail]);
  const days = meta?.days ?? 0;
  const from = meta?.from ?? '2000-01-01';
  const isTime = page === 'time';
  const span = useMemo(() => ({ from: filters.from, to: filters.to }), [filters.from, filters.to]); // khoảng t đang lọc: chart theo kỳ điền đủ mọi kỳ
  const dimRows = useMemo(() => applyDims(rows, filters), [rows, filters]);
  const ms = useMemo(() => (meta ? months(dimRows, meta.from, meta.to) : []), [dimRows, meta]);
  const sel = month && ms.some((m) => m.k === month) ? month : defaultMonth(ms);

  const items = navItems({
    alerts: alertTotal(al),
    primary: new Set(rows.map((r) => r.d[PRIMARY])).size,
    secondary: new Set(rows.map((r) => r.d[SECONDARY])).size,
  });
  const current = items.find((p) => p.id === page) ?? items[0];

  const go = (p: PageId) => { setPage(p); setPop(null); };
  const toggleIn = (list: string[], k: string) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);
  function onToggle(dim: string, key: string) {
    if (dim === PRIMARY) setFilters((f) => ({ ...f, primary: toggleIn(f.primary, key) }));
    else if (dim === SECONDARY) setFilters((f) => ({ ...f, secondary: toggleIn(f.secondary, key) }));
  }
  function onAlert(a: Alert) {
    setPop(null);
    if (!a.keys.length) return;
    // bấm cảnh báo = lọc tới đúng các nhóm đó + nhảy sang trang của dimension đó
    if (ALERT_DIM === PRIMARY) { setFilters((f) => ({ ...f, primary: a.keys, secondary: [] })); setPage('primary'); }
    else { setFilters((f) => ({ ...f, secondary: a.keys, primary: [] })); setPage('secondary'); }
  }
  const reset = () => { setFilters(defaultFilters(days)); setPop(null); };

  const chips: Chip[] = [
    ...filters.primary.map((k) => ({ key: 'p' + k, label: k, remove: () => onToggle(PRIMARY, k) })),
    ...filters.secondary.map((k) => ({ key: 's' + k, label: k, remove: () => onToggle(SECONDARY, k) })),
    ...(FILTER_DIM && filters.filter !== 'all' ? [{ key: 'f', label: filters.filter, remove: () => setFilters((f) => ({ ...f, filter: 'all' })) }] : []),
    ...(filters.losing ? [{ key: 'l', label: 'Đang lỗ', remove: () => setFilters((f) => ({ ...f, losing: false })) }] : []),
  ];
  const n = filters.to - filters.from + 1;
  const period = filters.preset === 'custom' ? `${n} ngày (tùy chọn)` : filters.preset === 'all' ? `Toàn bộ ${n} ngày` : `${n} ngày`;
  const context = meta && isTime
    ? `${ms.length} tháng (${ms[0]?.label} → ${ms[ms.length - 1]?.label}) · đang xem ${monthLabel(sel)} · trang này không áp khoảng ngày của bộ lọc`
    : meta
    ? `${period} (${ddmm(isoAt(from, filters.from))} → ${ddmm(isoAt(from, filters.to))}) · ${vi(new Set(filtered.map((r) => r.d[SECONDARY])).size)} ${lower(labelOf(SECONDARY))} trên ${vi(new Set(filtered.map((r) => r.d[PRIMARY])).size)} ${lower(labelOf(PRIMARY))}`
    : 'Đang tải dữ liệu';

  const isSource = page === 'source';
  let body: ReactNode;
  if (load === 'loading') {
    body = <div id="row2"><div className="card empty" style={{ flex: 1 }}><span className="spin" style={{ marginBottom: 10 }} />Đang tải dữ liệu…</div></div>;
  } else if (load === 'error' || !meta) {
    body = (
      <div id="row2">
        <div className="card empty" style={{ flex: 1 }}>
          <div className="err" style={{ maxWidth: 560 }}>
            <b>Không tải được dữ liệu</b>
            {err?.error}
            {err?.hint && <div style={{ marginTop: 6 }}>{err.hint}</div>}
            <button onClick={() => void fetchData(true, want.current)}>Thử lại</button>
          </div>
        </div>
      </div>
    );
  } else if (isSource) {
    body = <SourcePage rows={rows} meta={meta} L={L} />;
  } else if (isTime && dimRows.length) {
    body = <TimePage ms={ms} rows={dimRows} L={L} param={filters.param} sel={sel} onSel={setMonth} />;
  } else if (!(isTime ? dimRows : filtered).length) {
    body = (
      <>
        <KpiBand rows={[]} prev={prev} kpiW={L.kpiW} from={from} />
        <div id="row2"><div className="card empty" style={{ flex: 1 }}><b>Không có dòng nào khớp bộ lọc</b>Mở rộng khoảng thời gian hoặc bấm “Xoá tất cả”.</div></div>
        <div id="row3" />
      </>
    );
  } else {
    const common = { rows: filtered, L, param: filters.param, grain, onGrain: setGrain, trend, onTrend: setTrend, span, from, onToggle };
    body = (
      <>
        <KpiBand rows={filtered} prev={prev} kpiW={L.kpiW} from={from} span={span} />
        {page === 'home' && <OverviewPage {...common} />}
        {page === 'primary' && <DimPage {...common} dim={PRIMARY} shareMode={shareMode} onShareMode={setShareMode} tableMode={tableMode} onTableMode={setTableMode} />}
        {page === 'secondary' && <DimPage {...common} dim={SECONDARY} shareMode={shareMode} onShareMode={setShareMode} tableMode={tableMode} onTableMode={setTableMode} />}
      </>
    );
  }

  const stageClass = [rail && 'rail', drawer && 'drawer', exporting && 'modal'].filter(Boolean).join(' ');

  return (
    <>
      <Shell className={stageClass}>
        <Sidebar items={items} page={page} onPage={go} onRail={() => setRail((v) => !v)}
                 shown={filtered.length} total={rows.length}
                 note={meta ? `${vi(items[1].badge ?? 0)} ${lower(labelOf(PRIMARY))} · ${vi(days)} ngày dữ liệu` : '—'}
                 theme={theme} onTheme={toggleTheme} onReset={reset}
                 acctOpen={pop === 'acct'} onAcct={() => setPop((p) => (p === 'acct' ? null : 'acct'))}
                 property={property} properties={meta?.properties ?? []} onProperty={switchProperty}
                 propOpen={pop === 'prop'} onPropToggle={() => setPop((p) => (p === 'prop' ? null : 'prop'))} />
        <main id="main">
          <TopBar icon={current.icon} label={current.label}
                  synced={meta ? clockOf(meta.fetchedAt) : '—'} syncing={syncing} onRefresh={() => void fetchData(false, property)}
                  alerts={al} notifOpen={pop === 'notif'} onNotif={() => setPop((p) => (p === 'notif' ? null : 'notif'))} onAlert={onAlert}
                  onExport={() => { setDrawer(false); setPop(null); setExporting(true); }}
                  onDrawer={() => { setExporting(false); setPop(null); setDrawer(true); }}
                  filterCount={filterCount(filters)} />
          <div id="body" className={isSource ? 'nokpi' : undefined}>
            <GreetBar context={context} chips={chips} onClear={reset} />
            {body}
          </div>
        </main>
        <div id="scrim" onClick={() => setDrawer(false)} />
        <FilterDrawer open={drawer} filters={filters} rows={rows} days={Math.max(1, days)} from={from}
                      onApply={(f) => { setFilters(f); setDrawer(false); }} onClose={() => setDrawer(false)} />
        <ExportModal open={exporting} filtered={filtered} rows={rows} filters={filters} days={Math.max(1, days)} from={from}
                     property={property} onClose={() => setExporting(false)} />
      </Shell>
      <Tip />
    </>
  );
}
