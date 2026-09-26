/**
 * Gemini key resolution, in priority order:
 *  1. The key Google AI Studio injects for whichever account opens the app
 *     (process.env.GEMINI_API_KEY / API_KEY; Vite's `define` does the same locally
 *     from .env.local). This is the default: every account uses its own key.
 *  2. A key the user pasted into the app (kept in this browser only), for running
 *     the app outside AI Studio.
 * Wrapped in try/catch because `process` does not exist in a plain browser runtime.
 */
const USER_KEY_STORAGE = 'dn_gemini_user_key_v1';
const FREE_TIER_STORAGE = 'dn_gemini_free_tier_v1';

function injectedKey(): string {
  try {
    return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  } catch {
    return '';
  }
}

function userKey(): string {
  try {
    return localStorage.getItem(USER_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function getGeminiApiKey(): string {
  return injectedKey() || userKey();
}

/** Where the active key comes from: the opening account, a pasted key, or nowhere. */
export function getGeminiKeySource(): 'account' | 'user' | 'none' {
  if (injectedKey()) return 'account';
  if (userKey()) return 'user';
  return 'none';
}

export function saveUserGeminiKey(key: string): void {
  try {
    localStorage.setItem(USER_KEY_STORAGE, key.trim());
    sessionStorage.removeItem(FREE_TIER_STORAGE);
  } catch {
    /* storage blocked: nothing to persist */
  }
}

export function clearUserGeminiKey(): void {
  try {
    localStorage.removeItem(USER_KEY_STORAGE);
    sessionStorage.removeItem(FREE_TIER_STORAGE);
  } catch {
    /* ignore */
  }
}

const TIER_MODE_STORAGE = 'dn_gemini_tier_mode_v2';

export type GeminiTierMode = 'free' | 'paid';

export function getGeminiTierMode(): GeminiTierMode {
  try {
    const saved = localStorage.getItem(TIER_MODE_STORAGE);
    if (saved === 'paid') return 'paid';
    return 'free'; // Switched to Free Tier by default
  } catch {
    return 'free';
  }
}

export function setGeminiTierMode(mode: GeminiTierMode): void {
  try {
    localStorage.setItem(TIER_MODE_STORAGE, mode);
  } catch {
    /* ignore */
  }
}

/**
 * Free-tier keys have no image quota. Once Gemini says so or mode is free,
 * the app generates branded procedural visual bases and keeps using Gemini for copy.
 */
let freeTierThisPage = false;
export function markGeminiFreeTier(): void {
  freeTierThisPage = true;
  try {
    sessionStorage.setItem(FREE_TIER_STORAGE, getGeminiApiKey().slice(-6));
  } catch {
    /* ignore */
  }
}

export function isGeminiFreeTier(): boolean {
  if (getGeminiTierMode() === 'free') return true;
  if (freeTierThisPage) return true;
  try {
    const tag = sessionStorage.getItem(FREE_TIER_STORAGE);
    return Boolean(tag) && tag === getGeminiApiKey().slice(-6);
  } catch {
    return false;
  }
}
