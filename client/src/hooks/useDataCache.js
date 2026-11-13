import { useState, useEffect, useCallback, useRef } from 'react';

// Global in-memory cache across all route changes
const cacheStore = new Map();

/**
 * Custom Stale-While-Revalidate Cache Hook
 * @param {string} key Unique cache identifier (e.g. 'tenants-all', 'rooms-available')
 * @param {Function} fetcher Async function that fetches data from API
 * @param {Object} options Configuration options
 */
export const useDataCache = (key, fetcher, options = {}) => {
  const cachedItem = cacheStore.get(key);
  const [data, setData] = useState(cachedItem ? cachedItem.data : options.initialData || null);
  const [loading, setLoading] = useState(!cachedItem);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(
    async (isBackground = false) => {
      if (!isBackground && !cacheStore.has(key)) {
        setLoading(true);
      }
      try {
        const freshData = await fetcherRef.current();
        cacheStore.set(key, { data: freshData, timestamp: Date.now() });
        setData(freshData);
        setError(null);
        return freshData;
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [key]
  );

  useEffect(() => {
    // If cached, display instantly and silently validate in background
    if (cacheStore.has(key)) {
      const cached = cacheStore.get(key);
      setData(cached.data);
      setLoading(false);
      refresh(true); // silent background fetch
    } else {
      refresh(false); // full fetch with loader
    }
  }, [key, refresh]);

  return { data, setData, loading, error, refresh };
};

/**
 * Manually update cached data (for optimistic updates)
 */
export const setCacheData = (key, updater) => {
  const current = cacheStore.get(key);
  const currentData = current ? current.data : null;
  const newData = typeof updater === 'function' ? updater(currentData) : updater;
  cacheStore.set(key, { data: newData, timestamp: Date.now() });
  return newData;
};

/**
 * Invalidate/clear cache matching a key prefix or all
 */
export const invalidateCache = (keyPattern) => {
  if (!keyPattern) {
    cacheStore.clear();
    return;
  }
  for (const k of cacheStore.keys()) {
    if (k.includes(keyPattern)) {
      cacheStore.delete(k);
    }
  }
};
