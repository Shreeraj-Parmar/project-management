"use client";

import { useRef } from "react";
import { ChevronDown, Plus } from "lucide-react";
import type { Task } from "@/lib/types";
import { buttonClass, Checkbox, IconButton, LabelChip, Lozenge } from "@/components/ui";
import { cn } from "@/lib/client";
import { MetaGroup } from "./Section";
import { dueState, formatDueDate, PRIORITY_META } from "./meta";
import { triggerProps, type PopApi } from "./types";

/**
 * Meta row above the description: Labels (32px pills + "+"), Priority (lozenge button) and Due date
 * (checkbox + date button + status lozenge). Groups that are empty stay hidden; the quick row adds them.
 */
export function MetaRow({
  task,
  pop,
  showLabels,
  onComplete,
}: {
  task: Task;
  pop: PopApi;
  /** Keep the Labels group mounted while its popover is open, so the anchor does not vanish. */
  showLabels: boolean;
  onComplete: (done: boolean) => void;
}) {
  const plusRef = useRef<HTMLButtonElement>(null);
  const state = dueState(task.dueDate, task.completedAt);
  const prio = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;

  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-4">
      {showLabels ? (
        <MetaGroup caption="Labels" className="max-w-full">
          <ul className="flex flex-wrap items-center gap-1">
            {task.labels.map((id) => (
              <li key={id} className="min-w-0 max-w-full">
                <LabelChip variant="large" color={id} onClick={() => plusRef.current && pop.open("labels", plusRef.current, "meta")} />
              </li>
            ))}
            <li>
              <IconButton ref={plusRef} variant="secondary" title="Add or remove labels" {...triggerProps(pop, "labels", "meta")}>
                <Plus size={16} aria-hidden />
              </IconButton>
            </li>
          </ul>
        </MetaGroup>
      ) : null}

      <MetaGroup caption="Priority">
        <button type="button" className={buttonClass({ variant: "secondary" })} aria-label={`Priority: ${prio.label}. Change`} {...triggerProps(pop, "priority", "meta", true)}>
          <Lozenge appearance={prio.appearance} bold={prio.bold}>
            {prio.label}
          </Lozenge>
          <ChevronDown size={14} aria-hidden className="text-ink-soft" />
        </button>
      </MetaGroup>

      {task.dueDate ? (
        <MetaGroup caption="Due date">
          <div className="inline-flex h-8 max-w-full items-center rounded-control bg-fill">
            <Checkbox
              className="self-center pl-2.5 pr-2"
              checked={Boolean(task.completedAt)}
              onCheckedChange={onComplete}
              aria-label={task.completedAt ? "Mark card incomplete" : "Mark card complete"}
            />
            <button
              type="button"
              aria-label={`Due ${formatDueDate(task.dueDate)}${state === "overdue" ? ", overdue" : state === "soon" ? ", due soon" : state === "complete" ? ", complete" : ""}. Change`}
              className={cn("flex h-8 min-w-0 items-center gap-2 rounded-r-control pl-1 pr-3 text-body font-medium text-ink hover:bg-fill-hover active:bg-fill-pressed")}
              {...triggerProps(pop, "dates", "meta")}
            >
              <span className="truncate">{formatDueDate(task.dueDate)}</span>
              {state === "complete" ? (
                <Lozenge appearance="success" bold>
                  Complete
                </Lozenge>
              ) : state === "overdue" ? (
                <Lozenge appearance="removed" bold>
                  Overdue
                </Lozenge>
              ) : state === "soon" ? (
                <Lozenge appearance="moved" bold>
                  Due soon
                </Lozenge>
              ) : null}
            </button>
          </div>
        </MetaGroup>
      ) : null}
    </div>
  );
}
