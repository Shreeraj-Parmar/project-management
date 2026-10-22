"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/client";
import { estimateStrength, STRENGTH_COLOR, STRENGTH_TEXT } from "./password-utils";

/**
 * Bar (red / yellow / green) plus a word, so strength is never conveyed by colour alone.
 * Renders nothing for an empty value.
 */
export function StrengthMeter({ value, className, hint = true }: { value: string; className?: string; hint?: boolean }) {
  const s = estimateStrength(value);
  if (!s) return null;
  return (
    <div className={cn("mt-2", className)}>
      <div className="flex items-center gap-3">
        <ProgressBar value={s.score} label="Password strength" color={STRENGTH_COLOR[s.tone]} className="min-w-0 flex-1" />
        <span role="status" className={cn("w-12 shrink-0 text-right text-body-sm font-semibold", STRENGTH_TEXT[s.tone])}>
          {s.label}
        </span>
      </div>
      {hint && s.tone !== "success" ? <p className="mt-1 text-body-sm text-ink-muted">Use 12 or more characters with letters, numbers and symbols.</p> : null}
    </div>
  );
}
