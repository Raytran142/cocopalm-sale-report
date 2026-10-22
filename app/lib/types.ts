/* Một dòng dữ liệu sau khi ép kiểu ở server.
   t = số ngày tính từ ngày nhỏ nhất (0..days-1): nguồn sự thật của khoảng thời gian.
   d = cột chữ (dimension), m = cột số (metric, attribute). */
export type Row = {
  t: number;
  date: string;
  d: Record<string, string>;
  m: Record<string, number>;
  e?: string; // mã booking — chỉ có ở server khi tính ngưỡng, không gửi xuống trình duyệt
};

export type Meta = {
  property: string;       // tab đang xem = tên property
  properties: string[];   // mọi tab đủ cột
  targets: Record<string, number>; // giá trị ngưỡng tính riêng cho property này (key của threshold → số)
  source: 'sheets' | 'csv';
  sheet: string;
  title: string;
  count: number;
  skipped: number;
  badDates: number;
  badNumbers: number;
  from: string;
  to: string;
  days: number;
  fetchedAt: string;
  header: string[];
  env: Record<string, boolean>;
};

export type DataOk = { rows: Row[]; meta: Meta };
export type DataErr = { error: string; hint?: string };

export type Agg = Record<string, number>;
export type Group = { k: string; n: number; v: Agg };
export type Period = { k: number | string; label: string; n?: number; v: Agg }; // n = số dòng trong kỳ

export type Grain = 'day' | 'week' | 'month';
export type Trend = 'param' | 'count'; // chart xu hướng vẽ chỉ số đang chọn hay chỉ số đếm (Số booking)
export type PageId = 'home' | 'primary' | 'secondary' | 'time' | 'source';
export type Preset = 7 | 30 | 90 | 'all' | 'custom';

export type Filters = {
  param: string;
  preset: Preset;
  from: number;
  to: number;
  primary: string[];
  secondary: string[];
  filter: string;
  losing: boolean;
};
