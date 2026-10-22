"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useState that remembers a per-viewer convenience (a sort order, generator settings) in localStorage.
 * Every storage access is wrapped: private windows and blocked site data fall back to plain state.
 * The stored value is applied after mount so server and client markup always agree.
 */
export function usePersistedState<T>(key: string, initial: T, validate?: (v: unknown) => v is T): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return;
      const parsed: unknown = JSON.parse(raw);
      if (!validate || validate(parsed)) setValue(parsed as T);
    } catch {
      /* storage unavailable or corrupt: keep the default */
    }
    // validate is expected to be a stable module-level function
  }, [key]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [key]
  );

  return [value, set];
}
