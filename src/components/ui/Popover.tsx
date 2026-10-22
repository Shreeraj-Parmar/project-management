"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/client";
import { IconButton } from "./Button";
import { getFocusable, isInsideLayerAbove, isTopLayer, pushLayer, useIsoLayoutEffect } from "./layers";

export type PopoverPlacement =
  | "bottom-start"
  | "bottom-end"
  | "bottom"
  | "top-start"
  | "top-end"
  | "top"
  | "right-start"
  | "left-start";

export type PopoverApi = { close: () => void };

type Ctx = { role: "dialog" | "menu"; close: () => void };
const PopoverCtx = createContext<Ctx>({ role: "dialog", close: () => {} });
export function usePopover() {
  return useContext(PopoverCtx);
}

export type PopoverProps = {
  /** Controlled open state. Omit for uncontrolled (use with `trigger`). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that toggles the popover (wrapped in an inline-flex span). */
  trigger?: React.ReactNode;
  /** Anchor to an element that lives elsewhere (controlled mode). */
  anchorRef?: React.RefObject<HTMLElement | null>;
  anchor?: HTMLElement | null;
  /** Trello header: centered title + close button. Omit title for a header-less dropdown. */
  title?: React.ReactNode;
  /** Shows the back chevron (drill-down popovers). */
  onBack?: () => void;
  hideClose?: boolean;
  /** Pixels, a CSS length, or "auto" (size to content / className). Default 304. */
  width?: number | string;
  placement?: PopoverPlacement;
  offset?: number;
  children: React.ReactNode | ((api: PopoverApi) => React.ReactNode);
  className?: string;
  bodyClassName?: string;
  /** Body padding 0 12px 12px. Default true. Menus use false. */
  padded?: boolean;
  role?: "dialog" | "menu";
  ariaLabel?: string;
  /** auto: first input, else first item/control. container: the panel itself. none: do not move focus. */
  initialFocus?: "auto" | "container" | "none";
  /** Below 640px render as a bottom sheet (default true for dialogs, false for menus). */
  mobileSheet?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  restoreFocus?: boolean;
  triggerClassName?: string;
};

function usePrefersSheet(enabled: boolean) {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const on = () => setSmall(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [enabled]);
  return enabled && small;
}

export function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  trigger,
  anchorRef,
  anchor,
  title,
  onBack,
  hideClose,
  width,
  placement = "bottom-start",
  offset = 4,
  children,
  className,
  bodyClassName,
  padded = true,
  role = "dialog",
  ariaLabel,
  initialFocus = "auto",
  mobileSheet,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  restoreFocus = true,
  triggerClassName,
}: PopoverProps) {
  const controlled = openProp !== undefined;
  const [inner, setInner] = useState(defaultOpen);
  const open = controlled ? !!openProp : inner;
  const titleId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const sheet = usePrefersSheet(mobileSheet ?? role !== "menu");
  const openRef = useRef(open);
  openRef.current = open;
  const cbRef = useRef(onOpenChange);
  cbRef.current = onOpenChange;

  const setOpen = useCallback(
    (v: boolean) => {
      if (!controlled) setInner(v);
      cbRef.current?.(v);
    },
    [controlled]
  );
  const close = useCallback(() => setOpen(false), [setOpen]);

  const getAnchor = useCallback((): HTMLElement | null => anchor ?? anchorRef?.current ?? triggerRef.current, [anchor, anchorRef]);

  // ---- positioning
  const place = useCallback(() => {
    const surface = surfaceRef.current;
    const a = getAnchor();
    if (!surface || sheet) return;
    if (!a || !a.isConnected) {
      if (openRef.current && !a?.isConnected && (anchor || anchorRef)) setOpen(false);
      return;
    }
    const r = a.getBoundingClientRect();
    const w = surface.offsetWidth;
    const h = surface.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const m = 8;
    const [side, align = "center"] = placement.split("-") as [string, string?];
    let top = 0;
    let left = 0;
    let s = side;
    if (s === "bottom" && r.bottom + offset + h > vh - m && r.top - offset - h >= m) s = "top";
    else if (s === "top" && r.top - offset - h < m && r.bottom + offset + h <= vh - m) s = "bottom";
    else if (s === "right" && r.right + offset + w > vw - m && r.left - offset - w >= m) s = "left";
    else if (s === "left" && r.left - offset - w < m && r.right + offset + w <= vw - m) s = "right";
    if (s === "bottom" || s === "top") {
      top = s === "bottom" ? r.bottom + offset : r.top - offset - h;
      left = align === "end" ? r.right - w : align === "start" ? r.left : r.left + r.width / 2 - w / 2;
    } else {
      left = s === "right" ? r.right + offset : r.left - offset - w;
      top = r.top;
    }
    left = Math.max(m, Math.min(left, vw - w - m));
    top = Math.max(m, Math.min(top, vh - h - m));
    setPos((p) => (p && Math.abs(p.top - top) < 0.5 && Math.abs(p.left - left) < 0.5 ? p : { top, left }));
  }, [getAnchor, placement, offset, sheet, anchor, anchorRef, setOpen]);

  useIsoLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
  }, [open, place, children]);

  useEffect(() => {
    if (!open) return;
    const on = () => place();
    window.addEventListener("resize", on);
    window.addEventListener("scroll", on, true);
    const ro = typeof ResizeObserver !== "undefined" && surfaceRef.current ? new ResizeObserver(on) : null;
    if (ro && surfaceRef.current) ro.observe(surfaceRef.current);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("scroll", on, true);
      ro?.disconnect();
    };
  }, [open, place]);

  // ---- layer stack, Esc, outside click
  useEffect(() => {
    if (!open) return;
    const layer = pushLayer({ el: () => surfaceRef.current, anchor: getAnchor, close, kind: "popover" });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEsc && isTopLayer(layer.id)) {
        e.preventDefault();
        close();
      }
    };
    const onDown = (e: Event) => {
      if (!closeOnOutsideClick) return;
      const t = e.target as Node | null;
      if (!t) return;
      if (surfaceRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      const a = getAnchor();
      if (a?.contains(t)) return;
      if (isInsideLayerAbove(layer.id, t)) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
      layer.remove();
    };
  }, [open, close, closeOnEsc, closeOnOutsideClick, getAnchor]);

  // ---- focus: move in on open, restore on close
  const ready = open && (sheet || pos !== null);
  const focusedRef = useRef(false);
  const prevFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open && !prevFocus.current) prevFocus.current = document.activeElement as HTMLElement | null;
    if (!open) {
      const prev = prevFocus.current;
      prevFocus.current = null;
      focusedRef.current = false;
      if (restoreFocus && prev && prev.isConnected) {
        const active = document.activeElement;
        if (!active || active === document.body) prev.focus({ preventScroll: true });
      }
    }
  }, [open, restoreFocus]);
  useEffect(() => {
    if (!ready || focusedRef.current) return;
    focusedRef.current = true;
    const surface = surfaceRef.current;
    if (!surface || initialFocus === "none") return;
    let target: HTMLElement | null = null;
    if (initialFocus === "auto") {
      if (role === "menu") target = surface.querySelector<HTMLElement>('[role^="menuitem"]:not([disabled]):not([aria-disabled="true"])');
      if (!target) target = surface.querySelector<HTMLElement>("[data-autofocus], input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])");
      if (!target) target = getFocusable(surface).find((el) => !el.hasAttribute("data-popover-chrome")) ?? null;
    }
    const el = target ?? surface;
    requestAnimationFrame(() => {
      if (el.isConnected) el.focus({ preventScroll: true });
    });
  }, [ready, initialFocus, role]);

  // ---- aria on the trigger's first focusable child
  useEffect(() => {
    const el = triggerRef.current?.querySelector<HTMLElement>("button, a[href], [tabindex], input");
    if (!el || !trigger) return;
    el.setAttribute("aria-haspopup", role === "menu" ? "menu" : "dialog");
    el.setAttribute("aria-expanded", open ? "true" : "false");
  }, [open, role, trigger]);

  // ---- menu keyboard
  const typeahead = useRef({ s: "", t: 0 });
  const onSurfaceKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Tab" && role === "menu") {
      close();
      return;
    }
    if (role !== "menu") return;
    const items = Array.from(surfaceRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled]):not([aria-disabled="true"])') ?? []);
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    let next: HTMLElement | undefined;
    if (e.key === "ArrowDown") next = items[(i + 1) % items.length];
    else if (e.key === "ArrowUp") next = items[(i - 1 + items.length) % items.length];
    else if (e.key === "Home") next = items[0];
    else if (e.key === "End") next = items[items.length - 1];
    else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      const ta = typeahead.current;
      ta.s = now - ta.t > 700 ? e.key.toLowerCase() : ta.s + e.key.toLowerCase();
      ta.t = now;
      next = items.slice(i + 1).concat(items.slice(0, i + 1)).find((el) => (el.textContent ?? "").trim().toLowerCase().startsWith(ta.s));
    } else return;
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };

  const ctx = useMemo<Ctx>(() => ({ role, close }), [role, close]);
  const hasHeader = title !== undefined && title !== null;
  const widthStyle = width === "auto" ? undefined : typeof width === "number" ? width : (width ?? 304);

  const surface = open ? (
    <PopoverCtx.Provider value={ctx}>
      {sheet ? <div className="anim-blanket fixed inset-0 bg-scrim" style={{ zIndex: 399 }} aria-hidden /> : null}
      <div
        ref={surfaceRef}
        role={role}
        aria-label={!hasHeader ? ariaLabel : undefined}
        aria-labelledby={hasHeader ? titleId : undefined}
        aria-modal={sheet ? true : undefined}
        tabIndex={-1}
        onKeyDown={onSurfaceKeyDown}
        style={
          sheet
            ? { position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 400 }
            : { position: "fixed", top: pos?.top ?? 0, left: pos?.left ?? 0, width: widthStyle, visibility: pos ? "visible" : "hidden", zIndex: 400 }
        }
        className={cn(
          "popover-surface flex flex-col outline-none",
          sheet ? "anim-sheet max-h-[85dvh] rounded-b-none rounded-t-list pb-[env(safe-area-inset-bottom)]" : "anim-pop max-h-[calc(100dvh-16px)] max-w-[calc(100vw-16px)]",
          className
        )}
      >
        {hasHeader || sheet ? (
          <div className="relative mb-2 flex h-10 shrink-0 items-center justify-center px-10">
            {onBack ? <IconButton data-popover-chrome title="Back" tooltip={false} onClick={onBack} className="absolute left-2 top-1"><ChevronLeft size={16} /></IconButton> : null}
            <h2 id={titleId} className="truncate text-h-xs font-semibold text-ink-soft">
              {title}
            </h2>
            {!hideClose ? (
              <IconButton data-popover-chrome title="Close popover" tooltip={false} onClick={close} className="absolute right-2 top-1">
                <X size={16} />
              </IconButton>
            ) : null}
          </div>
        ) : null}
        <div className={cn("min-h-0 flex-1 overflow-y-auto", padded && (hasHeader || sheet ? "px-3 pb-3" : "p-3"), bodyClassName)}>
          {typeof children === "function" ? children({ close }) : children}
        </div>
      </div>
    </PopoverCtx.Provider>
  ) : null;

  return (
    <>
      {trigger !== undefined ? (
        <span
          ref={triggerRef}
          className={cn("inline-flex", triggerClassName)}
          onClick={() => setOpen(!openRef.current)}
          onKeyDown={(e) => {
            if (role === "menu" && e.key === "ArrowDown" && !openRef.current) {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          {trigger}
        </span>
      ) : null}
      {surface && typeof document !== "undefined" ? createPortal(surface, document.body) : null}
    </>
  );
}

/** Small caption + content block inside a popover body (12/16 600 subtle label, 16px above). */
export function PopoverSection({ title, children, className, first }: { title?: React.ReactNode; children: React.ReactNode; className?: string; first?: boolean }) {
  return (
    <section className={cn(!first && "mt-4", first && "mt-0", className)}>
      {title ? <h3 className="mb-1 text-h-xxs font-semibold text-ink-soft">{title}</h3> : null}
      {children}
    </section>
  );
}

export function PopoverDivider({ className }: { className?: string }) {
  return <hr role="separator" className={cn("my-2 border-0 border-t border-fill-hover", className)} />;
}

export function PopoverFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mt-3 flex items-center justify-end gap-2", className)}>{children}</div>;
}

type ItemProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  description?: React.ReactNode;
  selected?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  href?: string;
  target?: string;
  /** Close the popover after click. Default: true inside a menu, false in a dialog popover. */
  closeOnClick?: boolean;
  className?: string;
  title?: string;
  "data-testid"?: string;
};

/** Row for list-style popovers and menus. Becomes role="menuitem" automatically inside a Menu. */
export function PopoverItem({ children, icon, trailing, description, selected, danger, disabled, onClick, href, target, closeOnClick, className, ...rest }: ItemProps) {
  const ctx = useContext(PopoverCtx);
  const isMenu = ctx.role === "menu";
  const role = isMenu ? (selected !== undefined ? "menuitemradio" : "menuitem") : undefined;
  const shouldClose = closeOnClick ?? isMenu;
  const content = (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{children}</span>
        {description ? <span className="block truncate text-body-sm text-ink-muted">{description}</span> : null}
      </span>
      {trailing}
    </>
  );
  const common = {
    role,
    "aria-checked": role === "menuitemradio" ? !!selected : undefined,
    "aria-pressed": !isMenu && selected !== undefined ? selected : undefined,
    "data-selected": selected ? "true" : undefined,
    "data-danger": danger ? "true" : undefined,
    "aria-disabled": disabled || undefined,
    className: cn("menu-item", className),
    title: rest.title,
    "data-testid": rest["data-testid"],
  };
  const handle = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
    if (shouldClose && !e.defaultPrevented) ctx.close();
  };
  if (href && !disabled) {
    return (
      <Link href={href} target={target} {...common} onClick={handle}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" {...common} disabled={disabled} onClick={handle}>
      {content}
    </button>
  );
}
