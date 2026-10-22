"use client";

import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsoLayoutEffect } from "./layers";

type Placement = "top" | "bottom" | "left" | "right";

/**
 * ADS tooltip: #172B4D, white 12/16 text, 3px radius, no arrow, 4px offset, 300ms delay.
 * Wraps ONE element (cloned, no extra DOM). Disabled buttons do not fire mouse events:
 * wrap them in a span first.
 *
 *   <Tooltip content="Star board"><IconButton ... /></Tooltip>
 */
export function Tooltip({
  content,
  children,
  placement = "top",
  delay = 300,
  disabled,
}: {
  content: React.ReactNode;
  children: React.ReactElement<Record<string, unknown>>;
  placement?: Placement;
  delay?: number;
  disabled?: boolean;
}) {
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setAnchor(null);
    setPos(null);
  }, []);

  const show = useCallback(
    (el: HTMLElement, immediate?: boolean) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setAnchor(el), immediate ? 0 : delay);
    },
    [delay]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  // Esc / scroll hide
  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [anchor, hide]);

  useIsoLayoutEffect(() => {
    if (!anchor || !tipRef.current) return;
    const a = anchor.getBoundingClientRect();
    const t = tipRef.current.getBoundingClientRect();
    const gap = 4;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let p = placement;
    if (p === "top" && a.top - t.height - gap < 4) p = "bottom";
    else if (p === "bottom" && a.bottom + t.height + gap > vh - 4) p = "top";
    else if (p === "left" && a.left - t.width - gap < 4) p = "right";
    else if (p === "right" && a.right + t.width + gap > vw - 4) p = "left";
    let top = 0;
    let left = 0;
    if (p === "top" || p === "bottom") {
      top = p === "top" ? a.top - t.height - gap : a.bottom + gap;
      left = a.left + a.width / 2 - t.width / 2;
    } else {
      left = p === "left" ? a.left - t.width - gap : a.right + gap;
      top = a.top + a.height / 2 - t.height / 2;
    }
    left = Math.max(8, Math.min(left, vw - t.width - 8));
    top = Math.max(8, Math.min(top, vh - t.height - 8));
    setPos({ top, left });
  }, [anchor, placement, content]);

  if (!isValidElement(children) || disabled || content === null || content === undefined || content === "") return children;

  const child = children as React.ReactElement<Record<string, unknown>>;
  const cp = child.props as Record<string, unknown>;
  const call = (name: string, e: unknown) => {
    const fn = cp[name];
    if (typeof fn === "function") (fn as (e: unknown) => void)(e);
  };

  const cloned = cloneElement(child, {
    "aria-describedby": anchor ? id : (cp["aria-describedby"] as string | undefined),
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      call("onMouseEnter", e);
      show(e.currentTarget);
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      call("onMouseLeave", e);
      hide();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      call("onFocus", e);
      if (e.currentTarget.matches(":focus-visible")) show(e.currentTarget, true);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      call("onBlur", e);
      hide();
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      call("onPointerDown", e);
      hide();
    },
  });

  return (
    <>
      {cloned}
      {anchor && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={tipRef}
              id={id}
              role="tooltip"
              style={{ position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? "visible" : "hidden", zIndex: 800 }}
              className="pointer-events-none max-w-[240px] rounded-control bg-tooltip px-2 py-1 text-body-sm text-white"
            >
              {content}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
