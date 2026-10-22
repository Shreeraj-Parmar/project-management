"use client";

import { AlignLeft, Check, CheckSquare, Clock } from "lucide-react";
import type { DraggableProvidedDraggableProps, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { cn } from "@/lib/client";
import { labelColor } from "@/lib/constants";
import type { Task } from "@/lib/types";
import { LabelChip, Lozenge, Tooltip } from "@/components/ui";
import { describeDue, dueState, formatDue, type DueState } from "./board/due";

const DUE_STYLE: Record<DueState, string> = {
  none: "",
  normal: "text-ink-soft",
  soon: "bg-warning-bold text-ink",
  overdue: "bg-danger text-white",
  "overdue-long": "bg-red-200 text-danger-text",
  complete: "bg-success text-white",
};

export type TaskCardProps = {
  task: Task;
  onOpen: () => void;
  onToggleComplete: () => void;
  labelsExpanded: boolean;
  onToggleLabels: () => void;
  /** Keyboard shortcut "e" on a focused card. */
  onQuickEdit?: () => void;
  dragging?: boolean;
  /** Draggable wiring from @hello-pangea/dnd (the handle is the card face). */
  wrapperRef?: (el: HTMLElement | null) => void;
  wrapperProps?: DraggableProvidedDraggableProps;
  handleProps?: DraggableProvidedDragHandleProps | null;
  /** Overlay controls rendered next to the face (the quick-edit pencil). They are siblings of the face, never nested in it. */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Trello card face: label bars, title with a hover complete-circle, badges row.
 * The face is a real role="button" (it is also the drag handle): Enter opens the card, Space lifts it for keyboard dragging.
 */
export function TaskCard({
  task,
  onOpen,
  onToggleComplete,
  labelsExpanded,
  onToggleLabels,
  onQuickEdit,
  dragging,
  wrapperRef,
  wrapperProps,
  handleProps,
  actions,
  className,
}: TaskCardProps) {
  const done = Boolean(task.completedAt);
  const state = dueState(task);
  const total = task.checklist.length;
  const checked = task.checklist.filter((c) => c.done).length;
  const showPriority = task.priority === "high" || task.priority === "urgent";
  const hasBadges = state !== "none" || !!task.description || total > 0 || showPriority;

  const label = [
    task.title,
    done ? "Complete" : "",
    task.labels.length ? `Labels: ${task.labels.map((l) => labelColor(l).label).join(", ")}` : "",
    task.dueDate ? describeDue(task) : "",
    total ? `Checklist ${checked} of ${total} done.` : "",
    showPriority ? `${task.priority === "urgent" ? "Urgent" : "High"} priority.` : "",
  ]
    .filter(Boolean)
    .join(". ")
    .replace(/\.\./g, ".");

  return (
    <div ref={wrapperRef} {...wrapperProps} className={cn("group relative", dragging && "rotate-3 opacity-95 motion-reduce:rotate-0", className)}>
      <div
        {...(handleProps ?? {})}
        aria-label={label}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget || e.metaKey || e.ctrlKey || e.altKey) return;
          if (e.key === "Enter") {
            e.preventDefault();
            onOpen();
          } else if ((e.key === "e" || e.key === "E") && onQuickEdit) {
            e.preventDefault();
            onQuickEdit();
          }
        }}
        data-task-id={task._id}
        className={cn("t-card block min-h-9 cursor-pointer select-none px-3 pb-1 pt-2 outline-offset-0 group-hover:bg-surface", dragging && "shadow-overlay")}
      >
        {task.labels.length > 0 ? (
          <div className="mb-1 flex flex-wrap gap-1">
            {task.labels.map((l) => (
              <LabelChip
                key={l}
                color={l}
                variant={labelsExpanded ? "expanded" : "collapsed"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLabels();
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="mb-1 flex items-start">
          <span
            className={cn(
              "shrink-0 overflow-hidden transition-opacity",
              done
                ? "w-6 opacity-100 pointer-coarse:w-8"
                : "w-0 opacity-0 group-focus-within:w-6 group-focus-within:opacity-100 group-hover:w-6 group-hover:opacity-100 pointer-coarse:w-8 pointer-coarse:opacity-100",
            )}
          >
            <button
              type="button"
              aria-label={done ? "Mark card incomplete" : "Mark card complete"}
              aria-pressed={done}
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete();
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full outline-offset-0 pointer-coarse:h-8 pointer-coarse:w-8"
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full text-white transition-colors",
                  done ? "bg-success" : "bg-white shadow-[inset_0_0_0_2px_#8590a2] hover:bg-fill hover:shadow-[inset_0_0_0_2px_#44546f]",
                )}
              >
                <Check size={12} strokeWidth={3.5} className={done ? "" : "hidden"} />
              </span>
            </button>
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 break-words text-body [overflow-wrap:anywhere] group-focus-within:pr-5 group-hover:pr-5 pointer-coarse:pr-0",
              done ? "text-ink-muted line-through" : "text-ink",
            )}
          >
            {task.title}
          </span>
        </div>

        {hasBadges ? (
          <div className="mb-1 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
            {state !== "none" ? (
              <Tooltip content={describeDue(task)}>
                <span className={cn("inline-flex h-5 items-center gap-1 rounded-control px-1 text-body-sm", DUE_STYLE[state])}>
                  {state === "complete" ? <Check size={14} aria-hidden /> : <Clock size={14} aria-hidden />}
                  <span>{formatDue(task.dueDate!)}</span>
                  <span className="sr-only">
                    {state === "overdue" || state === "overdue-long" ? "overdue" : state === "soon" ? "due soon" : state === "complete" ? "complete" : ""}
                  </span>
                </span>
              </Tooltip>
            ) : null}
            {task.description ? (
              <Tooltip content="This card has a description.">
                <span className="inline-flex h-5 items-center px-1 text-ink-soft">
                  <AlignLeft size={14} aria-label="Has a description" />
                </span>
              </Tooltip>
            ) : null}
            {total > 0 ? (
              <Tooltip content={`Checklist items: ${checked} of ${total}.`}>
                <span
                  className={cn(
                    "inline-flex h-5 items-center gap-1 rounded-control px-1 text-body-sm",
                    checked === total ? "bg-success text-white" : "text-ink-soft",
                  )}
                >
                  <CheckSquare size={14} aria-hidden />
                  <span>
                    {checked}/{total}
                  </span>
                </span>
              </Tooltip>
            ) : null}
            {showPriority ? (
              <Tooltip content={`Priority: ${task.priority}`}>
                <span className="inline-flex">
                  <Lozenge appearance={task.priority === "urgent" ? "removed" : "warning"} bold={task.priority === "urgent"}>
                    {task.priority === "urgent" ? "Urgent" : "High"}
                  </Lozenge>
                </span>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
      </div>
      {actions}
    </div>
  );
}
