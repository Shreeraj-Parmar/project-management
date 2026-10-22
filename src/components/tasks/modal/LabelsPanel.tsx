"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { LABEL_COLORS } from "@/lib/constants";
import { Checkbox, Input, LabelChip, PopoverSection } from "@/components/ui";

/** Labels popover body: search, then one row per label colour (checkbox + 32px colour bar). Toggles apply instantly. */
export function LabelsPanel({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const list = LABEL_COLORS.filter((c) => !needle || c.label.toLowerCase().includes(needle) || c.id.includes(needle));

  return (
    <>
      <Input
        size="sm"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && list.length === 1) {
            e.preventDefault();
            onToggle(list[0].id);
          }
        }}
        placeholder="Search labels..."
        aria-label="Search labels"
        startIcon={<Search size={14} />}
        autoComplete="off"
      />
      <PopoverSection title="Labels">
        {list.length ? (
          <ul className="space-y-1">
            {list.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <Checkbox className="self-center" checked={selected.includes(c.id)} onCheckedChange={() => onToggle(c.id)} aria-label={`${c.label} label`} />
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onToggle(c.id)}>
                  <LabelChip variant="large" color={c.id} name={c.label} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-body-sm text-ink-soft">No labels match &ldquo;{q.trim()}&rdquo;.</p>
        )}
      </PopoverSection>
    </>
  );
}
