"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Boolean preference persisted in localStorage. SSR-safe (server snapshot = fallback), every storage access is
 * wrapped in try/catch and falls back to an in-memory value when storage is blocked. Updates are shared between
 * components and (through the `storage` event) between tabs.
 *
 *   const [collapsed, setCollapsed] = useStoredBoolean("devboard:sidebar", () => window.innerWidth < 1024);
 */
const listeners = new Set<() => void>();
const memory = new Map<string, boolean>();

function read(key: string): boolean | null {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? null : v === "1";
  } catch {
    return null;
  }
}

export function useStoredBoolean(key: string, fallback: boolean | (() => boolean) = false): [boolean, (next: boolean | ((prev: boolean) => boolean)) => void] {
  const resolveFallback = useCallback(() => (typeof fallback === "function" ? fallback() : fallback), [fallback]);

  const subscribe = useCallback(
    (fn: () => void) => {
      listeners.add(fn);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) {
          memory.delete(key);
          fn();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(fn);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key]
  );

  const getSnapshot = useCallback((): boolean => {
    const mem = memory.get(key);
    if (mem !== undefined) return mem;
    const stored = read(key);
    return stored === null ? resolveFallback() : stored;
  }, [key, resolveFallback]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => (typeof fallback === "function" ? false : fallback));

  const set = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const current = getSnapshot();
      const v = typeof next === "function" ? next(current) : next;
      memory.set(key, v);
      try {
        window.localStorage.setItem(key, v ? "1" : "0");
      } catch {
        /* storage blocked: the in-memory value keeps working for this session */
      }
      listeners.forEach((fn) => fn());
    },
    [key, getSnapshot]
  );

  return [value, set];
}
