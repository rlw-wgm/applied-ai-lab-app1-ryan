import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet, Filter } from 'lucide-react';
import { OrderRow } from '../types';
import { formatCurrency, formatUnits } from '../utils/calculations';

interface RawDataDrawerProps {
  rows: OrderRow[];
  quarters: string[];
  regions: string[];
}

export const RawDataDrawer: React.FC<RawDataDrawerProps> = ({ rows, quarters, regions }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const pageSize = 12;

  const filteredRows = rows.filter(r => {
    if (selectedQuarter !== 'ALL' && r.quarter !== selectedQuarter) return false;
    if (selectedRegion !== 'ALL' && r.region !== selectedRegion) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        r.region.toLowerCase().includes(term) ||
        r.product.toLowerCase().includes(term) ||
        r.channel.toLowerCase().includes(term) ||
        r.quarter.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Uploaded Order Records ({rows.length} total rows)
            </h4>
            <p className="text-xs text-slate-400">
              Explore and verify the underlying order items and columns
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 rounded-lg border border-indigo-800/40 transition-colors"
        >
          {isOpen ? 'Collapse Order Records' : 'View Order Records'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by product, channel, region..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedQuarter}
                onChange={(e) => {
                  setSelectedQuarter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Quarters</option>
                {quarters.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>

              <select
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Regions</option>
                {regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-800 text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <th className="py-2 px-3">Quarter</th>
                  <th className="py-2 px-3">Region</th>
                  <th className="py-2 px-3">Channel</th>
                  <th className="py-2 px-3">Product</th>
                  <th className="py-2 px-3 text-right">Units</th>
                  <th className="py-2 px-3 text-right">Discount</th>
                  <th className="py-2 px-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono text-slate-300">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-850/50">
                      <td className="py-2 px-3 text-cyan-300 font-bold">{row.quarter}</td>
                      <td className="py-2 px-3 font-sans text-slate-200">{row.region}</td>
                      <td className="py-2 px-3 font-sans text-slate-400">{row.channel}</td>
                      <td className="py-2 px-3 font-sans text-slate-200">{row.product}</td>
                      <td className="py-2 px-3 text-right">{formatUnits(row.units)}</td>
                      <td className="py-2 px-3 text-right text-amber-400">{row.discount_pct.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right font-bold text-white">
                        {formatCurrency(row.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>
              Showing {filteredRows.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-300 px-1">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
