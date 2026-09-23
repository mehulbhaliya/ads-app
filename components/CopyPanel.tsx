import React, { useState } from 'react';
import { CampaignBrief, MetaAdCopy, TextLayer } from '../types';
import { generateMetaCopy } from '../services/geminiCopy';
import { FileText, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Copy, Check, RefreshCw } from 'lucide-react';

interface CopyPanelProps {
  brief: CampaignBrief;
  copyOptions: MetaAdCopy[];
  onGenerateCopy: () => void;
  isLoading: boolean;
  onPushToCanvas: (headline: string, subhead: string) => void;
}

export const CopyPanel: React.FC<CopyPanelProps> = ({
  brief,
  copyOptions,
  onGenerateCopy,
  isLoading,
  onPushToCanvas,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (opt: MetaAdCopy) => {
    const textToCopy = `PRIMARY TEXT:
${opt.primaryText}

HEADLINE:
${opt.headline}

DESCRIPTION:
${opt.description}

CTA:
${opt.cta}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedId(opt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-5 shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-gray-700 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-dn-gold" />
            Meta Ad Copy Engine (Fact-Grounded)
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Grounded in {brief.course?.courseName || brief.product} verified facts. Character limits strictly enforced.
          </p>
        </div>

        <button
          onClick={onGenerateCopy}
          disabled={isLoading}
          className="px-3.5 py-1.5 bg-dn-navy hover:bg-dn-navy/80 text-dn-gold border border-dn-gold/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Generating...' : 'Regenerate 5 Options'}</span>
        </button>
      </div>

      {/* Copy Options List */}
      <div className="space-y-4">
        {copyOptions.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            No copy generated yet. Click above to generate 5 grounded Meta copy options.
          </div>
        )}

        {copyOptions.map((opt, idx) => {
          const isCopied = copiedId === opt.id;
          const hasErrors = opt.validationErrors.length > 0;

          return (
            <div
              key={opt.id}
              className={`p-4 rounded-xl border transition-all ${
                hasErrors
                  ? 'bg-red-950/20 border-red-800/60'
                  : 'bg-gray-900/90 border-gray-700/80 hover:border-dn-gold/60'
              }`}
            >
              {/* Concept Name & Character Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-800">
                <span className="font-bold text-xs text-dn-gold flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-dn-navy text-[10px] text-white flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  {opt.conceptName}
                </span>

                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      opt.primaryTextLength <= 125 ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'
                    }`}
                  >
                    Primary: {opt.primaryTextLength}/125
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      opt.headlineLength <= 40 ? 'bg-green-950 text-green-300' : 'bg-red-950 text-red-300'
                    }`}
                  >
                    Headline: {opt.headlineLength}/40
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300">
                    CTA: {opt.cta}
                  </span>
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-0.5">
                    Primary Text
                  </span>
                  <p className="text-gray-100 leading-relaxed font-sans bg-gray-950/60 p-2.5 rounded border border-gray-800">
                    {opt.primaryText}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-0.5">
                      Headline (Mobile truncation safe)
                    </span>
                    <p className="text-white font-bold bg-gray-950/60 p-2 rounded border border-gray-800">
                      {opt.headline}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-0.5">
                      Description ({opt.descriptionLength}/27 chars)
                    </span>
                    <p className="text-gray-300 bg-gray-950/60 p-2 rounded border border-gray-800">
                      {opt.description}
                    </p>
                  </div>
                </div>

                {/* Validation Warnings */}
                {hasErrors && (
                  <div className="p-2 rounded bg-red-950/40 border border-red-800 text-red-300 text-[11px] space-y-1">
                    <div className="flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>Validation Flag:</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {opt.validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Grounded Claims Used */}
                {opt.groundedFacts && opt.groundedFacts.length > 0 && (
                  <div className="text-[10px] text-gray-400 flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span>Grounded in: {opt.groundedFacts.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Push to Canvas & Copy */}
              <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => onPushToCanvas(opt.headline, opt.primaryText)}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-dn-navy text-dn-gold border border-gray-700 hover:border-dn-gold rounded-lg flex items-center gap-1.5 transition"
                  title="Push this headline and hook into the visual canvas layers"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Push to Canvas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyText(opt)}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg flex items-center gap-1.5 transition"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied' : 'Copy All Fields'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CopyPanel;
