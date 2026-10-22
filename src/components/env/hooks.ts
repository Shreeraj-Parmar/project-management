"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { api, useFetch } from "@/lib/client";
import type { EnvVar } from "@/lib/types";
import type { LayoutMode } from "./types";
import { REVEAL_MS } from "./utils";

/** Layout mode from the width of the page container (the sidebar eats viewport width, so media queries lie). */
export function useLayoutMode<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [mode, setMode] = useState<LayoutMode>("full");
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const apply = () => {
      const w = el.getBoundingClientRect().width;
      setMode(w < 640 ? "cards" : w < 900 ? "compact" : "full");
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, mode] as const;
}

/** List value as the table keeps it: secrets stay blank until revealed. */
function normalize(v: EnvVar): EnvVar {
  return { ...v, value: v.secret ? "" : v.value, hasValue: v.hasValue ?? Boolean(v.value) };
}

/** Data + mutations for the env routes. Every action throws on failure, the caller decides how to tell the user. */
export function useEnvData(base: string) {
  const { data, loading, error, refetch, setData } = useFetch<EnvVar[]>(base);
  const vars = useMemo(() => data ?? [], [data]);

  const merge = useCallback(
    (incoming: EnvVar) => {
      const n = normalize(incoming);
      setData((prev) => {
        if (!prev) return [n];
        const i = prev.findIndex((x) => x._id === n._id);
        if (i < 0) return [...prev, n];
        const next = prev.slice();
        next[i] = { ...prev[i], ...n };
        return next;
      });
      return n;
    },
    [setData],
  );

  const create = useCallback(
    async (payload: { environment: string; key: string; value: string; note: string; secret: boolean }) => merge(await api.post<EnvVar>(base, payload)),
    [base, merge],
  );

  const update = useCallback(
    async (id: string, payload: { environment?: string; key?: string; value?: string; note?: string; secret?: boolean }) =>
      merge(await api.patch<EnvVar>(`${base}/${id}`, payload)),
    [base, merge],
  );

  const remove = useCallback(
    async (id: string) => {
      await api.del(`${base}/${id}`);
      setData((prev) => (prev ? prev.filter((x) => x._id !== id) : prev));
    },
    [base, setData],
  );

  /** Decrypted value of one variable. */
  const fetchValue = useCallback(async (id: string) => (await api.get<EnvVar>(`${base}/${id}`)).value ?? "", [base]);

  /** Decrypted values of every variable (single round trip). */
  const fetchAll = useCallback(async () => api.get<EnvVar[]>(`${base}?reveal=1`), [base]);

  const importRaw = useCallback(
    async (raw: string, environment: string) => {
      const res = await api.post<{ imported: number }>(base, { raw, environment });
      await refetch(true);
      return res.imported;
    },
    [base, refetch],
  );

  return { vars, loading: loading && !data, hasData: !!data, error, refetch, create, update, remove, fetchValue, fetchAll, importRaw };
}

type Entry = { value: string; at: number };

/**
 * Revealed secrets. Values live only in memory, hide again after 30 seconds and whenever the tab is hidden.
 * `revealing` holds ids with a request in flight (the eye shows a spinner).
 */
export function useReveal() {
  const [map, setMap] = useState<Record<string, Entry>>({});
  const [revealing, setRevealing] = useState<ReadonlySet<string>>(new Set());

  const revealed = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [id, e] of Object.entries(map)) out[id] = e.value;
    return out;
  }, [map]);

  const put = useCallback((entries: Record<string, string>) => {
    const at = Date.now();
    setMap((m) => {
      const next = { ...m };
      for (const [id, value] of Object.entries(entries)) next[id] = { value, at };
      return next;
    });
  }, []);

  const hide = useCallback((ids: string[]) => {
    setMap((m) => {
      if (!ids.some((id) => id in m)) return m;
      const next = { ...m };
      ids.forEach((id) => delete next[id]);
      return next;
    });
  }, []);

  const hideAll = useCallback(() => setMap((m) => (Object.keys(m).length ? {} : m)), []);

  const track = useCallback(async <T>(ids: string[], run: () => Promise<T>) => {
    setRevealing((s) => new Set([...s, ...ids]));
    try {
      return await run();
    } finally {
      setRevealing((s) => {
        const n = new Set(s);
        ids.forEach((id) => n.delete(id));
        return n;
      });
    }
  }, []);

  // Auto re-mask: one timer aimed at the oldest entry.
  useEffect(() => {
    const entries = Object.values(map);
    if (entries.length === 0) return;
    const oldest = Math.min(...entries.map((e) => e.at));
    const t = setTimeout(
      () =>
        setMap((m) => {
          const now = Date.now();
          const next: Record<string, Entry> = {};
          for (const [id, e] of Object.entries(m)) if (now - e.at < REVEAL_MS) next[id] = e;
          return Object.keys(next).length === Object.keys(m).length ? m : next;
        }),
      Math.max(0, oldest + REVEAL_MS - Date.now()) + 50,
    );
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && hideAll();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [hideAll]);

  return { revealed, revealing, put, hide, hideAll, track };
}
