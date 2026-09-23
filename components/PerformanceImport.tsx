import React, { useState } from 'react';
import { importPerformanceData, loadBaselines, saveBaselines } from '../services/learning';
import { TrendingUp, Upload, CheckCircle2, AlertCircle, Settings, FileSpreadsheet } from 'lucide-react';

interface PerformanceImportProps {
  onRefreshCreatives: () => void;
}

export const PerformanceImport: React.FC<PerformanceImportProps> = ({ onRefreshCreatives }) => {
  const [dataInput, setDataInput] = useState('');
  const [result, setResult] = useState<{ matchedCount: number; promotionsCount: number; errors: string[] } | null>(null);
  const [baselines, setBaselines] = useState(loadBaselines());
  const [showConfig, setShowConfig] = useState(false);

  const handleImport = () => {
    if (!dataInput.trim()) return;
    const res = importPerformanceData(dataInput.trim());
    setResult(res);
    onRefreshCreatives();
  };

  const handleSaveBaselines = (e: React.FormEvent) => {
    e.preventDefault();
    saveBaselines(baselines);
    setShowConfig(false);
  };

  return (
    <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-gray-700 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-dn-gold" />
          <h3 className="text-sm font-bold text-white">Performance Loop Join (Meta / LeadSquared)</h3>
        </div>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Account Baselines</span>
        </button>
      </div>

      <p className="text-xs text-gray-300">
        Paste CSV or tab-separated export from Meta Ads Manager or LeadSquared. Rows automatically join to creatives on{' '}
        <span className="font-mono text-dn-gold font-bold">Ad Name (utm_content)</span>. Creatives beating account baselines are auto-promoted to Tier 2 Exemplars.
      </p>

      {/* Baseline Settings Dropdown */}
      {showConfig && (
        <form onSubmit={handleSaveBaselines} className="p-4 bg-gray-900/90 border border-gray-700 rounded-xl space-y-3 text-xs">
          <span className="font-bold text-white block">Account Benchmark Baselines</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-gray-400 block mb-1">Meta Sales Blended CPA (₹)</label>
              <input
                type="number"
                value={baselines.salesCpa}
                onChange={(e) => setBaselines({ ...baselines, salesCpa: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Chat Show CPL (₹)</label>
              <input
                type="number"
                value={baselines.chatShowCpl}
                onChange={(e) => setBaselines({ ...baselines, chatShowCpl: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Medicine MD Lead CPL (₹)</label>
              <input
                type="number"
                value={baselines.medicineMdCpl}
                onChange={(e) => setBaselines({ ...baselines, medicineMdCpl: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-950 border border-gray-700 rounded px-2.5 py-1.5 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-3 py-1 bg-dn-gold text-dn-navy-deep font-bold rounded text-xs">
              Save Baselines
            </button>
          </div>
        </form>
      )}

      {/* CSV / Text Input Area */}
      <div className="space-y-2">
        <textarea
          rows={4}
          value={dataInput}
          onChange={(e) => setDataInput(e.target.value)}
          placeholder={`Ad Name, Amount Spent (INR), Impressions, Clicks, Results\nIMG_FACULTY_FLAT40_V1_220926, 4500, 18500, 420, 5\nIMG_CURRICULUM_NOOFFER_V1_220926, 3200, 14200, 310, 4`}
          className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:border-dn-gold"
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            Accepts CSV with headers: Ad Name, Spend, Impressions, Clicks, Leads/Results.
          </span>
          <button
            onClick={handleImport}
            disabled={!dataInput.trim()}
            className="px-4 py-1.5 bg-dn-gold hover:bg-yellow-400 text-dn-navy-deep font-bold rounded-lg text-xs shadow transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Join Performance Rows</span>
          </button>
        </div>
      </div>

      {/* Result Notice */}
      {result && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
            result.errors.length > 0
              ? 'bg-red-950/30 border-red-800 text-red-200'
              : 'bg-green-950/30 border-green-800 text-green-200'
          }`}
        >
          {result.errors.length > 0 ? (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold">
              Joined {result.matchedCount} ads successfully. ({result.promotionsCount} auto-promoted to Tier 2 Exemplars based on baseline outperformance).
            </span>
            {result.errors.map((err, i) => (
              <p key={i} className="text-red-300 text-[11px] mt-0.5">{err}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceImport;
