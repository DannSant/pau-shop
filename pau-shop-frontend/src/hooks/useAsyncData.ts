import { useCallback, useEffect, useState } from "react";

interface Result<T> {
  load: () => Promise<T>;
  version: number;
  data?: T;
  failed?: boolean;
}

// Runs `load` (memoize it with useCallback) and re-runs it when it changes or
// on reload(). While reloading, the previous data stays visible.
export function useAsyncData<T>(load: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    let active = true;

    load().then(
      (data) => active && setResult({ load, version, data }),
      () => active && setResult({ load, version, failed: true })
    );

    return () => {
      active = false;
    };
  }, [load, version]);

  const isCurrent = result?.load === load && result.version === version;

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Local update without refetching (e.g. after a successful save).
  const mutate = useCallback((update: (data: T) => T) => {
    setResult((r) => (r && r.data !== undefined ? { ...r, data: update(r.data) } : r));
  }, []);

  return {
    data: result?.data,
    loading: !isCurrent,
    failed: isCurrent && !!result?.failed,
    reload,
    mutate,
  };
}
