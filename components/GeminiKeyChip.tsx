import React, { useState } from 'react';
import {
  clearUserGeminiKey,
  getGeminiKeySource,
  isGeminiFreeTier,
  saveUserGeminiKey,
} from '../utils/apiKey';

/**
 * Header status for the Gemini key. By default the app uses the key of the
 * AI Studio account that opened it; outside AI Studio the user can paste one.
 */
export const GeminiKeyChip: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [, force] = useState(0);

  const source = getGeminiKeySource();
  const freeTier = source !== 'none' && isGeminiFreeTier();

  const label =
    source === 'none'
      ? 'Gemini key missing'
      : `Gemini: ${source === 'account' ? 'account key' : 'your key'}${freeTier ? ' · free tier (copy only)' : ''}`;
  const tone =
    source === 'none'
      ? 'border-amber-800 bg-amber-950/60 text-amber-300'
      : freeTier
        ? 'border-sky-800 bg-sky-950/60 text-sky-300'
        : 'border-green-800 bg-green-950/60 text-green-300';
  const dot = source === 'none' ? 'bg-amber-400' : freeTier ? 'bg-sky-400' : 'bg-green-400';

  const save = () => {
    if (!draft.trim()) return;
    saveUserGeminiKey(draft);
    setDraft('');
    setOpen(false);
    force((n) => n + 1);
  };

  return (
    <div className="relative hidden md:block flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold border ${tone}`}
        title="Gemini key used for copy and AI visuals"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50 rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs text-gray-300 shadow-xl">
          {source === 'account' ? (
            <p className="mb-2">
              Using the Gemini key of the Google AI Studio account that opened this app. Nothing to set up.
            </p>
          ) : (
            <p className="mb-2">
              In Google AI Studio the app uses your account's key automatically. Outside AI Studio, paste a Gemini API key
              (kept in this browser only).
            </p>
          )}
          {freeTier && (
            <p className="mb-2 text-sky-300">
              This key is on the free tier: ad copy runs on Gemini, AI visuals are skipped. Turn on billing for the key, use
              OpenArt, or upload a photo for visuals.
            </p>
          )}
          {source !== 'account' && (
            <div className="flex gap-2">
              <input
                type="password"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                placeholder="Paste Gemini API key"
                className="flex-1 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-gray-100 outline-none focus:border-amber-500"
              />
              <button type="button" onClick={save} className="rounded bg-amber-500 px-2 py-1 font-semibold text-gray-950">
                Save
              </button>
            </div>
          )}
          {source === 'user' && (
            <button
              type="button"
              onClick={() => {
                clearUserGeminiKey();
                setOpen(false);
                force((n) => n + 1);
              }}
              className="mt-2 text-[11px] text-gray-400 underline"
            >
              Remove saved key
            </button>
          )}
        </div>
      )}
    </div>
  );
};
