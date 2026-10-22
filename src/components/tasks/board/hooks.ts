"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `onAway` when a pointer goes down outside `ref` (and outside any open popover / dialog opened from inside it).
 * Used by the composers: click-away closes them.
 */
export function useClickAway(ref: React.RefObject<HTMLElement | null>, onAway: () => void, enabled = true) {
  const cb = useRef(onAway);
  cb.current = onAway;
  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: Event) => {
      const t = e.target as Node | null;
      if (!t || !ref.current) return;
      if (ref.current.contains(t)) return;
      if (t instanceof Element && t.closest('[role="dialog"], [role="menu"], [role="status"], [role="alert"], [data-composer-ignore]')) return;
      cb.current();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [ref, enabled]);
}

/** Auto-grow a textarea to its content (min `minPx`, max `maxPx`, then it scrolls). */
export function autoGrow(el: HTMLTextAreaElement | null, minPx = 54, maxPx = 160) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(Math.max(el.scrollHeight, minPx), maxPx)}px`;
}

/** Splits pasted / typed text into card titles: one per non-empty line, list markers stripped, max 50. */
export function splitTitles(text: string, max = 50): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+|\[[ xX]?\]\s+)/, "").trim())
    .filter(Boolean)
    .map((t) => t.slice(0, 512))
    .slice(0, max);
}

/**
 * Scrolls only `container` (never the page or the board shell, which `scrollIntoView` would also move)
 * so that `el` is fully visible. Used to keep composers in view.
 */
export function reveal(container: HTMLElement | null, el: HTMLElement | null, axis: "y" | "x" = "y") {
  if (!container || !el) return;
  const c = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (axis === "y") {
    if (r.bottom > c.bottom) container.scrollTop += r.bottom - c.bottom + 8;
    else if (r.top < c.top) container.scrollTop -= c.top - r.top + 8;
  } else {
    if (r.right > c.right) container.scrollLeft += r.right - c.right + 8;
    else if (r.left < c.left) container.scrollLeft -= c.left - r.left + 8;
  }
}

/** Closest ancestor that scrolls on the given axis. */
export function scrollParent(el: HTMLElement | null, axis: "y" | "x" = "y"): HTMLElement | null {
  let n = el?.parentElement ?? null;
  while (n) {
    const o = getComputedStyle(n);
    const v = axis === "y" ? o.overflowY : o.overflowX;
    if (v === "auto" || v === "scroll") return n;
    n = n.parentElement;
  }
  return null;
}
