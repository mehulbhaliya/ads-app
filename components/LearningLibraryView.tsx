import React from 'react';
import { LearningStore } from '../types';
import { Award, AlertTriangle, ShieldCheck, Trash2, Eye, Sparkles } from 'lucide-react';

interface LearningLibraryViewProps {
  store: LearningStore;
  onUpdateStore: (updated: LearningStore) => void;
}

export const LearningLibraryView: React.FC<LearningLibraryViewProps> = ({
  store,
  onUpdateStore,
}) => {
  const handleRemoveAvoid = (id: string) => {
    onUpdateStore({
      ...store,
      avoid: store.avoid.filter((a) => a.id !== id),
    });
  };

  const handleRemoveReplicate = (id: string) => {
    onUpdateStore({
      ...store,
      replicate: store.replicate.filter((r) => r.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-dn-gold" />
            Learning Loop Memory & Exemplars Store
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Persisted in browser localStorage across sessions. Constrains and elevates future generations by angle.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-gray-300">
          <span className="px-2.5 py-1 rounded bg-red-950/40 text-red-300 border border-red-800/60">
            {store.avoid.length} Avoids
          </span>
          <span className="px-2.5 py-1 rounded bg-green-950/40 text-green-300 border border-green-800/60">
            {store.replicate.length} Replicates
          </span>
          <span className="px-2.5 py-1 rounded bg-amber-950/40 text-amber-300 border border-amber-800/60">
            {store.houseStyleLocks.length} House Locks
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier 1: AVOID Constraints */}
        <div className="bg-gray-900/80 border border-red-900/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-sm font-bold text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Tier 1: Avoid Constraints (Negative Directives)
            </h3>
            <span className="text-[10px] text-gray-400">Scoped by Angle</span>
          </div>

          {store.avoid.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4 text-center">
              No avoid constraints logged yet. Down-rate any variant to add a negative guardrail.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {store.avoid.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-950 border border-gray-800 rounded-lg flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 text-[10px] font-mono font-bold">
                      {item.angle}
                    </span>
                    <p className="text-gray-200 mt-1.5 leading-relaxed">{item.note}</p>
                    <span className="text-[10px] text-gray-500 block mt-1">
                      Added: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveAvoid(item.id)}
                    className="text-gray-500 hover:text-red-400 p-1"
                    title="Delete constraint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tier 2: REPLICATE Patterns */}
        <div className="bg-gray-900/80 border border-green-900/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-sm font-bold text-green-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              Tier 2: Proven Replicate Patterns (Positive Directives)
            </h3>
            <span className="text-[10px] text-gray-400">Exemplar Driven</span>
          </div>

          {store.replicate.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4 text-center">
              No proven patterns logged yet. Up-rate a creative or import winning ad performance.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {store.replicate.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-gray-950 border border-gray-800 rounded-lg flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="px-2 py-0.5 rounded bg-green-950 text-green-300 text-[10px] font-mono font-bold">
                      {item.angle}
                    </span>
                    <p className="text-gray-200 mt-1.5 leading-relaxed">{item.note}</p>
                    <span className="text-[10px] text-gray-500 block mt-1">
                      Added: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveReplicate(item.id)}
                    className="text-gray-500 hover:text-red-400 p-1"
                    title="Delete pattern"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tier 3: House Style Locks */}
      {store.houseStyleLocks.length > 0 && (
        <div className="bg-gray-900/80 border border-dn-gold/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-sm font-bold text-dn-gold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Tier 3: Permanent House Style Locks (2x+ Approved Winners)
            </h3>
            <span className="text-xs text-gray-400">Re-injected as Level 4 House References</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {store.houseStyleLocks.map((lock) => (
              <div key={lock.id} className="bg-gray-950 border border-gray-800 rounded-xl p-3 space-y-2">
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-black">
                  <img src={lock.base64} alt={lock.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block truncate">{lock.name}</span>
                  <span className="text-[10px] text-dn-gold font-mono">{lock.angle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningLibraryView;
