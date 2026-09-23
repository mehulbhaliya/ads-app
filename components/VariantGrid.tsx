import React from 'react';
import { GeneratedCreative } from '../types';
import { AdPreview } from './AdPreview';
import { buildDefaultContent, TEMPLATE_META } from '../services/adContent';
import { ThumbsUp, ThumbsDown, CheckCircle2, Award, TrendingUp, Sparkles } from 'lucide-react';

interface VariantGridProps {
  variants: GeneratedCreative[];
  activeVariantId: string;
  onSelectVariant: (id: string) => void;
  onRateVariant: (id: string, rating: 'good' | 'bad') => void;
  logoSrc?: string | null;
}

export const VariantGrid: React.FC<VariantGridProps> = ({
  variants,
  activeVariantId,
  onSelectVariant,
  onRateVariant,
  logoSrc,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-dn-gold" />
          Your variants: pick one to edit
        </h3>
        <span className="text-xs text-gray-400 font-mono">
          {variants.length} Generated Variants
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {variants.map((v, idx) => {
          const isActive = v.id === activeVariantId;
          const hasPerf = !!v.performance;

          return (
            <div
              key={v.id}
              onClick={() => onSelectVariant(v.id)}
              className={`group min-w-0 bg-gray-900/90 rounded-xl border p-3 cursor-pointer transition-all hover:shadow-xl relative flex flex-col justify-between ${
                isActive
                  ? 'border-dn-gold ring-2 ring-dn-gold/40 shadow-dn-gold/10'
                  : 'border-gray-800 hover:border-gray-600'
              }`}
            >
              <div>
                {/* Visual Thumbnail */}
                <div className="relative rounded-lg overflow-hidden bg-black/60 mb-2.5">
                  <AdPreview
                    content={v.content || buildDefaultContent(v.brief)}
                    ratio="4:5"
                    baseSrc={v.generationError ? null : v.base64}
                    facultySrc={v.facultyPhoto || v.brief.references?.find((r) => r.role === 'brandLock')?.base64}
                    logoSrc={logoSrc}
                  />

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-dn-gold text-dn-navy-deep font-bold text-[10px] shadow">
                      EDITING
                    </div>
                  )}

                  {/* Variant Version Pill */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-gray-200 font-mono text-[10px] backdrop-blur-sm">
                    V{v.version}
                  </div>

                  {/* Rating Badge if set */}
                  {v.rating && (
                    <div
                      className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 backdrop-blur-md ${
                        v.rating === 'good'
                          ? 'bg-green-950/80 text-green-300 border border-green-700'
                          : 'bg-red-950/80 text-red-300 border border-red-700'
                      }`}
                    >
                      {v.rating === 'good' ? (
                        <>
                          <Award className="w-3 h-3 text-green-400" />
                          <span>Winner</span>
                        </>
                      ) : (
                        <span>Avoided</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Variant Axis Description */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Variant {idx + 1}</span>
                    <span className="text-[10px] text-dn-gold font-semibold">
                      {TEMPLATE_META[(v.content || buildDefaultContent(v.brief)).template].name}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-medium line-clamp-2">
                    {v.variantAxis}
                  </p>
                </div>
              </div>

              {/* Performance Indicator (if joined) */}
              {hasPerf && v.performance && (
                <div className="mt-2 pt-2 border-t border-gray-800 text-[11px] bg-gray-950/50 p-1.5 rounded flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    Spend: ₹{Math.round(v.performance.spend)}
                  </span>
                  <span className="font-bold text-dn-gold">
                    {v.performance.cpa
                      ? `CPA ₹${Math.round(v.performance.cpa)}`
                      : v.performance.cpl
                      ? `CPL ₹${Math.round(v.performance.cpl)}`
                      : `${v.performance.clicks} Clicks`}
                  </span>
                </div>
              )}

              {/* Learning Loop Feedback Controls */}
              <div className="mt-3 pt-2 border-t border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Rate to teach the next batch</span>
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onRateVariant(v.id, 'good')}
                    className={`p-1.5 rounded hover:bg-gray-800 transition ${
                      v.rating === 'good'
                        ? 'text-green-400 bg-green-950/50 border border-green-700'
                        : 'text-gray-400 hover:text-green-300'
                    }`}
                    title="Promote pattern to Replicate tier (Tier 2 Exemplar)"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRateVariant(v.id, 'bad')}
                    className={`p-1.5 rounded hover:bg-gray-800 transition ${
                      v.rating === 'bad'
                        ? 'text-red-400 bg-red-950/50 border border-red-700'
                        : 'text-gray-400 hover:text-red-300'
                    }`}
                    title="Flag issue to Avoid tier (Tier 1 Constraint)"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VariantGrid;
