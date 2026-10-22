import type { Task } from "@/lib/types";
import type { LozengeAppearance } from "@/components/ui";

export type Priority = Task["priority"];

/** Priority presentation. `dot` uses ADS 700 tokens so it is readable on white and on the grey card back. */
export const PRIORITY_META: Record<Priority, { label: string; dot: string; appearance: LozengeAppearance; bold: boolean }> = {
  low: { label: "Low", dot: "var(--color-green-700)", appearance: "success", bold: false },
  medium: { label: "Medium", dot: "var(--color-blue-700)", appearance: "inprogress", bold: false },
  high: { label: "High", dot: "var(--color-orange-700)", appearance: "warning", bold: false },
  urgent: { label: "Urgent", dot: "var(--color-red-700)", appearance: "removed", bold: true },
};

export type DueState = "complete" | "overdue" | "soon" | "none";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Same rules as the card face so the badge and the card back never disagree:
 * complete beats overdue, overdue = past due, due soon = within the next 24 hours.
 */
export function dueState(dueDate: string | null, completedAt: string | null, now = Date.now()): DueState {
  if (!dueDate) return "none";
  if (completedAt) return "complete";
  const diff = new Date(dueDate).getTime() - now;
  if (Number.isNaN(diff)) return "none";
  if (diff < 0) return "overdue";
  if (diff <= DAY) return "soon";
  return "none";
}

/** Date pickers store midnight UTC. Those are date-only values, so format them in UTC to avoid a one-day shift. */
function isDateOnly(d: Date) {
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
}

/** "Jun 19" this year, "Jun 19, 2027" otherwise. */
export function formatDueDate(dueDate: string): string {
  const d = new Date(dueDate);
  if (Number.isNaN(d.getTime())) return "";
  const timeZone = isDateOnly(d) ? "UTC" : undefined;
  const yearOf = (date: Date) => new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone }).format(date);
  const sameYear = yearOf(d) === yearOf(new Date());
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: sameYear ? undefined : "numeric", timeZone });
}

/** Local "YYYY-MM-DD" for `offsetDays` from today, matching the format of <input type="date">. */
export function dateInputFromToday(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** Turns pasted multi-line text into checklist item titles (strips "-", "*", "1." and "[ ]" markers). */
export function splitChecklistText(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)?(?:\[[ xX]\]\s+)?/, "").trim())
    .filter(Boolean);
}
