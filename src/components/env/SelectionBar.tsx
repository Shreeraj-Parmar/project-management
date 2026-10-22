"use client";

import { useLayoutEffect, useRef } from "react";
import { Copy, CopyPlus, Trash2, X } from "lucide-react";
import { Button, IconButton, Menu, MenuItem, MenuLabel } from "@/components/ui";
import { envLabel } from "./utils";

/** Bulk actions. Takes the place of the toolbar while rows are selected, so nothing shifts. */
export function SelectionBar({
  count,
  of,
  filtered,
  otherEnvironments,
  onClear,
  onCopy,
  onDuplicate,
  onDelete,
  onHeight,
  compact,
}: {
  count: number;
  of: number;
  filtered: boolean;
  otherEnvironments: string[];
  onClear: () => void;
  onCopy: () => void;
  onDuplicate: (target: string) => void;
  onDelete: () => void;
  /** Reports the bar height so the table header can stick right below it. */
  onHeight?: (h: number) => void;
  /** Narrow layout: icon buttons on a single row. */
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !onHeight) return;
    const report = () => onHeight(el.getBoundingClientRect().height);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => {
      ro.disconnect();
      onHeight(0);
    };
  }, [onHeight]);
  return (
    <div ref={ref} className="sticky top-0 z-[3] bg-canvas before:absolute before:inset-x-0 before:bottom-full before:h-6 before:bg-canvas before:content-['']">
      <div role="toolbar" aria-label="Selected variables" className="flex min-h-10 items-center gap-2 rounded-card bg-brand-soft px-2 py-1">
        <IconButton title="Clear selection" onClick={onClear}>
          <X size={16} />
        </IconButton>
        <p className="text-body font-semibold text-ink" aria-live="polite">
          {count} selected
          <span className="ml-1 font-normal text-ink-soft">
            of {of}
            {filtered ? " shown" : ""}
          </span>
        </p>
        <div className="ml-auto flex items-center gap-2">
          {compact ? (
            <IconButton title="Copy as .env" variant="secondary" onClick={onCopy}>
              <Copy size={16} />
            </IconButton>
          ) : (
            <Button variant="secondary" size="md" icon={<Copy size={16} />} onClick={onCopy}>
              Copy as .env
            </Button>
          )}
          {otherEnvironments.length > 0 ? (
            <Menu
              width="w-56"
              ariaLabel="Duplicate selected to"
              trigger={
                compact ? (
                  <IconButton title="Duplicate to" variant="secondary">
                    <CopyPlus size={16} />
                  </IconButton>
                ) : (
                  <Button variant="secondary" size="md" icon={<CopyPlus size={16} />}>
                    Duplicate to
                  </Button>
                )
              }
            >
              <MenuLabel>Duplicate to</MenuLabel>
              {otherEnvironments.map((e) => (
                <MenuItem key={e} onClick={() => onDuplicate(e)}>
                  {envLabel(e)}
                </MenuItem>
              ))}
            </Menu>
          ) : null}
          {compact ? (
            <IconButton title="Delete selected" variant="danger" onClick={onDelete}>
              <Trash2 size={16} />
            </IconButton>
          ) : (
            <Button variant="danger" size="md" icon={<Trash2 size={16} />} onClick={onDelete}>
              Delete selected
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
