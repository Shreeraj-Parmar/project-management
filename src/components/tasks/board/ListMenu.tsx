"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownUp, Check, ChevronRight, MoreHorizontal, MoveHorizontal, Palette, Pencil, Plus, Trash2 } from "lucide-react";
import { LABEL_COLORS, labelColor } from "@/lib/constants";
import type { Column } from "@/lib/types";
import { Button, Field, IconButton, Popover, PopoverDivider, PopoverItem, Select } from "@/components/ui";
import type { SortBy } from "./useBoard";

type View = "root" | "color" | "sort" | "move";

const SORTS: { id: SortBy; label: string; description: string }[] = [
  { id: "priority", label: "Priority", description: "Urgent first" },
  { id: "due", label: "Due date", description: "Soonest first" },
  { id: "created", label: "Date created", description: "Newest first" },
  { id: "title", label: "Card name", description: "A to Z" },
];

/** The "..." list actions popover: Add card, Rename, Change colour, Move, Sort by, Delete. */
export function ListMenu({
  column,
  columns,
  cardCount,
  onAddCard,
  onRename,
  onColor,
  onSort,
  onMove,
  onDelete,
}: {
  column: Column;
  columns: Column[];
  cardCount: number;
  onAddCard: () => void;
  onRename: () => void;
  onColor: (color: string) => void;
  onSort: (by: SortBy) => void;
  onMove: (toIndex: number) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("root");
  const index = columns.findIndex((c) => c.id === column.id);
  const [position, setPosition] = useState(index + 1);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setView("root");
      setPosition(index + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Arrow keys move between rows (Tab works too); the popover itself is a dialog so the colour swatches stay reachable.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const rows = Array.from(bodyRef.current?.querySelectorAll<HTMLElement>("button.menu-item:not([disabled]):not([aria-disabled='true'])") ?? []);
    if (!rows.length) return;
    const i = rows.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? rows[(i + 1) % rows.length] : rows[(i - 1 + rows.length) % rows.length];
    e.preventDefault();
    next.focus();
  }

  const title = view === "color" ? "Change list colour" : view === "sort" ? "Sort list by" : view === "move" ? "Move list" : "List actions";
  const chevron = <ChevronRight size={16} className="text-ink-muted" />;
  const current = labelColor(column.color);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <IconButton title="List actions" aria-label={`List actions: ${column.title}`} aria-expanded={open} className="shrink-0">
          <MoreHorizontal size={16} />
        </IconButton>
      }
      title={title}
      onBack={view === "root" ? undefined : () => setView("root")}
      placement="bottom-start"
      width={304}
    >
      <div ref={bodyRef} onKeyDown={onKeyDown}>
        {view === "root" ? (
          <div className="-mx-3 flex flex-col">
            <PopoverItem icon={<Plus size={16} />} closeOnClick onClick={onAddCard}>
              Add card
            </PopoverItem>
            <PopoverItem icon={<Pencil size={16} />} closeOnClick onClick={onRename}>
              Rename list
            </PopoverItem>
            <PopoverItem
              icon={<Palette size={16} />}
              trailing={
                <span className="flex items-center gap-1">
                  <span aria-hidden className="h-4 w-6 rounded-label" style={{ background: current.bg }} />
                  {chevron}
                </span>
              }
              onClick={() => setView("color")}
            >
              Change list colour
            </PopoverItem>
            <PopoverItem icon={<MoveHorizontal size={16} />} trailing={chevron} disabled={columns.length < 2} onClick={() => setView("move")}>
              Move list
            </PopoverItem>
            <PopoverItem icon={<ArrowDownUp size={16} />} trailing={chevron} disabled={cardCount < 2} onClick={() => setView("sort")}>
              Sort by
            </PopoverItem>
            <PopoverDivider />
            <PopoverItem
              icon={<Trash2 size={16} />}
              danger
              disabled={columns.length < 2}
              description={columns.length < 2 ? "A board needs at least one list" : undefined}
              closeOnClick
              onClick={onDelete}
            >
              Delete list
            </PopoverItem>
          </div>
        ) : null}

        {view === "color" ? (
          <div>
            <div className="grid grid-cols-5 gap-2">
              {LABEL_COLORS.map((c) => {
                const on = c.id === column.color;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={on}
                    onClick={() => onColor(c.id)}
                    className="flex h-8 items-center justify-center rounded-control hover:brightness-95"
                    style={{ background: c.bg, color: c.fg }}
                  >
                    {on ? <Check size={16} strokeWidth={3} aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-body-sm text-ink-muted">The colour shows as a thin bar at the top of the list.</p>
          </div>
        ) : null}

        {view === "sort" ? (
          <div className="-mx-3 flex flex-col">
            {SORTS.map((s) => (
              <PopoverItem key={s.id} description={s.description} closeOnClick onClick={() => onSort(s.id)}>
                {s.label}
              </PopoverItem>
            ))}
            <p className="px-3 pt-2 text-body-sm text-ink-muted">Sorts once. You can still drag cards afterwards.</p>
          </div>
        ) : null}

        {view === "move" ? (
          <div>
            <Field label="Position" htmlFor={`move-${column.id}`}>
              <Select id={`move-${column.id}`} size="sm" value={position} onChange={(e) => setPosition(Number(e.target.value))}>
                {columns.map((c, i) => (
                  <option key={c.id} value={i + 1}>
                    {i + 1}
                    {i === index ? " (current)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="mt-3">
              <Button
                disabled={position - 1 === index}
                onClick={() => {
                  onMove(position - 1);
                  setOpen(false);
                }}
              >
                Move
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Popover>
  );
}
