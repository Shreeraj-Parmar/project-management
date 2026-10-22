"use client";

import { cn } from "@/lib/client";

/** ADS progress bar. 8px track, blue fill that turns green at 100%. `showValue` adds the Trello checklist percentage label. */
export function ProgressBar({
  value,
  max = 100,
  label,
  showValue,
  size = "md",
  color,
  className,
}: {
  value: number;
  max?: number;
  /** Accessible name. */
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
  /** Fill colour override (disables the green-at-100% rule). */
  color?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showValue ? <span className="w-8 shrink-0 text-micro text-ink-soft">{pct}%</span> : null}
      <div
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? "Progress"}
        className={cn("w-full overflow-hidden rounded-full bg-neutral-300", size === "sm" ? "h-1" : "h-2")}
      >
        <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${pct}%`, background: color ?? (pct >= 100 ? "#1f845a" : "#0c66e4") }} />
      </div>
    </div>
  );
}
