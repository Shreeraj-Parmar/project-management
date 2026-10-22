"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "devboard:labels-expanded";
let cache: boolean | null = null;
const listeners = new Set<() => void>();

function read(): boolean {
  if (cache !== null) return cache;
  try {
    cache = localStorage.getItem(KEY) === "1";
  } catch {
    cache = false;
  }
  return cache;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = e.newValue === "1";
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Trello: clicking a label bar on any card switches every card between colour bars and labels with text.
 * The choice is remembered in localStorage and shared by all cards (SSR-safe: the server snapshot is "collapsed").
 */
export function useLabelsExpanded(): [boolean, () => void] {
  const expanded = useSyncExternalStore(subscribe, read, () => false);
  const toggle = useCallback(() => {
    const next = !read();
    cache = next;
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }, []);
  return [expanded, toggle];
}
