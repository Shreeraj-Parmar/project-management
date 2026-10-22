import { formatDate } from "@/lib/client";
import type { Project, Task } from "@/lib/types";

export const boardHref = (id: string) => `/boards/${id}/tasks`;

export const STATUS_META: Record<Project["status"], { label: string; dot: string }> = {
  active: { label: "Active", dot: "#4bce97" },
  paused: { label: "Paused", dot: "#f5cd47" },
  completed: { label: "Completed", dot: "#579dff" },
  archived: { label: "Archived", dot: "#b3b9c4" },
};

export type SortKey = "recent" | "oldest" | "az" | "za" | "created";
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Most recently active" },
  { value: "oldest", label: "Least recently active" },
  { value: "az", label: "Alphabetically A-Z" },
  { value: "za", label: "Alphabetically Z-A" },
  { value: "created", label: "Newest first" },
];

export type StatusFilter = "all" | Exclude<Project["status"], "archived">;

const time = (s: string) => new Date(s).getTime() || 0;

export function sortBoards(list: Project[], sort: SortKey): Project[] {
  const by: Record<SortKey, (a: Project, b: Project) => number> = {
    recent: (a, b) => time(b.updatedAt) - time(a.updatedAt),
    oldest: (a, b) => time(a.updatedAt) - time(b.updatedAt),
    created: (a, b) => time(b.createdAt) - time(a.createdAt),
    az: (a, b) => a.name.localeCompare(b.name),
    za: (a, b) => b.name.localeCompare(a.name),
  };
  return [...list].sort(by[sort]);
}

/** Name, description or tag contains the query (case-insensitive). */
export function matchesBoard(p: Project, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return p.name.toLowerCase().includes(s) || (p.description ?? "").toLowerCase().includes(s) || (p.tags ?? []).some((t) => t.toLowerCase().includes(s));
}

/** Header search: name matches first (prefix before substring), then tags, then description. */
export function searchBoards(boards: Project[], q: string): Project[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const scored: { p: Project; score: number }[] = [];
  for (const p of boards) {
    const name = p.name.toLowerCase();
    let score = -1;
    if (name.startsWith(s)) score = 0;
    else if (name.split(/\s+/).some((w) => w.startsWith(s))) score = 1;
    else if (name.includes(s)) score = 2;
    else if ((p.tags ?? []).some((t) => t.toLowerCase().includes(s))) score = 3;
    else if ((p.description ?? "").toLowerCase().includes(s)) score = 4;
    if (score >= 0) scored.push({ p, score: p.status === "archived" ? score + 10 : score });
  }
  return scored.sort((a, b) => a.score - b.score || time(b.p.updatedAt) - time(a.p.updatedAt)).map((x) => x.p);
}

export function templateSummary(columns: { title: string }[]): string {
  return columns.map((c) => c.title).join(", ");
}

const DAY = 24 * 60 * 60 * 1000;

/** Due-date wording for task rows: "Overdue 3 days", "Due today", "Due tomorrow", "Due Jun 20". */
export function dueInfo(task: Pick<Task, "dueDate">): { overdue: boolean; short: string; long: string } {
  if (!task.dueDate) return { overdue: false, short: "", long: "" };
  const due = new Date(task.dueDate);
  const short = formatDate(due, { month: "short", day: "numeric" });
  const diff = due.getTime() - Date.now();
  if (diff < 0) {
    const days = Math.max(1, Math.floor(-diff / DAY));
    return { overdue: true, short, long: days <= 1 ? `Overdue since ${short}` : `Overdue by ${days} days` };
  }
  const days = Math.floor(diff / DAY);
  const same = due.toDateString() === new Date().toDateString();
  return { overdue: false, short, long: same ? "Due today" : days <= 1 ? "Due tomorrow" : `Due ${short}` };
}
