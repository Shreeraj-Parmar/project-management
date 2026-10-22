import type { Task } from "@/lib/types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export type DueState = "none" | "complete" | "overdue" | "overdue-long" | "soon" | "normal";

type DueFields = Pick<Task, "dueDate" | "completedAt">;

/**
 * Trello due-date states:
 *  - complete: the card is marked complete (beats every other state)
 *  - overdue: became overdue in the last 24 hours (bold red)
 *  - overdue-long: overdue for more than 24 hours (light red)
 *  - soon: due within the next 24 hours (yellow)
 *  - normal: further away (quiet grey)
 */
export function dueState(t: DueFields, now: number = Date.now()): DueState {
  if (!t.dueDate) return "none";
  if (t.completedAt) return "complete";
  const due = new Date(t.dueDate).getTime();
  if (Number.isNaN(due)) return "none";
  const diff = due - now;
  if (diff < -DAY) return "overdue-long";
  if (diff < 0) return "overdue";
  if (diff <= DAY) return "soon";
  return "normal";
}

export function isOverdue(t: DueFields, now: number = Date.now()): boolean {
  if (!t.dueDate || t.completedAt) return false;
  return new Date(t.dueDate).getTime() < now;
}

export function isDueWithinWeek(t: DueFields, now: number = Date.now()): boolean {
  if (!t.dueDate || t.completedAt) return false;
  const due = new Date(t.dueDate).getTime();
  return due >= now && due <= now + 7 * DAY;
}

/** Date pickers store midnight UTC. Those are date-only values, so show them in UTC to avoid a day shift. */
function isDateOnly(d: Date) {
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
}

/** "Jun 14" (this year) or "Jun 14, 2025". */
export function formatDue(iso: string, now: number = Date.now()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const timeZone = isDateOnly(d) ? "UTC" : undefined;
  const yearOf = (date: Date) => new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone }).format(date);
  const sameYear = yearOf(d) === yearOf(new Date(now));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: sameYear ? undefined : "numeric", timeZone });
}

/** Sentence for tooltips and screen readers: "Due Jun 14 at 5:00 PM." */
export function describeDue(t: DueFields, now: number = Date.now()): string {
  if (!t.dueDate) return "";
  const d = new Date(t.dueDate);
  if (Number.isNaN(d.getTime())) return "";
  const when = isDateOnly(d)
    ? formatDue(t.dueDate, now)
    : `${formatDue(t.dueDate, now)} at ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  const state = dueState(t, now);
  if (state === "complete") return `Due ${when}. This card is complete.`;
  if (state === "overdue" || state === "overdue-long") return `Due ${when}. This card is overdue.`;
  if (state === "soon") return `Due ${when}. This card is due soon.`;
  return `Due ${when}.`;
}
