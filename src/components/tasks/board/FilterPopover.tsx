"use client";

import { ListFilter } from "lucide-react";
import { cn } from "@/lib/client";
import { LABEL_COLORS, TASK_PRIORITIES } from "@/lib/constants";
import { Button, Checkbox, Input, LabelChip, Popover, PopoverFooter, PopoverSection, Toggle, Tooltip } from "@/components/ui";
import { DUE_OPTIONS, activeFilterCount, type TaskFilter } from "./filter";

function toggleIn<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/** Trello Filter button + popover: keyword, labels, due date, priority and hide-completed. Applies instantly. */
export function FilterPopover({
  filter,
  onChange,
  onClear,
  open,
  onOpenChange,
}: {
  filter: TaskFilter;
  onChange: (f: TaskFilter) => void;
  onClear: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const count = activeFilterCount(filter);
  const set = (patch: Partial<TaskFilter>) => onChange({ ...filter, ...patch });

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      title="Filter"
      width={304}
      placement="bottom-end"
      trigger={
        <Tooltip content="Filter cards (F)">
          <Button
            variant="transparent"
            icon={<ListFilter size={16} />}
            className={cn(count ? "bg-white/90 text-brand hover:bg-white" : "bg-black/45 hover:bg-black/55")}
          >
            Filter
            {count ? (
              <span
                aria-label={`${count} active`}
                className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-micro font-semibold text-white"
              >
                {count}
              </span>
            ) : null}
          </Button>
        </Tooltip>
      }
    >
      <PopoverSection first title="Keyword">
        <Input size="sm" aria-label="Keyword" value={filter.text} placeholder="Enter a keyword..." onChange={(e) => set({ text: e.target.value })} />
        <p className="mt-1 text-body-sm text-ink-muted">Search card titles, descriptions and checklist items.</p>
      </PopoverSection>

      <PopoverSection title="Labels">
        <Checkbox label="No labels" checked={filter.labels.includes("none")} onCheckedChange={() => set({ labels: toggleIn(filter.labels, "none") })} />
        <div className="mt-2 grid grid-cols-2 gap-1">
          {LABEL_COLORS.map((c) => (
            <div key={c.id} className="min-w-0">
              <LabelChip
                color={c.id}
                name={c.label}
                variant="large"
                selected={filter.labels.includes(c.id)}
                onClick={() => set({ labels: toggleIn(filter.labels, c.id) })}
              />
            </div>
          ))}
        </div>
      </PopoverSection>

      <PopoverSection title="Due date">
        <div className="flex flex-col gap-2">
          {DUE_OPTIONS.map((o) => (
            <Checkbox key={o.id} label={o.label} checked={filter.due.includes(o.id)} onCheckedChange={() => set({ due: toggleIn(filter.due, o.id) })} />
          ))}
        </div>
      </PopoverSection>

      <PopoverSection title="Priority">
        <div className="grid grid-cols-2 gap-2">
          {TASK_PRIORITIES.map((p) => (
            <Checkbox
              key={p}
              label={<span className="capitalize">{p}</span>}
              checked={filter.priority.includes(p)}
              onCheckedChange={() => set({ priority: toggleIn(filter.priority, p) })}
            />
          ))}
        </div>
      </PopoverSection>

      <PopoverSection title="Card status">
        <Toggle label="Hide completed cards" checked={filter.hideDone} onCheckedChange={(v) => set({ hideDone: v })} />
      </PopoverSection>

      <PopoverFooter>
        <Button variant="link" disabled={!count} onClick={onClear}>
          Clear all filters
        </Button>
      </PopoverFooter>
    </Popover>
  );
}
