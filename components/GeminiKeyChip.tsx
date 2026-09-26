import React, { useState } from 'react';
import {
  clearUserGeminiKey,
  getGeminiApiKey,
  getGeminiKeySource,
  getGeminiTierMode,
  isGeminiFreeTier,
  saveUserGeminiKey,
  setGeminiTierMode,
} from '../utils/apiKey';
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

/**
 * Header status for the Gemini key and active tier mode (Free Tier vs Paid Tier).
 * Free tier runs ad copy on Gemini 3.8 Flash with procedural visual bases.
 */
export const GeminiKeyChip: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [, force] = useState(0);

  const source = getGeminiKeySource();
  const tierMode = getGeminiTierMode();
  const isFree = isGeminiFreeTier();

  const label = isFree
    ? 'Gemini: Free Tier (Flash 3.8 Copy)'
    : `Gemini: Paid Tier (${source === 'account' ? 'Account Key' : 'Custom Key'})`;

  const tone = isFree
    ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-950/60'
    : 'border-blue-700/60 bg-blue-950/40 text-blue-300 hover:bg-blue-950/60';

  const dot = isFree ? 'bg-emerald-400' : 'bg-blue-400';

  const toggleTier = (mode: 'free' | 'paid') => {
    setGeminiTierMode(mode);
    force((n) => n + 1);
  };

  const saveKey = () => {
    if (!draft.trim()) return;
    saveUserGeminiKey(draft);
    setDraft('');
    force((n) => n + 1);
  };

  return (
    <div className="relative hidden md:block flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${tone}`}
        title="Gemini Tier & API Status"
      >
        <span className={`w-2 h-2 rounded-full ${dot} animate-pulse`} />
        <span>{label}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-84 z-50 rounded-xl border border-gray-700 bg-gray-900 p-4 text-xs text-gray-300 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <span className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-dn-gold" />
              Gemini Service Mode
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">
              {source === 'account' ? 'Managed' : 'Custom'}
            </span>
          </div>

          {/* Tier Switcher Buttons */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-950 rounded-lg border border-gray-800">
            <button
              type="button"
              onClick={() => toggleTier('free')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-semibold text-xs transition ${
                isFree
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Free Tier
            </button>
            <button
              type="button"
              onClick={() => toggleTier('paid')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-semibold text-xs transition ${
                !isFree
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Paid Tier
            </button>
          </div>

          {isFree ? (
            <div className="bg-emerald-950/30 border border-emerald-900/60 rounded-lg p-2.5 space-y-1.5 text-[11px] text-emerald-200">
              <div className="flex items-center gap-1 font-semibold text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Free Tier Active (No Billing Required)
              </div>
              <ul className="space-y-1 list-disc pl-4 text-gray-300">
                <li><strong className="text-white">AI Ad Copy:</strong> Powered by Gemini 3.8 Flash (fast, verified, exam-grounded).</li>
                <li><strong className="text-white">Visual Bases:</strong> Clinical branded procedural studio canvases & photo uploads.</li>
              </ul>
            </div>
          ) : (
            <div className="bg-blue-950/30 border border-blue-900/60 rounded-lg p-2.5 space-y-1.5 text-[11px] text-blue-200">
              <div className="flex items-center gap-1 font-semibold text-blue-300">
                <Zap className="w-3.5 h-3.5" />
                Paid Tier (Direct AI Image Generation)
              </div>
              <p className="text-gray-300">
                Uses <code className="text-blue-300">gemini-3.1-flash-image</code>. Requires a Google Cloud project with billing enabled for Google GenAI.
              </p>
            </div>
          )}

          {source !== 'account' && (
            <div className="pt-2 border-t border-gray-800 space-y-2">
              <span className="text-[11px] text-gray-400 block">Optional Custom API Key:</span>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                  placeholder="Paste Gemini API key"
                  className="flex-1 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-gray-100 outline-none focus:border-dn-gold text-xs"
                />
                <button
                  type="button"
                  onClick={saveKey}
                  className="rounded bg-dn-gold px-2.5 py-1 font-semibold text-dn-navy-deep text-xs hover:bg-yellow-400 transition"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {source === 'user' && (
            <button
              type="button"
              onClick={() => {
                clearUserGeminiKey();
                force((n) => n + 1);
              }}
              className="text-[11px] text-gray-400 hover:text-red-400 underline block"
            >
              Reset to account key
            </button>
          )}

          <div className="text-right">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
