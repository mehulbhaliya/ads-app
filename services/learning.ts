import { Angle, LearningStore, GeneratedCreative, AdPerformance } from '../types';
import {
  getIdbCreatives,
  saveIdbCreatives,
  getIdbMeta,
  saveIdbMeta,
  sanitizeCreativesForLocalStorage,
  safeLocalStorageSet,
} from './storageDb';

const LEARNING_STORAGE_KEY = 'diginerve_learning_store_v2';
const CREATIVES_STORAGE_KEY = 'diginerve_creatives_v2';
const BASELINES_STORAGE_KEY = 'diginerve_baselines_v2';

export interface PerformanceBaselines {
  salesCpa: number; // default 1665
  chatShowCpl: number; // default 75
  medicineMdCpl: number; // default 80
}

export const DEFAULT_BASELINES: PerformanceBaselines = {
  salesCpa: 1665,
  chatShowCpl: 75,
  medicineMdCpl: 80,
};

// In-memory runtime caches for immediate synchronous access
let inMemoryCreatives: GeneratedCreative[] | null = null;
let inMemoryStore: LearningStore | null = null;

/**
 * Initialize storage by hydrating from IndexedDB asynchronously.
 * Notifies subscriber callback once IndexedDB hydration completes.
 */
export async function initStorage(
  onSynced?: (creatives: GeneratedCreative[], store: LearningStore) => void
): Promise<void> {
  try {
    const [idbCreatives, idbStore] = await Promise.all([
      getIdbCreatives(),
      getIdbMeta<LearningStore>(LEARNING_STORAGE_KEY),
    ]);

    let hasUpdates = false;

    if (idbCreatives && idbCreatives.length > 0) {
      inMemoryCreatives = idbCreatives;
      hasUpdates = true;
    } else if (inMemoryCreatives && inMemoryCreatives.length > 0) {
      // Sync in-memory/localStorage to IndexedDB
      saveIdbCreatives(inMemoryCreatives);
    }

    if (idbStore) {
      inMemoryStore = idbStore;
      hasUpdates = true;
    } else if (inMemoryStore) {
      saveIdbMeta(LEARNING_STORAGE_KEY, inMemoryStore);
    }

    if (hasUpdates && onSynced) {
      onSynced(inMemoryCreatives || [], inMemoryStore || loadLearningStore());
    }
  } catch (err) {
    console.warn('[Storage] Asynchronous IndexedDB initialization completed with warning:', err);
  }
}

export function loadLearningStore(): LearningStore {
  if (inMemoryStore) {
    return inMemoryStore;
  }

  try {
    const raw = localStorage.getItem(LEARNING_STORAGE_KEY);
    if (raw) {
      inMemoryStore = JSON.parse(raw);
      return inMemoryStore!;
    }
  } catch (e) {
    console.warn('[Storage] Failed to load learning store from localStorage:', e);
  }

  inMemoryStore = {
    avoid: [],
    replicate: [],
    exemplars: [],
    houseStyleLocks: [],
  };
  return inMemoryStore;
}

export function saveLearningStore(store: LearningStore): void {
  inMemoryStore = store;

  // Asynchronously persist to high-capacity IndexedDB
  saveIdbMeta(LEARNING_STORAGE_KEY, store);

  // Safely persist to localStorage with sanitized exemplars (strip large base64 from localStorage copy)
  try {
    const safeStore: LearningStore = {
      ...store,
      exemplars: store.exemplars.map((ex) => ({
        ...ex,
        base64: ex.base64 && ex.base64.length > 5000 ? '' : ex.base64,
      })),
      houseStyleLocks: store.houseStyleLocks.map((h) => ({
        ...h,
        base64: h.base64 && h.base64.length > 5000 ? '' : h.base64,
      })),
    };
    safeLocalStorageSet(LEARNING_STORAGE_KEY, JSON.stringify(safeStore));
  } catch (e) {
    console.info('[Storage] Learning store safely persisted to IndexedDB.');
  }
}

export function loadCreatives(): GeneratedCreative[] {
  if (inMemoryCreatives !== null) {
    return inMemoryCreatives;
  }

  try {
    const raw = localStorage.getItem(CREATIVES_STORAGE_KEY);
    if (raw) {
      inMemoryCreatives = JSON.parse(raw);
      return inMemoryCreatives!;
    }
  } catch (e) {
    console.warn('[Storage] Failed to load creatives from localStorage:', e);
  }

  inMemoryCreatives = [];
  return inMemoryCreatives;
}

export function saveCreatives(creatives: GeneratedCreative[]): void {
  inMemoryCreatives = [...creatives];

  // 1. Always persist full-fidelity creatives (including base64 images) to IndexedDB
  saveIdbCreatives(creatives);

  // 2. Safely attempt to persist recent sanitized creatives to localStorage without throwing quota error
  try {
    const sanitized = sanitizeCreativesForLocalStorage(creatives);
    const success = safeLocalStorageSet(CREATIVES_STORAGE_KEY, JSON.stringify(sanitized));

    if (!success) {
      // If full sanitized array still exceeds quota, store ultra-light metadata in localStorage
      const ultraLight = sanitized.slice(-3).map((c) => ({
        ...c,
        base64: c.base64.length > 2000 ? c.base64.slice(0, 100) : c.base64,
      }));
      safeLocalStorageSet(CREATIVES_STORAGE_KEY, JSON.stringify(ultraLight));
    }
  } catch (e) {
    console.info('[Storage] Creatives safely preserved in IndexedDB.');
  }
}

export function getNextVersionNumber(format: string, angle: string, offer: string): number {
  const creatives = loadCreatives();
  const prefix = `${format}_${angle}_${offer}`;
  const matches = creatives.filter((c) => c.adName.startsWith(prefix));
  if (matches.length === 0) return 1;
  const versions = matches.map((c) => c.version || 1);
  return Math.max(...versions) + 1;
}

export function recordFeedback(
  creativeId: string,
  rating: 'good' | 'bad',
  notes?: string
): { updatedCreative: GeneratedCreative | null; store: LearningStore } {
  const creatives = loadCreatives();
  const creative = creatives.find((c) => c.id === creativeId);
  const store = loadLearningStore();

  if (!creative) return { updatedCreative: null, store };

  creative.rating = rating;
  creative.feedbackNotes = notes;

  const angle = creative.brief.angle;

  if (rating === 'bad' && notes?.trim()) {
    store.avoid.push({
      id: `avoid_${Date.now()}`,
      angle,
      note: notes.trim(),
      createdAt: new Date().toISOString(),
    });
  } else if (rating === 'good') {
    const exemplarId = `exemplar_${Date.now()}`;
    if (notes?.trim()) {
      store.replicate.push({
        id: `rep_${Date.now()}`,
        angle,
        note: notes.trim(),
        exemplarId,
        createdAt: new Date().toISOString(),
      });
    }

    // Check if exemplar already exists
    let existingExemplar = store.exemplars.find((ex) => ex.id === creative.id || ex.resolvedPrompt === creative.resolvedPrompt);
    if (existingExemplar) {
      existingExemplar.promotions += 1;
      if (existingExemplar.promotions >= 2) {
        // Can become a house style lock
        if (!store.houseStyleLocks.some((h) => h.id === existingExemplar!.id)) {
          store.houseStyleLocks.push({
            id: existingExemplar.id,
            name: `${angle} Proven Winner (${existingExemplar.promotions}x)`,
            angle,
            base64: existingExemplar.base64,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } else {
      store.exemplars.push({
        id: creative.id,
        angle,
        base64: creative.base64,
        resolvedPrompt: creative.resolvedPrompt,
        promotions: 1,
        createdAt: new Date().toISOString(),
      });
    }
  }

  saveCreatives(creatives);
  saveLearningStore(store);

  return { updatedCreative: creative, store };
}

export function buildFeedbackBlocksForPrompt(angle: Angle): { avoidBlock: string; replicateBlock: string } {
  const store = loadLearningStore();

  const angleAvoids = store.avoid.filter((a) => a.angle === angle);
  const angleReplicates = store.replicate.filter((r) => r.angle === angle);

  let avoidBlock = '';
  if (angleAvoids.length > 0) {
    const items = angleAvoids.slice(-4).map((a) => `- AVOID: ${a.note}`).join('\n');
    avoidBlock = `**CRITICAL FEEDBACK CONSTRAINTS:**
Based on user feedback from earlier generations, you MUST AVOID these specific issues:
${items}

**CONSTRAINT COMPLIANCE:**
- Review each constraint before generating.
- Implement specific corrections for each noted issue.
- Do not repeat any previously identified mistakes.
`;
  }

  let replicateBlock = '';
  if (angleReplicates.length > 0) {
    const items = angleReplicates.slice(-4).map((r) => `- REPLICATE: ${r.note}`).join('\n');
    replicateBlock = `**PROVEN PATTERNS (from previously approved generations for this angle):**
These approaches have already been approved by the user. Follow them.
${items}

**PATTERN COMPLIANCE:**
- Treat each proven pattern as a positive requirement, not a suggestion.
- Where a proven pattern conflicts with a default behaviour, the proven pattern wins.
`;
  }

  return { avoidBlock, replicateBlock };
}

export function importPerformanceData(
  csvOrText: string
): { matchedCount: number; promotionsCount: number; errors: string[] } {
  const creatives = loadCreatives();
  const baselines = loadBaselines();
  const errors: string[] = [];
  let matchedCount = 0;
  let promotionsCount = 0;

  const lines = csvOrText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { matchedCount: 0, promotionsCount: 0, errors: ['No data detected.'] };
  }

  // Parse header
  const header = lines[0].split(/[,\t]/).map((h) => h.trim().toLowerCase());
  const adNameIdx = header.findIndex((h) => h.includes('ad name') || h.includes('ad_name') || h.includes('content') || h.includes('mx_utm_content'));
  const spendIdx = header.findIndex((h) => h.includes('spend') || h.includes('cost') || h.includes('amount'));
  const impIdx = header.findIndex((h) => h.includes('impression'));
  const clicksIdx = header.findIndex((h) => h.includes('click'));
  const leadsIdx = header.findIndex((h) => h.includes('lead') || h.includes('conversion'));
  const purchasesIdx = header.findIndex((h) => h.includes('purchase') || h.includes('sale'));

  if (adNameIdx === -1) {
    errors.push('Could not locate "Ad Name" or "utm_content" column in header.');
    return { matchedCount: 0, promotionsCount: 0, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    const adName = cols[adNameIdx];
    if (!adName) continue;

    const creative = creatives.find((c) => c.adName.toUpperCase() === adName.toUpperCase());
    if (creative) {
      matchedCount++;
      const spend = spendIdx !== -1 ? parseFloat(cols[spendIdx]) || 0 : 0;
      const impressions = impIdx !== -1 ? parseInt(cols[impIdx], 10) || 0 : 0;
      const clicks = clicksIdx !== -1 ? parseInt(cols[clicksIdx], 10) || 0 : 0;
      const leads = leadsIdx !== -1 ? parseInt(cols[leadsIdx], 10) || 0 : 0;
      const purchases = purchasesIdx !== -1 ? parseInt(cols[purchasesIdx], 10) || 0 : 0;

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpl = leads > 0 ? spend / leads : undefined;
      const cpa = purchases > 0 ? spend / purchases : undefined;

      const perf: AdPerformance = {
        adName,
        impressions,
        clicks,
        ctr,
        spend,
        leads,
        cpl,
        purchases,
        cpa,
        importedAt: new Date().toISOString(),
      };

      creative.performance = perf;

      // Auto-promote if beating baseline
      let beatBaseline = false;
      if (cpa && cpa < baselines.salesCpa) {
        beatBaseline = true;
      } else if (cpl && cpl < baselines.chatShowCpl) {
        beatBaseline = true;
      }

      if (beatBaseline && creative.rating !== 'good') {
        creative.rating = 'good';
        creative.feedbackNotes = `Auto-promoted by Performance Join: CPA/CPL beating account baseline (Spend: ₹${spend.toFixed(0)}, Leads: ${leads}, Purchases: ${purchases})`;
        promotionsCount++;
        recordFeedback(creative.id, 'good', creative.feedbackNotes);
      }
    }
  }

  saveCreatives(creatives);
  return { matchedCount, promotionsCount, errors };
}

export function loadBaselines(): PerformanceBaselines {
  try {
    const raw = localStorage.getItem(BASELINES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return DEFAULT_BASELINES;
}

export function saveBaselines(baselines: PerformanceBaselines): void {
  try {
    localStorage.setItem(BASELINES_STORAGE_KEY, JSON.stringify(baselines));
  } catch (e) {
    // fallback
  }
}
