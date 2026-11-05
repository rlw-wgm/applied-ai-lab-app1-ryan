import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { CsvUploader } from './components/CsvUploader';
import { AiSummaryCard } from './components/AiSummaryCard';
import { RevenueChart } from './components/RevenueChart';
import { RevenueTable } from './components/RevenueTable';
import { RawDataDrawer } from './components/RawDataDrawer';
import { OrderRow } from './types';
import { getSampleRows } from './utils/sampleData';
import { calculateMatrix, calculateQ2Q3Analysis, formatCurrency, formatUnits } from './utils/calculations';
import { DollarSign, Package, Percent, Globe, Upload, FileSpreadsheet, Sparkles } from 'lucide-react';

export default function App() {
  // Initialize with sample dataset so the user immediately sees the rich dashboard
  const [orders, setOrders] = useState<OrderRow[]>(() => getSampleRows());
  const [activeFilename, setActiveFilename] = useState<string>('Sample Sales Dataset');
  const [showUploaderBar, setShowUploaderBar] = useState<boolean>(false);

  const handleDataLoaded = (newRows: OrderRow[], filename?: string) => {
    setOrders(newRows);
    setActiveFilename(filename || 'Uploaded File');
    setShowUploaderBar(false);
  };

  const handleLoadSample = () => {
    setOrders(getSampleRows());
    setActiveFilename('Sample Sales Dataset');
    setShowUploaderBar(false);
  };

  const handleReset = () => {
    setOrders([]);
    setActiveFilename('');
    setShowUploaderBar(true);
  };

  // Deterministic computations
  const matrix = useMemo(() => calculateMatrix(orders), [orders]);
  const q2q3Analysis = useMemo(() => calculateQ2Q3Analysis(orders), [orders]);

  // Overall KPIs
  const topRegion = useMemo(() => {
    if (!matrix.regions.length) return null;
    let max = { name: '', revenue: 0 };
    matrix.regions.forEach(r => {
      const rev = matrix.regionTotals[r]?.revenue || 0;
      if (rev > max.revenue) {
        max = { name: r, revenue: rev };
      }
    });
    return max;
  }, [matrix]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        totalRows={orders.length}
        quartersCount={matrix.quarters.length}
        regionsCount={matrix.regions.length}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* If no orders are loaded, show dedicated upload card */}
        {orders.length === 0 ? (
          <div className="py-12 max-w-2xl mx-auto">
            <CsvUploader
              onDataLoaded={handleDataLoaded}
              onLoadSample={handleLoadSample}
            />
          </div>
        ) : (
          <>
            {/* Quick action bar & File banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400">Current Dataset:</span>
                <span className="text-xs font-semibold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60">
                  {activeFilename}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({orders.length} rows loaded)
                </span>
              </div>

              <button
                onClick={() => setShowUploaderBar(!showUploaderBar)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>{showUploaderBar ? 'Close Uploader' : 'Upload Another CSV'}</span>
              </button>
            </div>

            {/* Expandable Uploader Drawer */}
            {showUploaderBar && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30">
                <CsvUploader
                  onDataLoaded={handleDataLoaded}
                  onLoadSample={handleLoadSample}
                />
              </div>
            )}

            {/* Top KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                    Total Revenue
                  </span>
                  <span className="text-base sm:text-xl font-bold font-mono text-white tracking-tight">
                    {formatCurrency(matrix.grandTotal.revenue)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                    Total Units Sold
                  </span>
                  <span className="text-base sm:text-xl font-bold font-mono text-white tracking-tight">
                    {formatUnits(matrix.grandTotal.units)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                    Avg Discount Rate
                  </span>
                  <span className="text-base sm:text-xl font-bold font-mono text-white tracking-tight">
                    {matrix.grandTotal.avgDiscount.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                    Top Region
                  </span>
                  <span className="text-base sm:text-lg font-bold text-white tracking-tight truncate block">
                    {topRegion?.name || 'N/A'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {topRegion ? formatCurrency(topRegion.revenue) : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* AI THREE-SENTENCE SUMMARY CARD */}
            <AiSummaryCard
              hasQ2={q2q3Analysis.hasQ2}
              hasQ3={q2q3Analysis.hasQ3}
              mostChangedByAbsolute={q2q3Analysis.mostChangedByAbsolute}
              mostChangedByPercentage={q2q3Analysis.mostChangedByPercentage}
              allRegionsAnalysis={q2q3Analysis.regionsAnalysis}
            />

            {/* REVENUE CHART */}
            <RevenueChart matrix={matrix} />

            {/* REVENUE MATRIX TABLE */}
            <RevenueTable matrix={matrix} rawRows={orders} />

            {/* RAW DATA AUDIT DRAWER */}
            <RawDataDrawer
              rows={orders}
              quarters={matrix.quarters}
              regions={matrix.regions}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          Sales Quarterly Revenue Analyzer • Total Revenue by Region & Quarter • Deterministic AI Variance Engine
        </p>
      </footer>
    </div>
  );
}
