import React, { useState } from 'react';
import { Table, ArrowUpDown, ChevronDown, ChevronRight, Download, TrendingUp, TrendingDown, Layers, Filter } from 'lucide-react';
import { MatrixData, OrderRow } from '../types';
import { formatCurrency, formatPercent, formatUnits } from '../utils/calculations';

interface RevenueTableProps {
  matrix: MatrixData;
  rawRows: OrderRow[];
}

type SortField = 'region' | 'totalRevenue' | 'q2' | 'q3' | 'deltaDollar' | 'deltaPct';

export const RevenueTable: React.FC<RevenueTableProps> = ({ matrix, rawRows }) => {
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({});

  const { quarters, regions, data, regionTotals, quarterTotals, grandTotal } = matrix;

  const hasQ2 = quarters.includes('Q2');
  const hasQ3 = quarters.includes('Q3');

  const toggleRegion = (reg: string) => {
    setExpandedRegions(prev => ({ ...prev, [reg]: !prev[reg] }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for numbers
    }
  };

  // Sort regions
  const sortedRegions = [...regions].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    if (sortField === 'region') {
      return sortAsc ? a.localeCompare(b) : b.localeCompare(a);
    }

    if (sortField === 'totalRevenue') {
      valA = regionTotals[a]?.revenue || 0;
      valB = regionTotals[b]?.revenue || 0;
    } else if (sortField === 'q2') {
      valA = data[a]?.['Q2']?.revenue || 0;
      valB = data[b]?.['Q2']?.revenue || 0;
    } else if (sortField === 'q3') {
      valA = data[a]?.['Q3']?.revenue || 0;
      valB = data[b]?.['Q3']?.revenue || 0;
    } else if (sortField === 'deltaDollar') {
      valA = (data[a]?.['Q3']?.revenue || 0) - (data[a]?.['Q2']?.revenue || 0);
      valB = (data[b]?.['Q3']?.revenue || 0) - (data[b]?.['Q2']?.revenue || 0);
    } else if (sortField === 'deltaPct') {
      const q2A = data[a]?.['Q2']?.revenue || 0;
      const q3A = data[a]?.['Q3']?.revenue || 0;
      valA = q2A > 0 ? ((q3A - q2A) / q2A) * 100 : 0;

      const q2B = data[b]?.['Q2']?.revenue || 0;
      const q3B = data[b]?.['Q3']?.revenue || 0;
      valB = q2B > 0 ? ((q3B - q2B) / q2B) * 100 : 0;
    }

    return sortAsc ? valA - valB : valB - valA;
  });

  const exportTableCSV = () => {
    const headers = ['Region', ...quarters, 'Total Revenue'];
    if (hasQ2 && hasQ3) {
      headers.push('Q2 -> Q3 Delta ($)', 'Q2 -> Q3 Delta (%)');
    }

    const lines: string[] = [headers.join(',')];

    sortedRegions.forEach(reg => {
      const rowVals = [
        `"${reg}"`,
        ...quarters.map(q => (data[reg]?.[q]?.revenue || 0).toString()),
        (regionTotals[reg]?.revenue || 0).toString(),
      ];
      if (hasQ2 && hasQ3) {
        const q2 = data[reg]?.['Q2']?.revenue || 0;
        const q3 = data[reg]?.['Q3']?.revenue || 0;
        const delta = q3 - q2;
        const pct = q2 > 0 ? ((delta / q2) * 100).toFixed(2) : '0';
        rowVals.push(delta.toString(), `${pct}%`);
      }
      lines.push(rowVals.join(','));
    });

    // Grand total
    const totVals = [
      '"Grand Total"',
      ...quarters.map(q => (quarterTotals[q]?.revenue || 0).toString()),
      grandTotal.revenue.toString(),
    ];
    if (hasQ2 && hasQ3) {
      const q2Tot = quarterTotals['Q2']?.revenue || 0;
      const q3Tot = quarterTotals['Q3']?.revenue || 0;
      const deltaTot = q3Tot - q2Tot;
      const pctTot = q2Tot > 0 ? ((deltaTot / q2Tot) * 100).toFixed(2) : '0';
      totVals.push(deltaTot.toString(), `${pctTot}%`);
    }
    lines.push(totVals.join(','));

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales_revenue_by_region_and_quarter.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Revenue Matrix by Region & Quarter
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any column header to sort. Click any region row to drill down into Product and Channel drivers.
          </p>
        </div>

        <button
          onClick={exportTableCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export Matrix CSV</span>
        </button>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/90 text-slate-300 font-semibold border-b border-slate-800 select-none">
              <th
                onClick={() => handleSort('region')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Region</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              {quarters.map((q) => (
                <th key={q} className="py-3 px-4 text-right">
                  <span className="font-mono text-cyan-300">{q} Revenue</span>
                </th>
              ))}

              <th
                onClick={() => handleSort('totalRevenue')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Revenue</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              {hasQ2 && hasQ3 && (
                <>
                  <th
                    onClick={() => handleSort('deltaDollar')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors bg-indigo-950/20"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Q2 → Q3 Shift ($)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('deltaPct')}
                    className="py-3 px-4 text-right cursor-pointer hover:text-white transition-colors bg-indigo-950/20"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Q2 → Q3 Shift (%)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-mono">
            {sortedRegions.map((reg) => {
              const regTot = regionTotals[reg] || { revenue: 0, units: 0, avgDiscount: 0 };
              const q2Rev = data[reg]?.['Q2']?.revenue || 0;
              const q3Rev = data[reg]?.['Q3']?.revenue || 0;
              const deltaDollar = q3Rev - q2Rev;
              const deltaPct = q2Rev > 0 ? (deltaDollar / q2Rev) * 100 : 0;
              const isExpanded = !!expandedRegions[reg];

              // Regional product and channel drilldowns
              const regOrders = rawRows.filter(r => r.region === reg);
              const productMap: Record<string, { q2: number; q3: number; total: number }> = {};
              regOrders.forEach(o => {
                if (!productMap[o.product]) productMap[o.product] = { q2: 0, q3: 0, total: 0 };
                productMap[o.product].total += o.revenue;
                if (o.quarter.toUpperCase() === 'Q2') productMap[o.product].q2 += o.revenue;
                if (o.quarter.toUpperCase() === 'Q3') productMap[o.product].q3 += o.revenue;
              });

              return (
                <React.Fragment key={reg}>
                  <tr
                    onClick={() => toggleRegion(reg)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-100 flex items-center gap-2">
                      <span className="text-slate-500 group-hover:text-indigo-400 transition-colors">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                      <span>{reg}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({formatUnits(regTot.units)} units)
                      </span>
                    </td>

                    {quarters.map((q) => {
                      const cell = data[reg]?.[q] || { revenue: 0, units: 0, avgDiscount: 0 };
                      return (
                        <td key={q} className="py-3.5 px-4 text-right text-slate-300">
                          {formatCurrency(cell.revenue)}
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      {formatCurrency(regTot.revenue)}
                    </td>

                    {hasQ2 && hasQ3 && (
                      <>
                        <td
                          className={`py-3.5 px-4 text-right font-bold ${
                            deltaDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          } bg-indigo-950/10`}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {deltaDollar >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-rose-400" />
                            )}
                            <span>{formatCurrency(deltaDollar)}</span>
                          </div>
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-bold ${
                            deltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          } bg-indigo-950/10`}
                        >
                          {formatPercent(deltaPct)}
                        </td>
                      </>
                    )}
                  </tr>

                  {/* Expandable Drilldown for Products in Region */}
                  {isExpanded && (
                    <tr className="bg-slate-950/80 font-sans">
                      <td colSpan={quarters.length + (hasQ2 && hasQ3 ? 3 : 2)} className="py-3 px-6">
                        <div className="text-xs text-slate-300 space-y-2">
                          <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                            <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5" />
                              Product Performance Breakdown in {reg}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Direct drivers of quarterly variance
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 font-mono">
                            {Object.entries(productMap).map(([prod, pData]) => {
                              const pDelta = pData.q3 - pData.q2;
                              const pPct = pData.q2 > 0 ? (pDelta / pData.q2) * 100 : 0;
                              return (
                                <div
                                  key={prod}
                                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col justify-between"
                                >
                                  <span className="font-sans font-medium text-slate-200 truncate">
                                    {prod}
                                  </span>
                                  <div className="flex justify-between items-center text-[11px] mt-1 text-slate-400">
                                    <span>Q2: {formatCurrency(pData.q2)}</span>
                                    <span>Q3: {formatCurrency(pData.q3)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[11px] mt-0.5 pt-1 border-t border-slate-800">
                                    <span className="text-slate-500">Delta:</span>
                                    <span
                                      className={`font-semibold ${
                                        pDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                      }`}
                                    >
                                      {formatCurrency(pDelta)} ({formatPercent(pPct)})
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Grand Total Row */}
          <tfoot>
            <tr className="bg-slate-950 font-mono font-bold text-white border-t-2 border-slate-700">
              <td className="py-4 px-4 font-sans text-slate-200">
                Grand Total ({regions.length} Regions)
              </td>

              {quarters.map((q) => {
                const qTot = quarterTotals[q] || { revenue: 0, units: 0, avgDiscount: 0 };
                return (
                  <td key={q} className="py-4 px-4 text-right text-cyan-300">
                    {formatCurrency(qTot.revenue)}
                  </td>
                );
              })}

              <td className="py-4 px-4 text-right text-indigo-400 text-sm">
                {formatCurrency(grandTotal.revenue)}
              </td>

              {hasQ2 && hasQ3 && (
                <>
                  {(() => {
                    const q2Tot = quarterTotals['Q2']?.revenue || 0;
                    const q3Tot = quarterTotals['Q3']?.revenue || 0;
                    const deltaTot = q3Tot - q2Tot;
                    const pctTot = q2Tot > 0 ? (deltaTot / q2Tot) * 100 : 0;
                    return (
                      <>
                        <td
                          className={`py-4 px-4 text-right ${
                            deltaTot >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          } bg-indigo-950/20`}
                        >
                          {formatCurrency(deltaTot)}
                        </td>
                        <td
                          className={`py-4 px-4 text-right ${
                            pctTot >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          } bg-indigo-950/20`}
                        >
                          {formatPercent(pctTot)}
                        </td>
                      </>
                    );
                  })()}
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
