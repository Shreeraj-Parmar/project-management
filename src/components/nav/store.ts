"use client";

import { useEffect, useSyncExternalStore } from "react";
import { api } from "@/lib/client";
import type { DashboardData, Project } from "@/lib/types";

/**
 * Tiny shared fetch cache (stale-while-revalidate). The global header and the boards home page both need the
 * boards list and the dashboard numbers: with one store they share a single request and every optimistic
 * change (star, create) shows up everywhere at once.
 */
type Snap<T> = { data: T | null; error: string | null; fetchedAt: number };

export type Resource<T> = {
  get: () => Snap<T>;
  getServer: () => Snap<T>;
  subscribe: (fn: () => void) => () => void;
  /** Fetch now. `silent` keeps whatever is on screen (no skeleton). */
  refetch: (silent?: boolean) => Promise<void>;
  /** Fetch only when there is no data yet or it is older than `maxAge` ms. */
  ensure: (maxAge?: number) => void;
  setData: (next: T | null | ((prev: T | null) => T | null)) => void;
};

function createResource<T>(url: string): Resource<T> {
  const initial: Snap<T> = { data: null, error: null, fetchedAt: 0 };
  let snap = initial;
  const subs = new Set<() => void>();
  let inflight: Promise<void> | null = null;

  const set = (patch: Partial<Snap<T>>) => {
    snap = { ...snap, ...patch };
    subs.forEach((fn) => fn());
  };

  function refetch(silent = false): Promise<void> {
    if (inflight) return inflight;
    if (!silent && snap.error) set({ error: null });
    inflight = api
      .get<T>(url)
      .then((d) => set({ data: d, error: null, fetchedAt: Date.now() }))
      .catch((e) => set({ error: e instanceof Error ? e.message : "Failed to load" }))
      .finally(() => {
        inflight = null;
      });
    return inflight;
  }

  return {
    get: () => snap,
    getServer: () => initial,
    subscribe: (fn) => {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
    refetch,
    ensure: (maxAge = 30_000) => {
      if (inflight) return;
      if (snap.data === null || Date.now() - snap.fetchedAt > maxAge) void refetch(true);
    },
    setData: (next) => set({ data: typeof next === "function" ? (next as (p: T | null) => T | null)(snap.data) : next }),
  };
}

export const boardsResource = createResource<Project[]>("/api/projects");
export const dashboardResource = createResource<DashboardData>("/api/dashboard");

export type SharedFetch<T> = {
  data: T | null;
  error: string | null;
  /** True until the first response (or error) arrives. */
  loading: boolean;
  refetch: (silent?: boolean) => Promise<void>;
  setData: Resource<T>["setData"];
};

function useResource<T>(r: Resource<T>, enabled = true, maxAge = 30_000): SharedFetch<T> {
  const snap = useSyncExternalStore(r.subscribe, r.get, r.getServer);
  useEffect(() => {
    if (enabled) r.ensure(maxAge);
  }, [r, enabled, maxAge]);
  return { data: snap.data, error: snap.error, loading: snap.data === null && snap.error === null, refetch: r.refetch, setData: r.setData };
}

/** All boards (GET /api/projects). `maxAge` = how stale the cache may be before a silent refresh on mount. */
export function useBoards(opts: { enabled?: boolean; maxAge?: number } = {}) {
  return useResource(boardsResource, opts.enabled ?? true, opts.maxAge ?? 30_000);
}

/** Dashboard counts and due tasks (GET /api/dashboard). */
export function useDashboard(opts: { enabled?: boolean; maxAge?: number } = {}) {
  return useResource(dashboardResource, opts.enabled ?? true, opts.maxAge ?? 30_000);
}
