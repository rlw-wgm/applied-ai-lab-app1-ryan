import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Clipboard, Sparkles } from 'lucide-react';
import { parseCSV } from '../utils/csvParser';
import { OrderRow } from '../types';

interface CsvUploaderProps {
  onDataLoaded: (rows: OrderRow[], rawFilename?: string) => void;
  onLoadSample: () => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ onDataLoaded, onLoadSample }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = (file: File) => {
    setErrorMsg(null);
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt') && file.type !== 'text/csv') {
      setErrorMsg('Please upload a .csv or .txt file containing comma-separated values.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const res = parseCSV(text);
      if (res.success) {
        onDataLoaded(res.rows, file.name);
      } else {
        setErrorMsg(res.error || 'Failed to parse CSV file.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Error reading file from disk.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    setErrorMsg(null);
    const res = parseCSV(pastedText);
    if (res.success) {
      onDataLoaded(res.rows, 'Pasted Data');
      setShowPasteModal(false);
      setPastedText('');
    } else {
      setErrorMsg(res.error || 'Failed to parse pasted CSV data.');
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/80'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileProcess(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            Upload Sales Orders CSV
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Drag and drop your sales orders file here, or click to browse from your computer.
          </p>

          {/* Required columns chips */}
          <div className="w-full bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 text-left mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Required Columns (7 fields)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'quarter', desc: 'e.g. Q1, Q2, Q3, Q4' },
                { name: 'region', desc: 'e.g. North America, EMEA' },
                { name: 'channel', desc: 'e.g. Direct, Online' },
                { name: 'product', desc: 'e.g. Cloud ERP' },
                { name: 'units', desc: 'e.g. 250' },
                { name: 'discount_pct', desc: 'e.g. 5.0 or 0.05' },
                { name: 'revenue', desc: 'e.g. 2375000' },
              ].map((col) => (
                <span
                  key={col.name}
                  title={col.desc}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-slate-800/90 text-cyan-300 border border-slate-700/60"
                >
                  {col.name}
                </span>
              ))}
            </div>
          </div>

          {/* Secondary helper buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:translate-y-[-1px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Interactive Sample Dataset
            </button>
            <button
              type="button"
              onClick={() => setShowPasteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700/60 transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5 text-slate-400" />
              Paste CSV Text
            </button>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="font-semibold block text-rose-300">File Parsing Error</strong>
            <p className="text-rose-200/90 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                Paste Raw CSV Content
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Paste order data with the header line (quarter, region, channel, product, units, discount_pct, revenue).
            </p>
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="quarter,region,channel,product,units,discount_pct,revenue&#10;Q2,North America,Direct,Cloud Platform,100,5,500000&#10;Q3,North America,Direct,Cloud Platform,160,5,800000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow"
              >
                Parse & Load Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
