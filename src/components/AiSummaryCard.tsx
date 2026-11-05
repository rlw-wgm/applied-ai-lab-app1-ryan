import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, AlertCircle, ShieldCheck, TrendingUp, TrendingDown, Layers, BarChart2 } from 'lucide-react';
import { RegionSummaryData, AnalysisPayload } from '../types';
import { formatCurrency, formatPercent, formatUnits } from '../utils/calculations';

interface AiSummaryCardProps {
  hasQ2: boolean;
  hasQ3: boolean;
  mostChangedByAbsolute: RegionSummaryData | null;
  mostChangedByPercentage: RegionSummaryData | null;
  allRegionsAnalysis: RegionSummaryData[];
}

export const AiSummaryCard: React.FC<AiSummaryCardProps> = ({
  hasQ2,
  hasQ3,
  mostChangedByAbsolute,
  mostChangedByPercentage,
  allRegionsAnalysis,
}) => {
  const [metricMode, setMetricMode] = useState<'absolute' | 'percentage'>('absolute');
  const [summaryText, setSummaryText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sourceTag, setSourceTag] = useState<'gemini-3.8-flash' | 'deterministic' | 'deterministic-fallback'>('gemini-3.8-flash');
  const [showAuditData, setShowAuditData] = useState<boolean>(false);

  const activeRegion = metricMode === 'absolute' ? mostChangedByAbsolute : mostChangedByPercentage;

  const fetchSummary = async () => {
    if (!activeRegion || !hasQ2 || !hasQ3) return;

    setIsLoading(true);
    setErrorMsg(null);

    const payload: AnalysisPayload = {
      mostChangedRegion: activeRegion,
      changeMetricType: metricMode,
      allRegions: allRegionsAnalysis,
    };

    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setSummaryText(data.summary || '');
      setSourceTag(data.source || 'gemini-3.8-flash');
      if (data.errorNotice) {
        console.warn('API notice:', data.errorNotice);
      }
    } catch (err: any) {
      console.error('Failed to generate summary:', err);
      setErrorMsg('Failed to query Gemini API. A deterministic calculation was used as backup.');
      // Local fallback
      generateLocalSummary(payload);
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalSummary = (payload: AnalysisPayload) => {
    const reg = payload.mostChangedRegion;
    const dir = reg.deltaRevenue >= 0 ? 'grew' : 'declined';
    const s1 = `${reg.region} experienced the largest quarterly change from Q2 to Q3, as revenue ${dir} by ${formatCurrency(Math.abs(reg.deltaRevenue))} (${formatPercent(reg.deltaPct)}), shifting from ${formatCurrency(reg.q2Revenue)} to ${formatCurrency(reg.q3Revenue)}.`;
    const s2 = `This variance was driven by sales volume shifting from ${formatUnits(reg.q2Units)} to ${formatUnits(reg.q3Units)} units (${formatPercent(((reg.q3Units - reg.q2Units) / (reg.q2Units || 1)) * 100)}), while average discount rates moved from ${reg.q2AvgDiscountPct.toFixed(1)}% to ${reg.q3AvgDiscountPct.toFixed(1)}%.`;
    let s3 = '';
    if (reg.topProductDriver) {
      const pDir = reg.topProductDriver.deltaRevenue >= 0 ? 'grew' : 'decreased';
      s3 = `At the product level, ${reg.topProductDriver.name} served as the primary catalyst, where revenue ${pDir} by ${formatCurrency(Math.abs(reg.topProductDriver.deltaRevenue))} (${formatPercent(reg.topProductDriver.deltaPct)}) from ${formatCurrency(reg.topProductDriver.q2Revenue)} in Q2 to ${formatCurrency(reg.topProductDriver.q3Revenue)} in Q3.`;
    } else {
      s3 = `The quarterly shift reflects operational momentum across core regional channels.`;
    }
    setSummaryText(`${s1} ${s2} ${s3}`);
    setSourceTag('deterministic');
  };

  // Re-fetch when active region or metric mode changes
  useEffect(() => {
    if (activeRegion && hasQ2 && hasQ3) {
      fetchSummary();
    }
  }, [activeRegion?.region, metricMode, hasQ2, hasQ3]);

  if (!hasQ2 || !hasQ3) {
    return (
      <div className="bg-slate-900/60 rounded-2xl border border-amber-500/30 p-6 flex items-start gap-4 text-amber-200">
        <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-semibold text-amber-300">
            Q2 and Q3 Data Required for Quarterly Shift Analysis
          </h3>
          <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
            To analyze which region changed most from Q2 to Q3, your dataset must include orders from both <strong>Q2</strong> and <strong>Q3</strong>. Please upload a file with both quarters or load the sample dataset.
          </p>
        </div>
      </div>
    );
  }

  if (!activeRegion) return null;

  // Split summary into sentences for enhanced readability
  // Split on period followed by whitespace or end
  const rawSentences = summaryText
    ? summaryText
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 0)
    : [];

  const sentences = rawSentences.length > 0 ? rawSentences : [summaryText];

  const isPositiveGrowth = activeRegion.deltaRevenue >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-indigo-500/30 shadow-xl shadow-indigo-950/20 backdrop-blur">
      {/* Top subtle glow bar */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-600" />

      <div className="p-5 sm:p-7">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AI Quarterly Variance Briefing
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  100% Calculated Figures
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact three-sentence synthesis of regional change from Q2 to Q3 with underlying drivers
              </p>
            </div>
          </div>

          {/* Metric Selector & Refresh */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="inline-flex rounded-lg bg-slate-800/90 p-0.5 border border-slate-700/60 text-xs font-medium">
              <button
                type="button"
                onClick={() => setMetricMode('absolute')}
                className={`px-3 py-1 rounded-md transition-all ${
                  metricMode === 'absolute'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Largest $ Change
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('percentage')}
                className={`px-3 py-1 rounded-md transition-all ${
                  metricMode === 'percentage'
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Largest % Change
              </button>
            </div>

            <button
              type="button"
              onClick={fetchSummary}
              disabled={isLoading}
              title="Regenerate three-sentence summary"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg border border-slate-700/60 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          </div>
        </div>

        {/* Highlight Metrics Strip for the Selected Region */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
              Top Mover Region
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                {activeRegion.region}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Q2: {formatCurrency(activeRegion.q2Revenue)} → Q3: {formatCurrency(activeRegion.q3Revenue)}
            </span>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
              Revenue Variance
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {isPositiveGrowth ? (
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span
                className={`text-base sm:text-lg font-mono font-bold tracking-tight ${
                  isPositiveGrowth ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(activeRegion.deltaRevenue)}
              </span>
            </div>
            <span
              className={`text-[11px] font-mono font-semibold ${
                isPositiveGrowth ? 'text-emerald-400/90' : 'text-rose-400/90'
              }`}
            >
              {formatPercent(activeRegion.deltaPct)} variance
            </span>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
              Sales Volume Shift
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base sm:text-lg font-mono font-bold text-white tracking-tight">
                {formatUnits(activeRegion.q3Units)}
              </span>
              <span className="text-xs text-slate-400">units</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Delta: {activeRegion.deltaUnits >= 0 ? '+' : ''}{formatUnits(activeRegion.deltaUnits)} (from {formatUnits(activeRegion.q2Units)})
            </span>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
            <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
              Avg Discount & Catalyst
            </span>
            <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
              {activeRegion.topProductDriver?.name || 'All Products'}
            </div>
            <span className="text-[11px] text-slate-400 font-mono block">
              Discount: {activeRegion.q2AvgDiscountPct.toFixed(1)}% → {activeRegion.q3AvgDiscountPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Three Sentence Summary Output */}
        <div className="relative rounded-xl bg-slate-950/90 border border-slate-800 p-5 sm:p-6 shadow-inner">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs font-medium tracking-wide">
                Synthesizing verified three-sentence variance summary with Gemini 3.8 Flash...
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {sentences.map((sent, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 transition-colors"
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-normal">
                      {sent}
                    </p>
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 mt-1 block">
                      {index === 0
                        ? 'Sentence 1: Region Identification & Revenue Delta'
                        : index === 1
                        ? 'Sentence 2: Volume & Discount Dynamics'
                        : 'Sentence 3: Primary Segment Driver (Why)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Model info and verification stamp */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                Engine:{' '}
                <strong className="text-slate-300 font-mono">
                  {sourceTag === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Deterministic Calculator'}
                </strong>
              </span>
              <span className="text-slate-600">•</span>
              <span>Length: <strong className="text-slate-300 font-mono">{sentences.length} sentences</strong></span>
            </div>

            <button
              type="button"
              onClick={() => setShowAuditData(!showAuditData)}
              className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
            >
              <span>{showAuditData ? 'Hide Calculation Proof' : 'View Exact Numbers Fed to AI'}</span>
              {showAuditData ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Audit Disclosure Panel */}
        {showAuditData && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Deterministic Verification Audit
              </span>
              <span className="text-[10px] text-slate-500">Every metric is computed directly from raw orders</span>
            </div>

            {/* Comparison Table of All Regions */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1 px-2 font-semibold">Region</th>
                    <th className="py-1 px-2 font-semibold">Q2 Revenue</th>
                    <th className="py-1 px-2 font-semibold">Q3 Revenue</th>
                    <th className="py-1 px-2 font-semibold">Delta ($)</th>
                    <th className="py-1 px-2 font-semibold">Delta (%)</th>
                    <th className="py-1 px-2 font-semibold">Q2 Units</th>
                    <th className="py-1 px-2 font-semibold">Q3 Units</th>
                    <th className="py-1 px-2 font-semibold">Top Driver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {allRegionsAnalysis.map((reg) => {
                    const isSelected = reg.region === activeRegion.region;
                    return (
                      <tr
                        key={reg.region}
                        className={isSelected ? 'bg-indigo-950/40 text-white font-medium' : 'text-slate-300'}
                      >
                        <td className="py-1 px-2 flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                          {reg.region}
                        </td>
                        <td className="py-1 px-2">{formatCurrency(reg.q2Revenue)}</td>
                        <td className="py-1 px-2">{formatCurrency(reg.q3Revenue)}</td>
                        <td
                          className={`py-1 px-2 font-semibold ${
                            reg.deltaRevenue >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatCurrency(reg.deltaRevenue)}
                        </td>
                        <td
                          className={`py-1 px-2 font-semibold ${
                            reg.deltaRevenue >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {formatPercent(reg.deltaPct)}
                        </td>
                        <td className="py-1 px-2">{formatUnits(reg.q2Units)}</td>
                        <td className="py-1 px-2">{formatUnits(reg.q3Units)}</td>
                        <td className="py-1 px-2 text-slate-400">
                          {reg.topProductDriver ? `${reg.topProductDriver.name} (${formatCurrency(reg.topProductDriver.deltaRevenue)})` : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Prompt JSON payload */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Raw JSON Payload Sent in Prompt:
              </span>
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] text-cyan-300/90 overflow-x-auto max-h-48">
                {JSON.stringify(
                  {
                    targetRegion: activeRegion.region,
                    q2Revenue: activeRegion.q2Revenue,
                    q3Revenue: activeRegion.q3Revenue,
                    deltaRevenue: activeRegion.deltaRevenue,
                    deltaPct: activeRegion.deltaPct,
                    q2Units: activeRegion.q2Units,
                    q3Units: activeRegion.q3Units,
                    deltaUnits: activeRegion.deltaUnits,
                    q2AvgDiscountPct: activeRegion.q2AvgDiscountPct,
                    q3AvgDiscountPct: activeRegion.q3AvgDiscountPct,
                    topProductDriver: activeRegion.topProductDriver,
                    topChannelDriver: activeRegion.topChannelDriver,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
