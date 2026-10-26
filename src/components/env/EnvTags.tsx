"use client";

import { Tag, X } from "lucide-react";
import { cn } from "@/lib/client";
import { labelColor } from "@/lib/constants";

const COLORS = ["blue", "green", "purple", "orange", "sky", "pink", "lime", "yellow", "red"];

/** Same tag, same colour, everywhere. */
function tagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) | 0;
  return labelColor(COLORS[Math.abs(h) % COLORS.length]);
}

export function TagChip({ tag, className }: { tag: string; className?: string }) {
  const c = tagColor(tag);
  return (
    <span
      className={cn("inline-flex h-[18px] max-w-[140px] items-center truncate rounded-[3px] px-1.5 text-[11px] font-semibold leading-none", className)}
      style={{ background: c.bg, color: c.fg }}
      title={tag}
    >
      {tag}
    </span>
  );
}

export function TagChips({ tags, className }: { tags: string[] | undefined; className?: string }) {
  if (!tags?.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {tags.map((t) => (
        <TagChip key={t} tag={t} />
      ))}
    </div>
  );
}

/** "Filter by tag" chips above the list. Clicking the active tag clears the filter. */
export function TagFilter({ tags, value, onChange }: { tags: string[]; value: string | null; onChange: (tag: string | null) => void }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by tag">
      <span className="mr-0.5 inline-flex items-center gap-1 text-body-sm text-ink-muted">
        <Tag size={14} aria-hidden /> Tags
      </span>
      {tags.map((t) => {
        const on = value === t;
        const c = tagColor(t);
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? null : t)}
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded-control px-2 text-body-sm font-semibold transition-[filter,box-shadow] hover:brightness-95",
              on ? "ring-2 ring-brand ring-offset-1" : "opacity-80 hover:opacity-100",
            )}
            style={{ background: c.bg, color: c.fg }}
          >
            {t}
            {on ? <X size={12} aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}
