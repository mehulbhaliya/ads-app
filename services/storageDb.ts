import { GeneratedCreative, LearningStore } from '../types';

const DB_NAME = 'diginerve_studio_db';
const DB_VERSION = 1;
const CREATIVES_STORE = 'creatives';
const META_STORE = 'meta';

let dbInstance: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase | null> | null = null;

/**
 * Initializes or returns the cached IndexedDB instance.
 * IndexedDB provides 50MB - 1GB+ storage quota for high-resolution base64 creative visual bases.
 */
export function getIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(CREATIVES_STORE)) {
          db.createObjectStore(CREATIVES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE);
        }
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onerror = (err) => {
        console.warn('IndexedDB failed to open, falling back to in-memory/localStorage:', err);
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB initialization exception:', err);
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Retrieve all generated creatives from IndexedDB
 */
export async function getIdbCreatives(): Promise<GeneratedCreative[]> {
  try {
    const db = await getIndexedDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(CREATIVES_STORE, 'readonly');
      const store = tx.objectStore(CREATIVES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as GeneratedCreative[]) || []);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (e) {
    return [];
  }
}

/**
 * Persist an array of generated creatives to IndexedDB
 */
export async function saveIdbCreatives(creatives: GeneratedCreative[]): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db) return;

    const tx = db.transaction(CREATIVES_STORE, 'readwrite');
    const store = tx.objectStore(CREATIVES_STORE);

    // Clear and re-populate to keep exact order and deletions
    store.clear();
    for (const creative of creatives) {
      store.put(creative);
    }

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('Error saving creatives to IndexedDB:', e);
  }
}

/**
 * Retrieve a meta item from IndexedDB (e.g. learningStore, baselines)
 */
export async function getIdbMeta<T>(key: string): Promise<T | null> {
  try {
    const db = await getIndexedDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const store = tx.objectStore(META_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result !== undefined ? (request.result as T) : null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (e) {
    return null;
  }
}

/**
 * Persist a meta item in IndexedDB
 */
export async function saveIdbMeta<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db) return;

    const tx = db.transaction(META_STORE, 'readwrite');
    const store = tx.objectStore(META_STORE);
    store.put(value, key);

    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn(`Error saving meta key '${key}' to IndexedDB:`, e);
  }
}

/**
 * Strips duplicate and heavy base64 strings from embedded brief references
 * before saving to localStorage to prevent quota overflow while preserving all metadata.
 */
export function sanitizeCreativesForLocalStorage(creatives: GeneratedCreative[]): GeneratedCreative[] {
  // Keep up to 10 most recent creatives in localStorage
  const recent = creatives.slice(-10);

  return recent.map((creative) => {
    // If brief has references with large base64 strings, strip the base64 from the brief references
    // since the creative already has its own base64 image
    let sanitizedBrief = creative.brief;
    if (creative.brief?.references?.length) {
      sanitizedBrief = {
        ...creative.brief,
        references: creative.brief.references.map((r) => ({
          ...r,
          base64: r.base64?.startsWith('data:') && r.base64.length > 5000 ? '' : r.base64,
        })),
      };
    }

    return {
      ...creative,
      brief: sanitizedBrief,
    };
  });
}

/**
 * Safely sets an item in localStorage with quota overflow handling.
 * Never throws or logs console.error if the quota is exceeded.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      err?.message?.includes('exceeded the quota') ||
      err?.message?.includes('quota');

    if (isQuota) {
      // Attempt to clean up deprecated legacy keys first
      try {
        const legacyKeys = ['diginerve_creatives', 'diginerve_creatives_v1', 'diginerve_learning_store_v1'];
        legacyKeys.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        // If still failing, do not throw or call console.error.
        // IndexedDB holds the primary persistent store safely.
        console.info(`[Storage] LocalStorage quota reached for '${key}'. Persisted in IndexedDB.`);
        return false;
      }
    }
    return false;
  }
}
