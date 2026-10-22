/* Cấu hình dashboard — nạp từ lib/dashboard.config.json.
   File JSON đó là bản chép của docs/1-spec/dashboard.json (skill dashboard-design viết, bạn duyệt).
   Muốn đổi KPI, ngưỡng, nhãn: sửa docs/1-spec/dashboard.json rồi chạy lại scaffold. Đừng sửa số ở đây. */
import raw from './dashboard.config.json';
import type { IconName } from './icons';

export type Format = 'money' | 'int' | 'dec' | 'pct' | 'x';
export type Role = 'DATE' | 'PRIMARY_DIM' | 'SECONDARY_DIM' | 'METRIC' | 'ATTRIBUTE' | 'IGNORE';
export type Op = '<' | '<=' | '>' | '>=';

export type Column = {
  name: string;
  label: string;
  type: 'date' | 'text' | 'number';
  role: Role;
  agg?: 'sum' | 'last' | 'avg' | 'max';
  entity?: string;
  format?: Format;
  icons?: Record<string, IconName>;
  /* Cột SUY RA, không có trong sheet: 1 ở dòng đầu tiên của mỗi giá trị khác nhau của cột này, 0 ở các dòng sau.
     Cộng lại = số giá trị khác nhau (vd. số booking theo unique_id khi một booking nhiều phòng có nhiều dòng). */
  countDistinct?: string;
  /* Cột số lặp NGUYÊN giá trị trên mọi dòng của một thực thể (vd. booking_total trên mỗi dòng phòng của
     một booking): chỉ giữ giá trị ở dòng đầu của mỗi giá trị khác nhau của cột này, các dòng sau = 0. */
  onePerEntity?: string;
  /* Cột số tính là 0 ở dòng mà cột `column` có một trong các giá trị `values`
     (vd. room_total, room_night của booking đã huỷ). */
  zeroWhen?: { column: string; values: string[] };
  /* Đi kèm countDistinct: chỉ đếm giá trị ở dòng mà cột `column` có một trong các giá trị `values`
     (vd. Booking huỷ = số unique_id có status = cancelled). */
  countWhen?: { column: string; values: string[] };
};

export type Metric = {
  key: string;
  label: string;
  format: Format;
  better: 'higher' | 'lower';
  col?: string;
  num?: string[];
  den?: string[];
  scale?: number;
  icon?: IconName;
  window?: 'filtered' | 'all';
};

export type Threshold = {
  key: string;
  label: string;
  kind: 'loss' | 'target' | 'unit_cost' | 'resource';
  metric: string;
  op: Op;
  value: number;
  alert?: string;
  rule?: string; // p75 · p25 · median_x1.25 ⇒ tính lại theo từng property (aggregate.thresholdTargets)
  byProperty?: Record<string, number>; // con số chốt tay cho từng property, thắng rule
};

export type DashboardConfig = {
  app: {
    name: string;
    nameTemplate?: string; // vd. "{property} Sale Dashboard"; không có thì dùng name
    tagline: string;
    domain: string;
    user?: { name: string; first: string; role?: string; email?: string };
  };
  source: { type: 'sheets' | 'csv'; sheet?: string; title?: string; csv?: string };
  columns: Column[];
  metrics: Metric[];
  kpis: string[];
  params: string[];
  defaultParam: string;
  donutMetric: string;
  matrixMetrics: string[];
  tableMetrics: string[];
  pages: {
    primary: string;
    secondary: string;
    filter?: string | null;
    primaryIcon?: IconName;
    secondaryIcon?: IconName;
  };
  thresholds: Threshold[];
  alerts?: { dim?: string };
  defaultDays: number;
  export?: { separator?: ',' | ';'; filename?: string };
};

export const CFG = raw as unknown as DashboardConfig;

export const COLUMNS = CFG.columns.filter((c) => c.role !== 'IGNORE');
export const DATE_COL = (COLUMNS.find((c) => c.role === 'DATE') ?? COLUMNS[0]).name;
export const PRIMARY = CFG.pages.primary;
export const SECONDARY = CFG.pages.secondary;
export const FILTER_DIM = CFG.pages.filter || null;
export const ALERT_DIM = CFG.alerts?.dim || SECONDARY;

export const colOf = (name: string): Column | undefined => COLUMNS.find((c) => c.name === name);
export const labelOf = (name: string): string => colOf(name)?.label ?? name;
export const lower = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);
export const iconOf = (dim: string, value: string): IconName | undefined => colOf(dim)?.icons?.[value];

export const METRICS: Record<string, Metric> = Object.fromEntries(CFG.metrics.map((m) => [m.key, m]));
export const metric = (key: string): Metric =>
  METRICS[key] ?? { key, label: key, format: 'dec', better: 'higher', col: key };

/* Chỉ số cộng được (tổng của một cột METRIC) mới được vẽ thành "tỷ trọng". Tỷ trọng ROAS là con số vô nghĩa. */
export function isAdditive(key: string): boolean {
  const m = METRICS[key];
  if (!m?.col) return false;
  const c = colOf(m.col);
  return c?.role === 'METRIC' && (c.agg ?? 'sum') === 'sum';
}

/* Chỉ số đếm (Số booking): metric gốc trên cột countDistinct. Chart xu hướng cho chọn giữa chỉ số đang xem và chỉ số này. */
export const COUNT_METRIC: string | null =
  CFG.metrics.find((m) => m.col && CFG.columns.some((c) => c.name === m.col && c.countDistinct && !c.countWhen))?.key ?? null;

/* Tên dashboard theo property đang xem. */
export const appName = (property?: string | null): string =>
  property && CFG.app.nameTemplate ? CFG.app.nameTemplate.replace('{property}', property) : CFG.app.name;

/* Đổi property ⇒ nạp giá trị ngưỡng của property đó vào CFG.thresholds (server tính sẵn ở meta.targets).
   CFG là cấu hình dùng chung của cả trang; mọi chỗ đọc t.value (KPI, bảng, cảnh báo) thấy ngay số mới
   ở lần vẽ kế tiếp — page.tsx gọi hàm này TRƯỚC setRows. Ngưỡng không có trong targets giữ số của dashboard.json. */
const BASE_VALUES = new Map(CFG.thresholds.map((t) => [t.key, t.value]));
export function applyTargets(targets: Record<string, number>): void {
  for (const t of CFG.thresholds) t.value = targets[t.key] ?? BASE_VALUES.get(t.key) ?? t.value;
}

export const LOSS = CFG.thresholds.find((t) => t.kind === 'loss') ?? null;
export const thresholdsOf = (key: string): Threshold[] => CFG.thresholds.filter((t) => t.metric === key);

export function meets(v: number | undefined, t: Threshold): boolean {
  if (v === undefined || !Number.isFinite(v)) return false;
  if (t.op === '<') return v < t.value;
  if (t.op === '<=') return v <= t.value;
  if (t.op === '>') return v > t.value;
  return v >= t.value;
}
