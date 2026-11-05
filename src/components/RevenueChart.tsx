import React, { useState } from 'react';
import { BarChart3, TrendingUp, HelpCircle, Layers, SplitSquareVertical } from 'lucide-react';
import { MatrixData } from '../types';
import { formatCurrency, formatCompactCurrency, formatPercent, formatUnits } from '../utils/calculations';

interface RevenueChartProps {
  matrix: MatrixData;
}

// Distinct, cohesive executive palette
const COLOR_PALETTE = [
  { bg: '#6366f1', light: '#818cf8', name: 'Indigo' },
  { bg: '#06b6d4', light: '#22d3ee', name: 'Cyan' },
  { bg: '#8b5cf6', light: '#a78bfa', name: 'Violet' },
  { bg: '#f59e0b', light: '#fbbf24', name: 'Amber' },
  { bg: '#10b981', light: '#34d399', name: 'Emerald' },
  { bg: '#ec4899', light: '#f472b6', name: 'Pink' },
];

export const RevenueChart: React.FC<RevenueChartProps> = ({ matrix }) => {
  const [chartMode, setChartMode] = useState<'by-region' | 'by-quarter' | 'q2-q3-bridge'>('by-region');
  const [hoveredBar, setHoveredBar] = useState<{
    groupKey: string;
    subKey: string;
    revenue: number;
    units: number;
    avgDiscount: number;
    x: number;
    y: number;
  } | null>(null);

  const { quarters, regions, data, grandTotal } = matrix;

  if (regions.length === 0 || quarters.length === 0) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 text-center text-slate-400">
        No data available to display chart.
      </div>
    );
  }

  // Determine groups and series depending on mode
  let groups: string[] = [];
  let series: string[] = [];
  let getBarValue = (g: string, s: string) => 0;
  let getBarCell = (g: string, s: string) => ({ revenue: 0, units: 0, avgDiscount: 0 });

  if (chartMode === 'by-region') {
    groups = regions;
    series = quarters;
    getBarValue = (r: string, q: string) => data[r]?.[q]?.revenue || 0;
    getBarCell = (r: string, q: string) => data[r]?.[q] || { revenue: 0, units: 0, avgDiscount: 0 };
  } else if (chartMode === 'by-quarter') {
    groups = quarters;
    series = regions;
    getBarValue = (q: string, r: string) => data[r]?.[q]?.revenue || 0;
    getBarCell = (q: string, r: string) => data[r]?.[q] || { revenue: 0, units: 0, avgDiscount: 0 };
  } else {
    // Q2 vs Q3 Bridge
    groups = regions;
    series = ['Q2', 'Q3'].filter(q => quarters.includes(q));
    getBarValue = (r: string, q: string) => data[r]?.[q]?.revenue || 0;
    getBarCell = (r: string, q: string) => data[r]?.[q] || { revenue: 0, units: 0, avgDiscount: 0 };
  }

  // Find max value for Y-axis scaling
  let maxRevenue = 0;
  groups.forEach(g => {
    series.forEach(s => {
      const val = getBarValue(g, s);
      if (val > maxRevenue) maxRevenue = val;
    });
  });

  // Round up max to nice upper bound
  const yUpper = Math.max(1000, Math.ceil((maxRevenue * 1.15) / 500000) * 500000);
  const yTicks = [0, yUpper * 0.25, yUpper * 0.5, yUpper * 0.75, yUpper];

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 360;
  const paddingLeft = 75;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 55;

  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  const groupWidth = chartInnerWidth / groups.length;
  const barGap = 4;
  const totalBarWidth = groupWidth * 0.75;
  const singleBarWidth = Math.max(6, (totalBarWidth - (series.length - 1) * barGap) / series.length);

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur">
      {/* Chart Title and Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Total Revenue by Region & Quarter
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare quarterly revenue distribution across global sales regions
          </p>
        </div>

        {/* View Mode Segmented Controls */}
        <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setChartMode('by-region')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              chartMode === 'by-region'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            By Region
          </button>
          <button
            type="button"
            onClick={() => setChartMode('by-quarter')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              chartMode === 'by-quarter'
                ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            By Quarter
          </button>
          {quarters.includes('Q2') && quarters.includes('Q3') && (
            <button
              type="button"
              onClick={() => setChartMode('q2-q3-bridge')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                chartMode === 'q2-q3-bridge'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Q2 vs Q3 Focus
            </button>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[620px] select-none"
          onMouseLeave={() => setHoveredBar(null)}
        >
          {/* Horizontal Gridlines & Y-Axis labels */}
          {yTicks.map((tickVal, idx) => {
            const y = paddingTop + chartInnerHeight - (tickVal / yUpper) * chartInnerHeight;
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray={idx === 0 ? 'none' : '3 3'}
                  strokeWidth={idx === 0 ? '1.5' : '1'}
                  opacity={idx === 0 ? 0.9 : 0.4}
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#94a3b8"
                  className="font-mono"
                >
                  {formatCompactCurrency(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Bar Groups */}
          {groups.map((groupKey, gIdx) => {
            const groupXCenter = paddingLeft + gIdx * groupWidth + groupWidth / 2;
            const groupStartX = groupXCenter - totalBarWidth / 2;

            return (
              <g key={groupKey}>
                {series.map((seriesKey, sIdx) => {
                  const val = getBarValue(groupKey, seriesKey);
                  const cell = getBarCell(groupKey, seriesKey);
                  const barH = (val / yUpper) * chartInnerHeight;
                  const x = groupStartX + sIdx * (singleBarWidth + barGap);
                  const y = paddingTop + chartInnerHeight - barH;

                  const color = COLOR_PALETTE[sIdx % COLOR_PALETTE.length];
                  const isHovered =
                    hoveredBar?.groupKey === groupKey && hoveredBar?.subKey === seriesKey;

                  return (
                    <g key={seriesKey}>
                      {/* Bar Rectangle */}
                      <rect
                        x={x}
                        y={val > 0 ? y : paddingTop + chartInnerHeight - 2}
                        width={singleBarWidth}
                        height={val > 0 ? Math.max(2, barH) : 2}
                        rx={3}
                        fill={color.bg}
                        className="transition-all duration-200 cursor-pointer"
                        opacity={isHovered ? 1 : hoveredBar ? 0.5 : 0.9}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredBar({
                            groupKey,
                            subKey: seriesKey,
                            revenue: val,
                            units: cell.units,
                            avgDiscount: cell.avgDiscount,
                            x: x + singleBarWidth / 2,
                            y: y,
                          });
                        }}
                      />
                    </g>
                  );
                })}

                {/* X-Axis Group Label */}
                <text
                  x={groupXCenter}
                  y={svgHeight - paddingBottom + 22}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#cbd5e1"
                >
                  {groupKey}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredBar && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 bg-slate-950/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs backdrop-blur min-w-[170px]"
            style={{
              left: `${(hoveredBar.x / svgWidth) * 100}%`,
              top: `${(hoveredBar.y / svgHeight) * 100}%`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="font-bold text-white">
                {hoveredBar.groupKey}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 font-mono">
                {hoveredBar.subKey}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Revenue:</span>
                <span className="font-mono font-bold text-white">
                  {formatCurrency(hoveredBar.revenue)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Units:</span>
                <span className="font-mono text-slate-200">
                  {formatUnits(hoveredBar.units)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400">Avg Discount:</span>
                <span className="font-mono text-cyan-300">
                  {hoveredBar.avgDiscount.toFixed(1)}%
                </span>
              </div>
              {grandTotal.revenue > 0 && (
                <div className="flex justify-between items-center text-slate-400 text-[10px] pt-1 border-t border-slate-800/80">
                  <span>Share of Total:</span>
                  <span className="font-mono text-slate-300">
                    {formatPercent((hoveredBar.revenue / grandTotal.revenue) * 100, false)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-800/80 text-xs">
        <span className="text-slate-400 font-medium">Series:</span>
        {series.map((s, idx) => {
          const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
          return (
            <div key={s} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: color.bg }}
              />
              <span className="text-slate-300 font-medium">{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
