import { OrderRow, MatrixData, RegionQuarterCell, RegionSummaryData, RegionDriver, AnalysisPayload } from '../types';

export function calculateMatrix(rows: OrderRow[]): MatrixData {
  const quarterSet = new Set<string>();
  const regionSet = new Set<string>();

  rows.forEach(r => {
    if (r.quarter) quarterSet.add(r.quarter);
    if (r.region) regionSet.add(r.region);
  });

  // Sort quarters logically: Q1, Q2, Q3, Q4 or alphabetic
  const quarters = Array.from(quarterSet).sort((a, b) => {
    const qOrder: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
    if (qOrder[a] && qOrder[b]) return qOrder[a] - qOrder[b];
    return a.localeCompare(b);
  });

  const regions = Array.from(regionSet).sort();

  const data: Record<string, Record<string, RegionQuarterCell>> = {};
  const regionTotals: Record<string, RegionQuarterCell> = {};
  const quarterTotals: Record<string, RegionQuarterCell> = {};
  const grandTotal: RegionQuarterCell = { revenue: 0, units: 0, avgDiscount: 0, orderCount: 0 };

  // Initialize
  regions.forEach(reg => {
    data[reg] = {};
    regionTotals[reg] = { revenue: 0, units: 0, avgDiscount: 0, orderCount: 0 };
    quarters.forEach(q => {
      data[reg][q] = { revenue: 0, units: 0, avgDiscount: 0, orderCount: 0 };
    });
  });

  quarters.forEach(q => {
    quarterTotals[q] = { revenue: 0, units: 0, avgDiscount: 0, orderCount: 0 };
  });

  // Intermediate accumulator for discount weighting
  const discountWeightSum: Record<string, number> = {};

  rows.forEach(r => {
    const reg = r.region;
    const q = r.quarter;
    if (!data[reg] || !data[reg][q]) return;

    const cell = data[reg][q];
    cell.revenue += r.revenue;
    cell.units += r.units;
    cell.avgDiscount += r.discount_pct * (r.revenue || 1); // weighted sum
    cell.orderCount += 1;

    // Region total
    const regTot = regionTotals[reg];
    regTot.revenue += r.revenue;
    regTot.units += r.units;
    regTot.avgDiscount += r.discount_pct * (r.revenue || 1);
    regTot.orderCount += 1;

    // Quarter total
    const qTot = quarterTotals[q];
    qTot.revenue += r.revenue;
    qTot.units += r.units;
    qTot.avgDiscount += r.discount_pct * (r.revenue || 1);
    qTot.orderCount += 1;

    // Grand total
    grandTotal.revenue += r.revenue;
    grandTotal.units += r.units;
    grandTotal.avgDiscount += r.discount_pct * (r.revenue || 1);
    grandTotal.orderCount += 1;
  });

  // Finalize weighted averages
  regions.forEach(reg => {
    quarters.forEach(q => {
      const cell = data[reg][q];
      cell.avgDiscount = cell.revenue > 0 ? cell.avgDiscount / cell.revenue : 0;
    });
    const regTot = regionTotals[reg];
    regTot.avgDiscount = regTot.revenue > 0 ? regTot.avgDiscount / regTot.revenue : 0;
  });

  quarters.forEach(q => {
    const qTot = quarterTotals[q];
    qTot.avgDiscount = qTot.revenue > 0 ? qTot.avgDiscount / qTot.revenue : 0;
  });

  grandTotal.avgDiscount = grandTotal.revenue > 0 ? grandTotal.avgDiscount / grandTotal.revenue : 0;

  return {
    quarters,
    regions,
    data,
    regionTotals,
    quarterTotals,
    grandTotal,
  };
}

export function calculateQ2Q3Analysis(rows: OrderRow[]): {
  hasQ2: boolean;
  hasQ3: boolean;
  regionsAnalysis: RegionSummaryData[];
  mostChangedByAbsolute: RegionSummaryData | null;
  mostChangedByPercentage: RegionSummaryData | null;
  grandQ2Revenue: number;
  grandQ3Revenue: number;
  grandDeltaRevenue: number;
  grandDeltaPct: number;
} {
  const hasQ2 = rows.some(r => r.quarter.toUpperCase() === 'Q2');
  const hasQ3 = rows.some(r => r.quarter.toUpperCase() === 'Q3');

  if (!hasQ2 || !hasQ3) {
    return {
      hasQ2,
      hasQ3,
      regionsAnalysis: [],
      mostChangedByAbsolute: null,
      mostChangedByPercentage: null,
      grandQ2Revenue: 0,
      grandQ3Revenue: 0,
      grandDeltaRevenue: 0,
      grandDeltaPct: 0,
    };
  }

  const regionSet = new Set<string>();
  rows.forEach(r => {
    if (r.quarter.toUpperCase() === 'Q2' || r.quarter.toUpperCase() === 'Q3') {
      regionSet.add(r.region);
    }
  });

  const regionsAnalysis: RegionSummaryData[] = [];
  let grandQ2Revenue = 0;
  let grandQ3Revenue = 0;

  Array.from(regionSet).sort().forEach(reg => {
    const q2Rows = rows.filter(r => r.region === reg && r.quarter.toUpperCase() === 'Q2');
    const q3Rows = rows.filter(r => r.region === reg && r.quarter.toUpperCase() === 'Q3');

    const q2Revenue = q2Rows.reduce((sum, r) => sum + r.revenue, 0);
    const q3Revenue = q3Rows.reduce((sum, r) => sum + r.revenue, 0);
    const deltaRevenue = q3Revenue - q2Revenue;
    const deltaPct = q2Revenue > 0 ? ((q3Revenue - q2Revenue) / q2Revenue) * 100 : (q3Revenue > 0 ? 100 : 0);

    const q2Units = q2Rows.reduce((sum, r) => sum + r.units, 0);
    const q3Units = q3Rows.reduce((sum, r) => sum + r.units, 0);
    const deltaUnits = q3Units - q2Units;

    const q2WeightedDisc = q2Rows.reduce((sum, r) => sum + r.discount_pct * r.revenue, 0);
    const q3WeightedDisc = q3Rows.reduce((sum, r) => sum + r.discount_pct * r.revenue, 0);
    const q2AvgDiscountPct = q2Revenue > 0 ? q2WeightedDisc / q2Revenue : 0;
    const q3AvgDiscountPct = q3Revenue > 0 ? q3WeightedDisc / q3Revenue : 0;

    grandQ2Revenue += q2Revenue;
    grandQ3Revenue += q3Revenue;

    // Calculate product drivers within this region
    const productSet = new Set<string>();
    [...q2Rows, ...q3Rows].forEach(r => productSet.add(r.product));
    
    let topProductDriver: RegionDriver | undefined = undefined;
    let maxProductDeltaAbs = -1;

    Array.from(productSet).forEach(prod => {
      const pQ2 = q2Rows.filter(r => r.product === prod).reduce((sum, r) => sum + r.revenue, 0);
      const pQ3 = q3Rows.filter(r => r.product === prod).reduce((sum, r) => sum + r.revenue, 0);
      const pDelta = pQ3 - pQ2;
      const pDeltaPct = pQ2 > 0 ? ((pQ3 - pQ2) / pQ2) * 100 : (pQ3 > 0 ? 100 : 0);
      const absDelta = Math.abs(pDelta);

      if (absDelta > maxProductDeltaAbs) {
        maxProductDeltaAbs = absDelta;
        topProductDriver = {
          name: prod,
          q2Revenue: pQ2,
          q3Revenue: pQ3,
          deltaRevenue: pDelta,
          deltaPct: pDeltaPct,
        };
      }
    });

    // Calculate channel drivers within this region
    const channelSet = new Set<string>();
    [...q2Rows, ...q3Rows].forEach(r => channelSet.add(r.channel));

    let topChannelDriver: RegionDriver | undefined = undefined;
    let maxChannelDeltaAbs = -1;

    Array.from(channelSet).forEach(ch => {
      const cQ2 = q2Rows.filter(r => r.channel === ch).reduce((sum, r) => sum + r.revenue, 0);
      const cQ3 = q3Rows.filter(r => r.channel === ch).reduce((sum, r) => sum + r.revenue, 0);
      const cDelta = cQ3 - cQ2;
      const cDeltaPct = cQ2 > 0 ? ((cQ3 - cQ2) / cQ2) * 100 : (cQ3 > 0 ? 100 : 0);
      const absDelta = Math.abs(cDelta);

      if (absDelta > maxChannelDeltaAbs) {
        maxChannelDeltaAbs = absDelta;
        topChannelDriver = {
          name: ch,
          q2Revenue: cQ2,
          q3Revenue: cQ3,
          deltaRevenue: cDelta,
          deltaPct: cDeltaPct,
        };
      }
    });

    regionsAnalysis.push({
      region: reg,
      q2Revenue,
      q3Revenue,
      deltaRevenue,
      deltaPct,
      q2Units,
      q3Units,
      deltaUnits,
      q2AvgDiscountPct,
      q3AvgDiscountPct,
      topProductDriver,
      topChannelDriver,
    });
  });

  // Sort by largest absolute revenue change
  const sortedByAbsolute = [...regionsAnalysis].sort(
    (a, b) => Math.abs(b.deltaRevenue) - Math.abs(a.deltaRevenue)
  );

  // Sort by largest percentage change
  const sortedByPct = [...regionsAnalysis].sort(
    (a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct)
  );

  const grandDeltaRevenue = grandQ3Revenue - grandQ2Revenue;
  const grandDeltaPct = grandQ2Revenue > 0 ? (grandDeltaRevenue / grandQ2Revenue) * 100 : 0;

  return {
    hasQ2,
    hasQ3,
    regionsAnalysis,
    mostChangedByAbsolute: sortedByAbsolute[0] || null,
    mostChangedByPercentage: sortedByPct[0] || null,
    grandQ2Revenue,
    grandQ3Revenue,
    grandDeltaRevenue,
    grandDeltaPct,
  };
}

export function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatCompactCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatPercent(num: number, includeSign = true): string {
  const sign = includeSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(1)}%`;
}

export function formatUnits(num: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
}
