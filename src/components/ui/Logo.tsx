"use client";

import { cn } from "@/lib/client";

export type LogoSize = "sm" | "md" | "lg" | "xl" | number;
const PX: Record<Exclude<LogoSize, number>, number> = { sm: 20, md: 24, lg: 32, xl: 48 };

/** The DevBoard mark: rounded square with two board columns. `variant="white"` for dark / gradient backgrounds. */
export function LogoMark({ size = "md", variant = "color", className }: { size?: LogoSize; variant?: "color" | "white"; className?: string }) {
  const px = typeof size === "number" ? size : PX[size];
  const white = variant === "white";
  return (
    <svg viewBox="0 0 64 64" width={px} height={px} className={cn("shrink-0", className)} aria-hidden>
      <rect width="64" height="64" rx="14" fill={white ? "#ffffff" : "#0c66e4"} />
      <rect x="12" y="12" width="17" height="40" rx="3.5" fill={white ? "#0c66e4" : "#ffffff"} />
      <rect x="35" y="12" width="17" height="26" rx="3.5" fill={white ? "#0c66e4" : "#ffffff"} />
    </svg>
  );
}

/**
 * Mark + "DevBoard" wordmark. `variant="color"` (blue mark, dark text) for light surfaces,
 * `variant="white"` (white mark, white text) for the glass header and dark backgrounds.
 * Wrap in <Link href="/boards"> yourself.
 */
export function Logo({ size = "md", variant = "color", showWordmark = true, className }: { size?: LogoSize; variant?: "color" | "white"; showWordmark?: boolean; className?: string }) {
  const px = typeof size === "number" ? size : PX[size];
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} variant={variant} />
      {showWordmark ? (
        <span className={cn("font-bold tracking-tight", variant === "white" ? "text-white" : "text-ink")} style={{ fontSize: Math.round(px * 0.72), lineHeight: 1 }}>
          DevBoard
        </span>
      ) : (
        <span className="sr-only">DevBoard</span>
      )}
    </span>
  );
}
