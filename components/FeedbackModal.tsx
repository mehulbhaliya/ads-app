import React, { useState } from 'react';
import { GeneratedCreative } from '../types';
import { ThumbsUp, ThumbsDown, Award, AlertCircle, X, Check } from 'lucide-react';

interface FeedbackModalProps {
  creative: GeneratedCreative | null;
  rating: 'good' | 'bad' | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (notes: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  creative,
  rating,
  isOpen,
  onClose,
  onSubmitFeedback,
}) => {
  const [note, setNote] = useState('');

  if (!isOpen || !creative || !rating) return null;

  const isGood = rating === 'good';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitFeedback(note);
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isGood ? 'bg-green-950 text-green-400 border border-green-700' : 'bg-red-950 text-red-400 border border-red-700'
              }`}
            >
              {isGood ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isGood ? 'Promote to Proven Patterns (Tier 2)' : 'Add Negative Constraint (Tier 1)'}
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">
                Angle: {creative.brief.angle} · Version: V{creative.version}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1">
              {isGood
                ? 'What worked well here? (Saved as a positive requirement for this angle)'
                : 'What specific issue should be avoided in future generations?'}
            </label>
            <textarea
              rows={3}
              required={!isGood}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isGood
                  ? 'e.g. Excellent shallow depth of field; quiet lower 38% copy zone allowed crisp headline contrast.'
                  : 'e.g. Background had distracting whiteboard reflection; copy zone had too much clutter.'
              }
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-dn-gold"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-gray-950/60 border border-gray-800 text-[11px] text-gray-400">
            {isGood ? (
              <p>
                Approved creatives are saved in the Exemplar store. When promoted twice, they qualify as a <strong>House Style Lock</strong>.
              </p>
            ) : (
              <p>
                Avoid notes are injected as strict negative constraints into all future prompt assemblies for the <strong>{creative.brief.angle}</strong> angle.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow transition ${
                isGood ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              Save Feedback to Loop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
