import type { Task } from "@/lib/types";
import { isDueWithinWeek, isOverdue } from "./due";

export type DueFilter = "overdue" | "week" | "none";
export type TaskPriorityId = Task["priority"];

export type TaskFilter = {
  text: string;
  /** Label colour ids, plus "none" for cards without labels. */
  labels: string[];
  due: DueFilter[];
  priority: TaskPriorityId[];
  hideDone: boolean;
};

export const EMPTY_FILTER: TaskFilter = { text: "", labels: [], due: [], priority: [], hideDone: false };

export const DUE_OPTIONS: { id: DueFilter; label: string }[] = [
  { id: "none", label: "No due date" },
  { id: "overdue", label: "Overdue" },
  { id: "week", label: "Due in the next 7 days" },
];

/** Number of active filter categories (shown as the badge on the Filter button). */
export function activeFilterCount(f: TaskFilter): number {
  return (f.text.trim() ? 1 : 0) + (f.labels.length ? 1 : 0) + (f.due.length ? 1 : 0) + (f.priority.length ? 1 : 0) + (f.hideDone ? 1 : 0);
}

export function isFilterActive(f: TaskFilter): boolean {
  return activeFilterCount(f) > 0;
}

/** Same behaviour as before (keyword, any-label, hide done) plus due date and priority. Categories AND together, options inside one category OR. */
export function matchesFilter(t: Task, f: TaskFilter, now: number = Date.now()): boolean {
  if (f.hideDone && t.completedAt) return false;

  const q = f.text.trim().toLowerCase();
  if (q) {
    const hay =
      t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q) || t.checklist.some((c) => c.text.toLowerCase().includes(q));
    if (!hay) return false;
  }

  if (f.labels.length) {
    const hit = f.labels.some((l) => (l === "none" ? t.labels.length === 0 : t.labels.includes(l)));
    if (!hit) return false;
  }

  if (f.due.length) {
    const hit = f.due.some((d) => (d === "none" ? !t.dueDate : d === "overdue" ? isOverdue(t, now) : isDueWithinWeek(t, now)));
    if (!hit) return false;
  }

  if (f.priority.length && !f.priority.includes(t.priority)) return false;
  return true;
}

const key = (boardId: string) => `devboard:board-filter:${boardId}`;

/** The filter survives switching modules inside a board (sessionStorage, always inside try/catch). */
export function readStoredFilter(boardId: string): TaskFilter {
  try {
    const raw = sessionStorage.getItem(key(boardId));
    if (!raw) return EMPTY_FILTER;
    const p = JSON.parse(raw) as Partial<TaskFilter>;
    return {
      text: typeof p.text === "string" ? p.text : "",
      labels: Array.isArray(p.labels) ? p.labels.filter((x) => typeof x === "string") : [],
      due: Array.isArray(p.due) ? p.due.filter((x): x is DueFilter => x === "overdue" || x === "week" || x === "none") : [],
      priority: Array.isArray(p.priority) ? p.priority.filter((x): x is TaskPriorityId => ["low", "medium", "high", "urgent"].includes(x as string)) : [],
      hideDone: p.hideDone === true,
    };
  } catch {
    return EMPTY_FILTER;
  }
}

export function writeStoredFilter(boardId: string, f: TaskFilter) {
  try {
    if (isFilterActive(f)) sessionStorage.setItem(key(boardId), JSON.stringify(f));
    else sessionStorage.removeItem(key(boardId));
  } catch {
    /* storage blocked: the filter simply is not remembered */
  }
}
