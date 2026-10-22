"use client";

import { AlignLeft, CheckSquare, Clock } from "lucide-react";
import { labelColor, PRIORITY_STYLE } from "@/lib/constants";
import { cn, formatDate } from "@/lib/client";
import type { Task } from "@/lib/types";

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const done = Boolean(task.completedAt);
  const overdue = !done && task.dueDate && new Date(task.dueDate) < new Date();
  const checked = task.checklist.filter((c) => c.done).length;
  const pr = PRIORITY_STYLE[task.priority];

  return (
    <div
      onClick={onClick}
      className={cn("t-card group cursor-pointer select-none p-2.5 text-sm transition hover:ring-2 hover:ring-brand/60", done && "opacity-75")}
    >
      {task.labels.length > 0 ? (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {task.labels.map((l) => {
            const c = labelColor(l);
            return <span key={l} className="h-2 w-10 rounded-full" style={{ background: c.bg }} title={c.label} />;
          })}
        </div>
      ) : null}
      <div className={cn("leading-5 text-ink", done && "line-through text-ink-muted")}>{task.title}</div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
        <span className="rounded px-1.5 py-px font-semibold capitalize" style={{ background: pr.bg, color: pr.fg }}>
          {task.priority}
        </span>
        {task.dueDate ? (
          <span
            className={cn("flex items-center gap-1 rounded px-1.5 py-px font-medium", done ? "bg-[#dcfff1] text-[#164b35]" : overdue ? "bg-[#ffeceb] text-[#601e16]" : "")}
          >
            <Clock size={11} /> {formatDate(task.dueDate, { month: "short", day: "numeric" })}
          </span>
        ) : null}
        {task.description ? <AlignLeft size={13} /> : null}
        {task.checklist.length > 0 ? (
          <span className={cn("flex items-center gap-1 rounded px-1 font-medium", checked === task.checklist.length && "bg-[#dcfff1] text-[#164b35]")}>
            <CheckSquare size={11} /> {checked}/{task.checklist.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
