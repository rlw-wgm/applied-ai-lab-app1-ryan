import React from 'react';
import { BarChart3, Sparkles, FileText, Download, RotateCcw, Database } from 'lucide-react';
import { SAMPLE_CSV_DATA } from '../utils/sampleData';

interface HeaderProps {
  totalRows: number;
  quartersCount: number;
  regionsCount: number;
  onLoadSample: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalRows,
  quartersCount,
  regionsCount,
  onLoadSample,
  onReset,
}) => {
  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_DATA], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sales_orders_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Sales Quarterly Revenue Analyzer
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Variance
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Total revenue by region and quarter with deterministic AI variance intelligence
            </p>
          </div>
        </div>

        {/* Dataset metrics and Quick Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {totalRows > 0 && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span><strong className="text-white font-mono">{totalRows}</strong> orders</span>
              <span className="text-slate-600">•</span>
              <span><strong className="text-white font-mono">{regionsCount}</strong> regions</span>
              <span className="text-slate-600">•</span>
              <span><strong className="text-white font-mono">{quartersCount}</strong> quarters</span>
            </div>
          )}

          <button
            onClick={downloadTemplate}
            title="Download CSV sample file with expected columns"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Template CSV</span>
          </button>

          <button
            onClick={onLoadSample}
            title="Load built-in 4-quarter realistic dataset"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/70 hover:bg-indigo-900/80 rounded-lg border border-indigo-700/50 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Sample Data</span>
          </button>

          {totalRows > 0 && (
            <button
              onClick={onReset}
              title="Clear data and upload a new CSV"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-rose-950/30 rounded-lg border border-slate-700/40 hover:border-rose-800/40 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
