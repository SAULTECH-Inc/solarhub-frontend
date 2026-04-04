import { useState, useEffect, useCallback } from 'react';

/**
 * Generic API hook — handles loading, error, data states
 * Usage: const { data, loading, error, refetch } = useApi(() => productsService.getFeatured())
 */
export function useApi(fetcher, deps = [], opts = {}) {
  const { immediate = true, initialData = null } = opts;
  const [data,    setData]    = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher(...args);
      const payload = res?.data ?? res;
      setData(payload);
      return payload;
    } catch (e) {
      setError(e.message || 'Request failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    if (immediate) execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

/**
 * Pagination hook
 */
export function usePaginated(fetcher, initialFilters = {}) {
  const [items,   setItems]   = useState([]);
  const [meta,    setMeta]    = useState({ page: 1, total: 0, totalPages: 1, hasNext: false });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [page,    setPage]    = useState(1);

  const load = useCallback(async (p = 1, filt = filters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetcher({ ...filt, page: p, limit: 20 });
      const d = res?.data ?? res;
      setItems(p === 1 ? d.data : prev => [...prev, ...d.data]);
      setMeta({ page: d.page, total: d.total, totalPages: d.totalPages, hasNext: d.hasNext });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetcher, filters]);

  useEffect(() => { load(1, filters); }, [JSON.stringify(filters)]);

  const loadMore = () => { if (meta.hasNext && !loading) { const next = page + 1; setPage(next); load(next); } };
  const refresh  = (f) => { const newF = f || filters; setFilters(newF); setPage(1); load(1, newF); };

  return { items, meta, loading, error, loadMore, refresh, setFilters };
}

/**
 * Local + server sync state — start with local data, then fetch real
 */
export function useServerState(localValue, fetcher, deps = []) {
  const [value,   setValue]   = useState(localValue);
  const [synced,  setSynced]  = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetcher) return;
    setLoading(true);
    fetcher().then(res => {
      const d = res?.data ?? res;
      if (d !== null && d !== undefined) setValue(d);
      setSynced(true);
    }).catch(() => setSynced(false))
      .finally(() => setLoading(false));
  }, deps);

  return [value, setValue, { synced, loading }];
}
