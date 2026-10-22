"use client";

import { cn } from "@/lib/client";

export type LozengeAppearance = "default" | "success" | "removed" | "inprogress" | "new" | "moved" | "warning";

/**
 * ADS lozenge: 16px, 11/16 bold uppercase status tag. `bold` = solid fill.
 *   <Lozenge appearance="success">Done</Lozenge>   <Lozenge appearance="removed" bold>Overdue</Lozenge>
 */
export function Lozenge({
  appearance = "default",
  bold = false,
  icon,
  children,
  className,
  maxWidth,
}: {
  appearance?: LozengeAppearance;
  bold?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidth?: number;
}) {
  return (
    <span className={cn("lozenge", className)} data-appearance={appearance} data-bold={bold ? "true" : undefined} style={maxWidth ? { maxWidth } : undefined}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
