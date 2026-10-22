"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { PasswordItem } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { copyText, REVEAL_MS } from "./password-utils";

export type Revealed = { value: string; until: number };
export type CopyKind = "password" | "username" | "host";

const COPY_LABEL: Record<CopyKind, string> = { password: "Password", username: "Username", host: "Host" };
const COPIED_MS = 1500;

/**
 * Reveal and copy behaviour for the vault.
 *
 * - A secret is fetched from the reveal endpoint only when the user asks (reveal or copy).
 * - Revealed secrets re-mask after REVEAL_MS, and all at once when the tab is hidden.
 * - Copying never reveals. Secrets are never logged, put in a URL or stored anywhere but this state.
 */
export function useSecrets(base: string) {
  const { toast } = useToast();
  const [revealed, setRevealed] = useState<Record<string, Revealed>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;
  // A ref (not state) so a double click cannot start two reveal requests.
  const inFlight = useRef<Record<string, boolean>>({});

  const hide = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setRevealed((r) => {
      if (!(id in r)) return r;
      const next = { ...r };
      delete next[id];
      return next;
    });
  }, []);

  const hideAll = useCallback(() => {
    // Delete keys in place (never reassign) so the unmount cleanup always sees every timer.
    for (const id of Object.keys(timers.current)) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
    setRevealed({});
  }, []);

  const show = useCallback(
    (id: string, value: string) => {
      clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => hide(id), REVEAL_MS);
      setRevealed((r) => ({ ...r, [id]: { value, until: Date.now() + REVEAL_MS } }));
    },
    [hide]
  );

  // Re-mask everything when the tab is hidden, and clear timers on unmount.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hideAll();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      Object.values(timers.current).forEach(clearTimeout);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, [hideAll]);

  const fetchSecret = useCallback(async (id: string) => (await api.get<PasswordItem>(`${base}/${id}`)).password ?? "", [base]);

  const toggleReveal = useCallback(
    async (p: PasswordItem) => {
      if (revealedRef.current[p._id]) return hide(p._id);
      if (inFlight.current[p._id]) return;
      inFlight.current[p._id] = true;
      setPending((s) => ({ ...s, [p._id]: true }));
      try {
        show(p._id, await fetchSecret(p._id));
      } catch (err) {
        toast(err instanceof Error ? err.message : "Couldn't reveal the password. Try again.", "error");
      } finally {
        delete inFlight.current[p._id];
        setPending((s) => {
          const next = { ...s };
          delete next[p._id];
          return next;
        });
      }
    },
    [fetchSecret, hide, show, toast]
  );

  const copy = useCallback(
    async (p: PasswordItem, what: CopyKind) => {
      try {
        let source: string | Promise<string>;
        if (what === "username") source = p.username;
        else if (what === "host") source = p.url;
        else source = revealedRef.current[p._id]?.value ?? fetchSecret(p._id);
        const ok = await copyText(source);
        if (!ok) {
          toast("Couldn't copy. Allow clipboard access for this site and try again.", "error");
          return;
        }
        setCopied(`${p._id}:${what}`);
        if (copiedTimer.current) clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(null), COPIED_MS);
        toast(`${COPY_LABEL[what]} copied.`, "success", { duration: 2500 });
      } catch (err) {
        toast(err instanceof Error ? err.message : "Couldn't copy the password. Try again.", "error");
      }
    },
    [fetchSecret, toast]
  );

  return { revealed, pending, copied, toggleReveal, copy, hide, hideAll, revealedCount: Object.keys(revealed).length };
}
