"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/client";
import { IconButton } from "./Button";
import { getFocusable, hasLayerAbove, isTopLayer, lockScroll, pushLayer, useMounted } from "./layers";

export type ModalSize = "small" | "medium" | "large" | "xlarge";
const SIZE_PX: Record<ModalSize, number> = { small: 400, medium: 600, large: 800, xlarge: 968 };

type ModalCtx = { titleId: string; descId: string; onClose: () => void };
const ModalContext = createContext<ModalCtx | null>(null);
export function useModal() {
  return useContext(ModalContext);
}

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Right-aligned action row (Cancel left of the primary action). */
  footer?: React.ReactNode;
  /**
   * ADS size keyword (small 400, medium 600, large 800, xlarge 968) or, for old call sites,
   * a Tailwind max-width class such as "max-w-md".
   */
  width?: ModalSize | (string & {});
  size?: ModalSize;
  /** Colour bar on top (module accent). */
  accent?: string;
  /** No header: render your own title and use <ModalCloseButton/>. Still pass `title` for the accessible name. */
  hideHeader?: boolean;
  /** Backdrop click closes (default true). Esc always closes. */
  closeOnBackdrop?: boolean;
  /** Removes body padding (full-bleed content such as the card back). */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
  /** Scrim colour. Default ADS scrim; "strong" = card back 64% black. */
  scrim?: "default" | "strong";
};

/**
 * ADS modal dialog. Portal on <body> (never inherits colour or stacking), focus trap + restore,
 * scroll lock, Esc / backdrop close, aria-modal + labelled by the title.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width,
  size,
  accent,
  hideHeader = false,
  closeOnBackdrop = true,
  flush = false,
  className,
  bodyClassName,
  scrim = "default",
}: ModalProps) {
  const mounted = useMounted();
  const uid = useId();
  const titleId = `${uid}-t`;
  const descId = `${uid}-d`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const downOnBackdrop = useRef(false);
  const layerIdRef = useRef(-1);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const close = useCallback(() => onCloseRef.current(), []);

  const keyword: ModalSize | null = size ?? (width && width in SIZE_PX ? (width as ModalSize) : !width ? "medium" : null);
  const widthStyle = keyword ? { maxWidth: SIZE_PX[keyword] } : undefined;
  const legacyClass = keyword ? undefined : width;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const unlock = lockScroll();
    const layer = pushLayer({ el: () => dialogRef.current, close, kind: "modal" });
    layerIdRef.current = layer.id;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isTopLayer(layer.id)) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    // initial focus: [data-autofocus] > first field in the body > first non-close control > dialog
    const t = window.setTimeout(() => {
      const d = dialogRef.current;
      if (!d || d.contains(document.activeElement)) return;
      const body = d.querySelector<HTMLElement>("[data-modal-body]");
      const target =
        d.querySelector<HTMLElement>("[data-autofocus]") ??
        body?.querySelector<HTMLElement>("input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled])") ??
        getFocusable(body).find((el) => !el.closest("[data-modal-footer]")) ??
        null;
      (target ?? d).focus({ preventScroll: true });
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      layer.remove();
      unlock();
      if (prev && prev.isConnected) prev.focus({ preventScroll: true });
    };
  }, [open, close]);

  if (!open || !mounted) return null;

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const d = dialogRef.current;
    const items = getFocusable(d);
    if (!d || items.length === 0) {
      e.preventDefault();
      d?.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === d)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const ariaLabel = typeof title === "string" && hideHeader ? title : undefined;

  return createPortal(
    <ModalContext.Provider value={{ titleId, descId, onClose: close }}>
      <div
        className={cn("anim-blanket fixed inset-0 flex items-start justify-center overflow-y-auto p-4 sm:px-4 sm:py-12", scrim === "strong" ? "bg-scrim-strong" : "bg-scrim")}
        style={{ zIndex: 500 }}
        onMouseDown={(e) => {
          downOnBackdrop.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          if (closeOnBackdrop && downOnBackdrop.current && e.target === e.currentTarget) {
            if (!hasLayerAbove(layerIdRef.current)) close();
          }
          downOnBackdrop.current = false;
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={hideHeader ? undefined : titleId}
          aria-label={ariaLabel}
          aria-describedby={description && !hideHeader ? descId : undefined}
          tabIndex={-1}
          onKeyDown={onKeyDown}
          style={{ ...widthStyle, zIndex: 510 }}
          className={cn(
            "anim-modal relative flex max-h-[calc(100dvh-32px)] w-full flex-col overflow-hidden rounded-modal bg-canvas text-ink shadow-overlay outline-none sm:max-h-[calc(100dvh-96px)]",
            legacyClass,
            className
          )}
        >
          {accent ? <div className="h-1 shrink-0" style={{ background: accent }} aria-hidden /> : null}
          {!hideHeader ? (
            <div className="flex shrink-0 items-start justify-between gap-3 px-6 pb-4 pt-5">
              <div className="min-w-0">
                <h2 id={titleId} className="text-h-m font-semibold text-ink">
                  {title}
                </h2>
                {description ? (
                  <p id={descId} className="mt-1 text-body text-ink-soft">
                    {description}
                  </p>
                ) : null}
              </div>
              <IconButton title="Close" tooltip={false} onClick={close} className="-mr-2 -mt-1">
                <X size={18} />
              </IconButton>
            </div>
          ) : (
            <ModalCloseButton className="absolute right-3 top-3 z-10" />
          )}
          <div data-modal-body className={cn("min-h-0 flex-1 overflow-y-auto", !flush && "px-6", !flush && !footer && "pb-6", !flush && hideHeader && "pt-6", bodyClassName)}>
            {children}
          </div>
          {footer ? (
            <div data-modal-footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 px-6 pb-6 pt-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
}

/** Close X for hideHeader modals (reads onClose from the surrounding Modal). */
export function ModalCloseButton({ className }: { className?: string }) {
  const m = useModal();
  return (
    <IconButton title="Close" tooltip={false} onClick={() => m?.onClose()} className={className}>
      <X size={18} />
    </IconButton>
  );
}
