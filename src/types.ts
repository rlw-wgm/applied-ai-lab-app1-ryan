export interface OrderRow {
  id: string;
  quarter: string;
  region: string;
  channel: string;
  product: string;
  units: number;
  discount_pct: number; // e.g. 15 for 15% or 0.15 normalized
  revenue: number;
}

export interface RegionDriver {
  name: string;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
  deltaPct: number;
}

export interface RegionSummaryData {
  region: string;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
  deltaPct: number;
  q2Units: number;
  q3Units: number;
  deltaUnits: number;
  q2AvgDiscountPct: number;
  q3AvgDiscountPct: number;
  topProductDriver?: RegionDriver;
  topChannelDriver?: RegionDriver;
}

export interface AnalysisPayload {
  mostChangedRegion: RegionSummaryData;
  changeMetricType: 'absolute' | 'percentage';
  allRegions: RegionSummaryData[];
}

export interface RegionQuarterCell {
  revenue: number;
  units: number;
  avgDiscount: number;
  orderCount: number;
}

export interface MatrixData {
  quarters: string[];
  regions: string[];
  data: Record<string, Record<string, RegionQuarterCell>>; // region -> quarter -> cell
  regionTotals: Record<string, RegionQuarterCell>;
  quarterTotals: Record<string, RegionQuarterCell>;
  grandTotal: RegionQuarterCell;
}
