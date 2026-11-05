import { OrderRow } from '../types';

export interface ParseResult {
  success: boolean;
  rows: OrderRow[];
  headers: string[];
  totalRecords: number;
  warnings: string[];
  error?: string;
}

export function parseCSV(csvText: string): ParseResult {
  const warnings: string[] = [];
  if (!csvText || !csvText.trim()) {
    return {
      success: false,
      rows: [],
      headers: [],
      totalRecords: 0,
      warnings: [],
      error: 'CSV file is empty.',
    };
  }

  // Tokenize CSV considering quotes
  const lines = parseCSVLines(csvText);
  if (lines.length === 0) {
    return {
      success: false,
      rows: [],
      headers: [],
      totalRecords: 0,
      warnings: [],
      error: 'No valid data rows found in CSV.',
    };
  }

  const rawHeaders = lines[0].map(h => h.trim());
  const headerMap = findColumnIndexes(rawHeaders);

  const missing: string[] = [];
  if (headerMap.quarter === -1) missing.push('quarter');
  if (headerMap.region === -1) missing.push('region');
  if (headerMap.channel === -1) missing.push('channel');
  if (headerMap.product === -1) missing.push('product');
  if (headerMap.units === -1) missing.push('units');
  if (headerMap.discount_pct === -1) missing.push('discount_pct');
  if (headerMap.revenue === -1) missing.push('revenue');

  if (missing.length > 0) {
    return {
      success: false,
      rows: [],
      headers: rawHeaders,
      totalRecords: 0,
      warnings: [],
      error: `Missing required column(s): ${missing.join(', ')}. Expected: quarter, region, channel, product, units, discount_pct, revenue. Found: ${rawHeaders.join(', ') || 'none'}`,
    };
  }

  const rows: OrderRow[] = [];
  let skippedRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i];
    // Skip empty lines
    if (cols.length === 0 || (cols.length === 1 && !cols[0].trim())) {
      continue;
    }

    const quarter = cleanString(cols[headerMap.quarter]);
    const region = cleanString(cols[headerMap.region]);
    const channel = cleanString(cols[headerMap.channel]);
    const product = cleanString(cols[headerMap.product]);
    const units = cleanNumber(cols[headerMap.units]);
    let discountPct = cleanNumber(cols[headerMap.discount_pct]);
    const revenue = cleanNumber(cols[headerMap.revenue]);

    // Normalize discount_pct: if values are decimals like 0.15, leave as 15 or handle consistently
    // If user provided 0.15, convert to 15.0% for display and stats
    if (discountPct > 0 && discountPct <= 1.0) {
      discountPct = discountPct * 100;
    }

    if (!quarter || !region) {
      skippedRows++;
      continue;
    }

    rows.push({
      id: `row-${i}`,
      quarter: normalizeQuarter(quarter),
      region,
      channel: channel || 'General',
      product: product || 'Standard Product',
      units: isNaN(units) ? 0 : units,
      discount_pct: isNaN(discountPct) ? 0 : discountPct,
      revenue: isNaN(revenue) ? 0 : revenue,
    });
  }

  if (skippedRows > 0) {
    warnings.push(`Skipped ${skippedRows} row(s) due to missing quarter or region.`);
  }

  return {
    success: rows.length > 0,
    rows,
    headers: rawHeaders,
    totalRecords: rows.length,
    warnings,
    error: rows.length === 0 ? 'No valid data rows could be extracted.' : undefined,
  };
}

function normalizeQuarter(q: string): string {
  const trimmed = q.trim();
  // Standardize common patterns: "2024-Q2" -> "Q2", "q2" -> "Q2", "quarter 2" -> "Q2"
  const match = trimmed.match(/(?:quarter|qtr|q)\s*([1-4])/i);
  if (match) {
    return `Q${match[1]}`;
  }
  return trimmed;
}

function cleanString(val: string | undefined): string {
  if (!val) return '';
  return val.trim();
}

function cleanNumber(val: string | undefined): number {
  if (!val) return 0;
  // Strip currency signs, percentage signs, commas, spaces
  const sanitized = val.replace(/[$€£%, ]/g, '').trim();
  const num = parseFloat(sanitized);
  return isNaN(num) ? 0 : num;
}

function findColumnIndexes(headers: string[]) {
  const norm = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  const findMatch = (candidates: string[]): number => {
    for (const cand of candidates) {
      const idx = norm.indexOf(cand);
      if (idx !== -1) return idx;
    }
    // Partial inclusion match
    for (const cand of candidates) {
      const idx = norm.findIndex(h => h.includes(cand));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  return {
    quarter: findMatch(['quarter', 'qtr', 'quarterid', 'q']),
    region: findMatch(['region', 'territory', 'market', 'geo', 'location']),
    channel: findMatch(['channel', 'saleschannel', 'distribution', 'type']),
    product: findMatch(['product', 'item', 'sku', 'productname', 'service']),
    units: findMatch(['units', 'volume', 'quantity', 'qty', 'unitsold']),
    discount_pct: findMatch(['discountpct', 'discountpercent', 'discount', 'discountpercentage', 'discountrate', 'disc']),
    revenue: findMatch(['revenue', 'sales', 'totalrevenue', 'amount', 'salesamount', 'turnover']),
  };
}

// Robust CSV Line & Quote Parser
function parseCSVLines(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.length > 0 && currentRow.some(c => c.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(c => c.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}
