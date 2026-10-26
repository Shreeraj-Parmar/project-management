"use client";

import { useEffect, useRef } from "react";
import { cn, relativeTime } from "@/lib/client";
import { Checkbox } from "@/components/ui";
import type { EnvVar } from "@/lib/types";
import type { EnvController } from "./types";
import { TagChips } from "./EnvTags";
import { RowActions, RowMenu } from "./RowActions";
import { ValueCell } from "./ValueCell";

/** Narrow layout: one card per variable. Key and value wrap instead of truncating, controls are 32px+. */
export function EnvCards({ rows, ctl, footer, label }: { rows: EnvVar[]; ctl: EnvController; footer?: React.ReactNode; label: string }) {
  const allOn = rows.length > 0 && rows.every((r) => ctl.selected.has(r._id));
  const someOn = !allOn && rows.some((r) => ctl.selected.has(r._id));
  const highlightRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    if (ctl.highlightId) highlightRef.current?.scrollIntoView({ block: "nearest" });
  }, [ctl.highlightId]);

  return (
    <div>
      <div className="mb-2 flex items-center px-1">
        <Checkbox className="-m-2 p-2" label="Select all" checked={allOn} indeterminate={someOn} onCheckedChange={(on) => ctl.selectAll(on)} />
      </div>
      <ul aria-label={label} className="space-y-2">
        {rows.map((v) => {
          const selected = ctl.selected.has(v._id);
          const hl = ctl.highlightId === v._id;
          return (
            <li
              key={v._id}
              ref={hl ? highlightRef : undefined}
              className={cn(
                "scroll-mt-24 scroll-mb-4 rounded-card border bg-canvas p-3 transition-colors",
                selected ? "border-brand/50 bg-brand-soft/50" : "border-line",
                hl && "bg-brand-soft",
              )}
            >
              <div className="flex items-start gap-2">
                <Checkbox className="-m-2 p-2" aria-label={`Select ${v.key}`} checked={selected} onCheckedChange={(on) => ctl.select(v._id, on)} />
                <div className="min-w-0 flex-1 break-all pt-px font-mono text-[13px] font-semibold leading-5 text-ink">{v.key}</div>
                <div className="-my-1 -mr-1 shrink-0">
                  <RowMenu v={v} ctl={ctl} />
                </div>
              </div>
              <div className="mt-2 pl-6">
                <TagChips tags={v.tags} className="mb-2" />
                <ValueCell v={v} shown={ctl.revealed[v._id]} wrap />
                {v.note ? <p className="mt-2 break-words text-body text-ink-soft">{v.note}</p> : null}
              </div>
              <div className="-mb-1 mt-2 flex items-center justify-between gap-2 pl-6">
                <time dateTime={v.updatedAt} className="text-body-sm text-ink-muted">
                  Updated {relativeTime(v.updatedAt)}
                </time>
                <RowActions v={v} ctl={ctl} withMenu={false} />
              </div>
            </li>
          );
        })}
      </ul>
      {footer ? <div className="mt-2">{footer}</div> : null}
    </div>
  );
}
