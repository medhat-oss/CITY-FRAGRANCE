const CACHE_TTL = 30_000;   // 30 s for valid data
const FAIL_TTL  =  5_000;   // 5 s back-off after a failed fetch

interface CacheEntry {
  data: unknown;
  expiresAt: number;
  promise: Promise<unknown> | null;
}

let cache: CacheEntry | null = null;

/**
 * Fetches /api/admin/settings with:
 *  • In-flight deduplication  — simultaneous callers share one Promise
 *  • 30-second TTL cache      — subsequent callers within the window pay 0 ms
 *  • 5-second failure back-off — a failed request clears data so the next
 *    caller retries after 5 s instead of serving stale null for 30 s
 */
export async function fetchCachedSettings<T>(): Promise<T> {
  const now = Date.now();

  // Fast path: unexpired, resolved cache entry
  if (cache && cache.data !== null && now < cache.expiresAt) {
    return cache.data as T;
  }

  // In-flight deduplication: piggyback on the running promise
  if (cache?.promise) {
    return cache.promise as Promise<T>;
  }

  const p = fetch('/api/admin/settings')
    .then((res) => {
      if (!res.ok) throw new Error(`settings fetch ${res.status}`);
      return res.json();
    })
    .then((data: T) => {
      cache = { data, expiresAt: Date.now() + CACHE_TTL, promise: null };
      return data;
    })
    .catch((err) => {
      // Short back-off: don't hammer the server on transient errors
      cache = { data: null, expiresAt: Date.now() + FAIL_TTL, promise: null };
      throw err;
    });

  // Register the in-flight promise so parallel callers share it
  cache = { data: cache?.data ?? null, expiresAt: cache?.expiresAt ?? 0, promise: p };
  return p as Promise<T>;
}

/** Explicitly invalidate the settings cache (e.g., after admin saves settings) */
export function invalidateSettingsCache(): void {
  cache = null;
}
