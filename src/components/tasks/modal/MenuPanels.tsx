"use client";

import { Check, CheckSquare, Clock, Flag, Tag } from "lucide-react";
import { labelColor } from "@/lib/constants";
import type { Column } from "@/lib/types";
import { PopoverItem } from "@/components/ui";
import { PRIORITY_META, type Priority } from "./meta";

export type AddKind = "labels" | "dates" | "checklist" | "priority";

function Dot({ color }: { color: string }) {
  return <span aria-hidden className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />;
}

/** "+ Add" menu: everything that can be added to a card. Picking one swaps this popover for the real one. */
export function AddMenu({ onPick }: { onPick: (k: AddKind) => void }) {
  return (
    <>
      <PopoverItem icon={<Tag size={16} />} description="Colour tags to find cards fast" closeOnClick={false} onClick={() => onPick("labels")}>
        Labels
      </PopoverItem>
      <PopoverItem icon={<Clock size={16} />} description="Set a due date" closeOnClick={false} onClick={() => onPick("dates")}>
        Dates
      </PopoverItem>
      <PopoverItem icon={<CheckSquare size={16} />} description="Break the card into steps" closeOnClick={false} onClick={() => onPick("checklist")}>
        Checklist
      </PopoverItem>
      <PopoverItem icon={<Flag size={16} />} description="Low, medium, high or urgent" closeOnClick={false} onClick={() => onPick("priority")}>
        Priority
      </PopoverItem>
    </>
  );
}

export function PriorityMenu({ value, onPick }: { value: Priority; onPick: (p: Priority) => void }) {
  return (
    <>
      {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
        <PopoverItem key={p} icon={<Dot color={PRIORITY_META[p].dot} />} selected={value === p} trailing={value === p ? <Check size={16} className="text-brand" aria-hidden /> : undefined} onClick={() => onPick(p)}>
          {PRIORITY_META[p].label}
        </PopoverItem>
      ))}
    </>
  );
}

/** Move popover: pick the destination list. */
export function MoveMenu({ columns, currentId, onPick }: { columns: Column[]; currentId: string; onPick: (id: string) => void }) {
  return (
    <>
      <p className="px-3 pb-1 text-h-xxs font-semibold text-ink-soft">Select destination</p>
      {columns.map((c) => (
        <PopoverItem
          key={c.id}
          icon={<Dot color={labelColor(c.color).bg} />}
          selected={c.id === currentId}
          description={c.id === currentId ? "Current list" : undefined}
          trailing={c.id === currentId ? <Check size={16} className="text-brand" aria-hidden /> : undefined}
          onClick={() => onPick(c.id)}
        >
          {c.title}
        </PopoverItem>
      ))}
    </>
  );
}
