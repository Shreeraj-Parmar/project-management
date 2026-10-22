"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/client";

/**
 * Trello "mark complete" circle. Outline when open, solid green with a white check when complete.
 * A real button with role="checkbox" so Space / Enter toggle it and screen readers announce the state.
 */
export function CompleteCircle({ checked, onChange, size = 20, className }: { checked: boolean; onChange: (next: boolean) => void; size?: number; className?: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={checked ? "Mark card incomplete" : "Mark card complete"}
      title={checked ? "Mark incomplete" : "Mark complete"}
      onClick={() => onChange(!checked)}
      style={{ width: size, height: size }}
      className={cn(
        "group/complete inline-flex shrink-0 items-center justify-center rounded-full text-white transition-colors",
        checked ? "bg-success hover:bg-success-dark" : "bg-white shadow-[inset_0_0_0_2px_#8590a2] hover:bg-surface hover:shadow-[inset_0_0_0_2px_#44546f]",
        className
      )}
    >
      <Check size={Math.round(size * 0.65)} strokeWidth={3.5} className={cn(checked ? "opacity-100" : "text-ink-soft opacity-0 group-hover/complete:opacity-100")} aria-hidden />
    </button>
  );
}
