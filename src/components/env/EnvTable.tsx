"use client";

import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Copy } from "lucide-react";
import { cn, relativeTime } from "@/lib/client";
import { Checkbox, IconButton, Tooltip } from "@/components/ui";
import type { EnvVar } from "@/lib/types";
import type { EnvController, LayoutMode, SortState } from "./types";
import { RowActions } from "./RowActions";
import { Truncate } from "./Truncate";
import { ValueCell } from "./ValueCell";

// The inset shadow is the bottom border (borders do not travel with a sticky cell). The ::before block is a canvas-coloured
// cover for the strip between the scroll container edge and the stuck header, so rows never peek through above it
// (a box-shadow would be clipped by the table painting, a real box is not).
const TH =
  "sticky top-[var(--th-top,0px)] z-[2] h-9 bg-surface px-3 text-left align-middle text-micro font-bold uppercase tracking-wide text-ink-soft shadow-[inset_0_-1px_0_var(--color-line)] before:absolute before:inset-x-0 before:bottom-full before:h-6 before:bg-canvas before:content-['']";

function SortHeader({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-ml-1 inline-flex h-6 items-center gap-1 rounded-control px-1 text-micro font-bold uppercase tracking-wide outline-offset-0 hover:bg-fill hover:text-ink",
        active ? "text-ink" : "text-ink-soft",
      )}
    >
      {label}
      <Icon size={12} aria-hidden className={cn(!active && "opacity-50")} />
      <span className="sr-only">{active ? `, sorted ${dir === "asc" ? "ascending" : "descending"}. Click to reverse.` : ", click to sort"}</span>
    </button>
  );
}

function KeyCell({ v, ctl }: { v: EnvVar; ctl: EnvController }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Truncate text={v.key} className="font-mono text-[13px] font-semibold leading-5 text-ink" />
      <IconButton
        size="sm"
        title={`Copy key ${v.key}`}
        onClick={() => void ctl.copyKey(v)}
        className="shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <Copy size={14} />
      </IconButton>
    </div>
  );
}

/** The data table: sticky header, 44px rows, checkbox column, sortable KEY and UPDATED. Put the add row in `footer`. */
export function EnvTable({
  rows,
  ctl,
  mode,
  sort,
  onSort,
  footer,
  caption,
  stickyTop = 0,
}: {
  rows: EnvVar[];
  ctl: EnvController;
  mode: LayoutMode;
  sort: SortState;
  onSort: (by: SortState["by"]) => void;
  footer?: React.ReactNode;
  caption: string;
  /** Offset of the sticky header (px), e.g. below a sticky selection bar. */
  stickyTop?: number;
}) {
  const showUpdated = mode === "full";
  const noteColumn = mode === "full";
  const allOn = rows.length > 0 && rows.every((r) => ctl.selected.has(r._id));
  const someOn = !allOn && rows.some((r) => ctl.selected.has(r._id));
  const highlightRef = useRef<HTMLTableRowElement | null>(null);
  useEffect(() => {
    if (ctl.highlightId) highlightRef.current?.scrollIntoView({ block: "nearest" });
  }, [ctl.highlightId]);

  return (
    <div className="overflow-clip rounded-card border border-line bg-canvas">
      <table className="w-full table-fixed border-collapse text-body">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col style={{ width: 44 }} />
          <col style={{ width: noteColumn ? "25%" : "38%" }} />
          <col style={noteColumn ? { width: "27%" } : undefined} />
          {noteColumn ? <col /> : null}
          {showUpdated ? <col style={{ width: 96 }} /> : null}
          <col style={{ width: 124 }} />
        </colgroup>
        <thead style={stickyTop ? ({ "--th-top": `${stickyTop}px` } as React.CSSProperties) : undefined}>
          <tr>
            <th scope="col" className={cn(TH, "px-0 text-center")}>
              <Checkbox
                aria-label="Select all variables"
                className="mx-auto"
                checked={allOn}
                indeterminate={someOn}
                onCheckedChange={(on) => ctl.selectAll(on)}
              />
            </th>
            <th scope="col" className={TH} aria-sort={sort.by === "key" ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
              <SortHeader label="Key" active={sort.by === "key"} dir={sort.dir} onClick={() => onSort("key")} />
            </th>
            <th scope="col" className={TH}>
              Value
            </th>
            {noteColumn ? (
              <th scope="col" className={TH}>
                Note
              </th>
            ) : null}
            {showUpdated ? (
              <th scope="col" className={TH} aria-sort={sort.by === "updated" ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                <SortHeader label="Updated" active={sort.by === "updated"} dir={sort.dir} onClick={() => onSort("updated")} />
              </th>
            ) : null}
            <th scope="col" className={TH}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => {
            const selected = ctl.selected.has(v._id);
            const hl = ctl.highlightId === v._id;
            return (
              <tr
                key={v._id}
                ref={hl ? highlightRef : undefined}
                data-selected={selected || undefined}
                className={cn(
                  "group scroll-mt-24 scroll-mb-4 border-t border-line transition-colors duration-500 first:border-t-0 hover:bg-fill-subtle",
                  selected && "bg-brand-soft/60 hover:bg-brand-soft",
                  hl && "bg-brand-soft",
                )}
              >
                <td className="h-11 px-0 py-1 text-center align-middle">
                  <Checkbox aria-label={`Select ${v.key}`} className="mx-auto" checked={selected} onCheckedChange={(on) => ctl.select(v._id, on)} />
                </td>
                <td className="h-11 px-3 py-1 align-middle">
                  <KeyCell v={v} ctl={ctl} />
                  {!noteColumn && v.note ? <Truncate text={v.note} className="text-body-sm text-ink-muted" /> : null}
                </td>
                <td className="h-11 px-3 py-1 align-middle">
                  <ValueCell v={v} shown={ctl.revealed[v._id]} />
                </td>
                {noteColumn ? (
                  <td className="h-11 px-3 py-1 align-middle">{v.note ? <Truncate text={v.note} className="text-body text-ink-soft" /> : null}</td>
                ) : null}
                {showUpdated ? (
                  <td className="h-11 whitespace-nowrap px-3 py-1 align-middle text-body-sm text-ink-muted">
                    <Tooltip content={new Date(v.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}>
                      <time dateTime={v.updatedAt}>{relativeTime(v.updatedAt)}</time>
                    </Tooltip>
                  </td>
                ) : null}
                <td className="h-11 px-2 py-1 align-middle">
                  <RowActions v={v} ctl={ctl} />
                </td>
              </tr>
            );
          })}
          {footer}
        </tbody>
      </table>
    </div>
  );
}
