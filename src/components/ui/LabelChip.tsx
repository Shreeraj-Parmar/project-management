"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/client";
import { labelColor } from "@/lib/constants";

export type LabelChipVariant = "collapsed" | "expanded" | "large";

/**
 * Trello label. `collapsed` = 8px colour bar (card face, labels hidden), `expanded` = 16px pill with
 * name (card face, labels shown), `large` = 32px pill (card back, label picker, filters).
 * `color` is a LABEL_COLORS id (green, yellow, orange, red, purple, blue, sky, lime, pink, black).
 */
export function LabelChip({
  color,
  name,
  variant = "expanded",
  onClick,
  className,
  selected,
  trailing,
}: {
  color: string;
  name?: string;
  variant?: LabelChipVariant;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  /** Large variant: shows a check mark when selected. */
  selected?: boolean;
  trailing?: React.ReactNode;
}) {
  const c = labelColor(color);
  const text = name || c.label;
  const style = { background: c.bg, color: c.fg };
  const base = cn("max-w-full shrink-0 align-middle transition-[filter] hover:brightness-95", variant !== "large" && "inline-block", onClick && "cursor-pointer", className);
  const props = onClick ? { type: "button" as const, onClick } : {};
  const Tag = (onClick ? "button" : "span") as "button";
  if (variant === "collapsed") {
    return <Tag {...props} title={text} aria-label={text} className={cn(base, "h-2 min-w-10 rounded-label")} style={style} />;
  }
  if (variant === "large") {
    return (
      <Tag {...props} title={text} aria-pressed={onClick && selected !== undefined ? selected : undefined} className={cn(base, "flex h-8 w-full items-center gap-2 rounded-control px-3 text-left text-body font-medium")} style={style}>
        <span className="min-w-0 flex-1 truncate">{text}</span>
        {selected ? <Check size={16} aria-hidden /> : null}
        {trailing}
      </Tag>
    );
  }
  return (
    <Tag {...props} title={text} className={cn(base, "h-4 truncate rounded-label px-2 text-body-sm font-medium leading-4")} style={style}>
      {text}
    </Tag>
  );
}
