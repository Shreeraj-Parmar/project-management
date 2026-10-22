"use client";

import { useEffect, useLayoutEffect, useState } from "react";

/**
 * Layer stack shared by Modal and Popover so that one Esc press dismisses exactly one layer
 * (the innermost / most recently opened one) and an outside click ignores clicks that land
 * inside a layer that sits above.
 */
type Layer = { id: number; el: () => HTMLElement | null; anchor?: () => HTMLElement | null; close: () => void; kind: "popover" | "modal" };

let counter = 0;
const stack: Layer[] = [];

export function pushLayer(layer: Omit<Layer, "id">): { id: number; remove: () => void } {
  const id = ++counter;
  stack.push({ ...layer, id });
  return {
    id,
    remove: () => {
      const i = stack.findIndex((l) => l.id === id);
      if (i >= 0) stack.splice(i, 1);
    },
  };
}

export function isTopLayer(id: number): boolean {
  return stack.length > 0 && stack[stack.length - 1].id === id;
}

/** True when `target` is inside a layer registered after `id` (a nested popover / modal above). */
export function isInsideLayerAbove(id: number, target: Node): boolean {
  const idx = stack.findIndex((l) => l.id === id);
  for (let i = idx + 1; i < stack.length; i++) {
    const el = stack[i].el();
    const anchor = stack[i].anchor?.();
    if (el?.contains(target) || anchor?.contains(target)) return true;
  }
  return false;
}

export function hasLayerAbove(id: number): boolean {
  const idx = stack.findIndex((l) => l.id === id);
  return idx >= 0 && idx < stack.length - 1;
}

export const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** True after hydration. Use before touching document / portals. */
export function useMounted(): boolean {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true" && (el.offsetParent !== null || el === document.activeElement || getComputedStyle(el).position === "fixed")
  );
}

/** Body scroll lock with a counter so nested modals do not unlock each other. */
let lockCount = 0;
let prevOverflow = "";
let prevPad = "";
export function lockScroll() {
  if (typeof document === "undefined") return () => {};
  if (lockCount === 0) {
    const body = document.body;
    prevOverflow = body.style.overflow;
    prevPad = body.style.paddingRight;
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (sbw > 0) body.style.paddingRight = `${sbw}px`;
  }
  lockCount++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount--;
    if (lockCount === 0) {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPad;
    }
  };
}
