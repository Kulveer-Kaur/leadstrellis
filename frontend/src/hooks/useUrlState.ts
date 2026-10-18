import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Page state kept in the query string, so filters survive opening a record and coming back.
 * Values equal to their default are left out of the URL.
 */
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const [params, setParams] = useSearchParams();
  const state = useMemo(
    () => Object.fromEntries(Object.entries(defaults).map(([k, d]) => [k, params.get(k) ?? d])) as T,
    // `defaults` is a module-level constant at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params],
  );
  const update = useCallback(
    (patch: Partial<T>) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === defaults[k]) next.delete(k);
            else next.set(k, v as string);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams, defaults],
  );
  return [state, update] as const;
}
