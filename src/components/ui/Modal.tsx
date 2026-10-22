"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/client";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = "max-w-lg",
  accent,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  accent?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#091e42]/60 p-4 pt-12 sm:pt-20" onMouseDown={onClose}>
      <div
        className={cn("fade-in w-full rounded-xl bg-white shadow-[var(--shadow-overlay)]", width)}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between rounded-t-xl border-b border-line px-5 py-3" style={accent ? { borderTop: `4px solid ${accent}` } : undefined}>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-ink-soft hover:bg-[#091e420f]" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
