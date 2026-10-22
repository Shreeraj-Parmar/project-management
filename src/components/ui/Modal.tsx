"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/client";

/**
 * Dialog rendered in a portal on <body>, so it never inherits colors / stacking
 * context from wherever it is opened (e.g. the white-text top navigation).
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-lg",
  accent,
  hideHeader = false,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  accent?: string;
  hideHeader?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#091e42]/60 p-4 pt-10 text-ink sm:pt-16"
      onMouseDown={onClose}
    >
      <div
        className={cn("fade-in w-full rounded-xl bg-white text-ink shadow-[var(--shadow-overlay)]", width)}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
      >
        {!hideHeader ? (
          <div className="flex items-start justify-between gap-3 rounded-t-xl border-b border-line px-5 py-3" style={accent ? { borderTop: `4px solid ${accent}` } : undefined}>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink">{title}</h2>
              {description ? <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p> : null}
            </div>
            <button onClick={onClose} className="-mr-1 rounded p-1 text-ink-soft hover:bg-[#091e420f] hover:text-ink" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="absolute right-3 top-3 z-10 rounded p-1 text-ink-soft hover:bg-[#091e420f] hover:text-ink" aria-label="Close">
            <X size={18} />
          </button>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
