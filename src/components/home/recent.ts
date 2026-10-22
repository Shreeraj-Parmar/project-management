import { useMemo, useSyncExternalStore } from "react";
import type { Project } from "@/lib/types";

/**
 * "Recently viewed" boards. Visits live in localStorage (every access in try/catch, SSR-safe) as a list of
 * { id, at } with the most recent visit first. If storage is blocked the list still works in memory for the session.
 *
 *   recordBoardVisit(id)        call when a board is opened
 *   useRecentVisits()           raw visits (reactive, also across tabs)
 *   useRecentBoards(boards)     visited boards in order, topped up with the most recently updated ones
 */
const KEY = "devboard:recent-boards:v1";
const MAX_VISITS = 24;

export type BoardVisit = { id: string; at: number };

const EMPTY: BoardVisit[] = [];
let cache: BoardVisit[] | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): BoardVisit[] {
  if (!raw) return EMPTY;
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return EMPTY;
    const out: BoardVisit[] = [];
    for (const v of arr) {
      if (v && typeof v === "object" && typeof (v as BoardVisit).id === "string" && typeof (v as BoardVisit).at === "number") out.push({ id: (v as BoardVisit).id, at: (v as BoardVisit).at });
    }
    return out.slice(0, MAX_VISITS);
  } catch {
    return EMPTY;
  }
}

function load(): BoardVisit[] {
  if (cache) return cache;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  cache = parse(raw);
  return cache;
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function recordBoardVisit(id: string): void {
  if (typeof window === "undefined" || !id) return;
  const current = load();
  if (current[0]?.id === id && Date.now() - current[0].at < 1000) return; // double calls (click + route change)
  const next = [{ id, at: Date.now() }, ...current.filter((v) => v.id !== id)].slice(0, MAX_VISITS);
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked or full: keep the in-memory list */
  }
  emit();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY && e.key !== null) return;
    cache = parse(e.newValue);
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function useRecentVisits(): BoardVisit[] {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

export type RecentBoard = { project: Project; /** null when the board was never opened here (topped up by updatedAt). */ visitedAt: number | null };

/**
 * Boards in "recently viewed" order. Boards that were opened come first (most recent first); when there is
 * no history, or fewer visits than `limit`, the rest is filled by `updatedAt` so the list is never empty.
 */
export function useRecentBoards(boards: Project[] | null | undefined, opts: { limit?: number; includeArchived?: boolean; fill?: boolean } = {}): RecentBoard[] {
  const { limit = 6, includeArchived = false, fill = true } = opts;
  const visits = useRecentVisits();
  return useMemo(() => {
    const list = (boards ?? []).filter((p) => includeArchived || p.status !== "archived");
    const byId = new Map(list.map((p) => [p._id, p]));
    const out: RecentBoard[] = [];
    const seen = new Set<string>();
    for (const v of visits) {
      const p = byId.get(v.id);
      if (p && !seen.has(p._id)) {
        out.push({ project: p, visitedAt: v.at });
        seen.add(p._id);
      }
    }
    if (fill) {
      const rest = list.filter((p) => !seen.has(p._id)).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      for (const p of rest) out.push({ project: p, visitedAt: null });
    }
    return out.slice(0, limit);
  }, [boards, visits, limit, includeArchived, fill]);
}
