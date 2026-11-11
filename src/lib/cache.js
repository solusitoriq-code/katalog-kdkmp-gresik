export const DEFAULT_TTL_MS = 5 * 60 * 1000;
const STORAGE_PREFIX = 'kdkmp_cache:';

const memoryCache = new Map();

function getSessionStorage() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    // Ignore storage access errors (private mode / SSR)
  }
  return null;
}

export function getCache(key, now = Date.now()) {
  if (!key) return undefined;

  const memEntry = memoryCache.get(key);
  if (memEntry) {
    if (memEntry.expiresAt > now) {
      return memEntry.data;
    }
    memoryCache.delete(key);
  }

  const storage = getSessionStorage();
  if (!storage) return undefined;

  try {
    const raw = storage.getItem(STORAGE_PREFIX + key);
    if (!raw) return undefined;

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.expiresAt === 'number' && parsed.expiresAt > now) {
      memoryCache.set(key, parsed);
      return parsed.data;
    }

    storage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Ignore invalid JSON or storage errors
  }

  return undefined;
}

export function setCache(key, data, ttlMs = DEFAULT_TTL_MS, now = Date.now()) {
  if (!key) return data;

  const entry = {
    data,
    expiresAt: now + ttlMs,
  };

  memoryCache.set(key, entry);

  const storage = getSessionStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Ignore quota exceeded or storage restrictions
    }
  }

  return data;
}

export function invalidateCache(keyOrPrefix) {
  if (!keyOrPrefix) {
    clearCache();
    return;
  }

  for (const k of Array.from(memoryCache.keys())) {
    if (k === keyOrPrefix || k.startsWith(keyOrPrefix)) {
      memoryCache.delete(k);
    }
  }

  const storage = getSessionStorage();
  if (storage) {
    try {
      const keysToDelete = [];
      for (let i = 0; i < storage.length; i += 1) {
        const storageKey = storage.key(i);
        if (storageKey && storageKey.startsWith(STORAGE_PREFIX)) {
          const rawKey = storageKey.slice(STORAGE_PREFIX.length);
          if (rawKey === keyOrPrefix || rawKey.startsWith(keyOrPrefix)) {
            keysToDelete.push(storageKey);
          }
        }
      }
      keysToDelete.forEach((k) => storage.removeItem(k));
    } catch {
      // Ignore storage errors
    }
  }
}

export function clearCache() {
  memoryCache.clear();

  const storage = getSessionStorage();
  if (storage) {
    try {
      const keysToDelete = [];
      for (let i = 0; i < storage.length; i += 1) {
        const storageKey = storage.key(i);
        if (storageKey && storageKey.startsWith(STORAGE_PREFIX)) {
          keysToDelete.push(storageKey);
        }
      }
      keysToDelete.forEach((k) => storage.removeItem(k));
    } catch {
      // Ignore storage errors
    }
  }
}

export async function withCache(
  key,
  fetcher,
  { ttlMs = DEFAULT_TTL_MS, force = false } = {}
) {
  if (!force) {
    const cached = getCache(key);
    if (cached !== undefined) {
      return cached;
    }
  }

  const result = await fetcher();
  if (result !== undefined && result !== null) {
    setCache(key, result, ttlMs);
  }
  return result;
}

