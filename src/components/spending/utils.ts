import { LABEL_COLORS, SPEND_CATEGORIES } from "@/lib/constants";
import type { Expense } from "@/lib/types";

/** Category colour taken from the label palette (bold tier, white text safe). */
export function catColor(category: string): string {
  const i = (SPEND_CATEGORIES as readonly string[]).indexOf(category);
  return LABEL_COLORS[(i < 0 ? SPEND_CATEGORIES.length - 1 : i) % LABEL_COLORS.length].bold.bg;
}

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"];

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const expenseMonthKey = (e: Expense) => monthKey(new Date(e.date));
export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export function computeStats(expenses: Expense[]) {
  const now = new Date();
  const cur = monthKey(now);
  const prev = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  let total = 0;
  let thisMonth = 0;
  let lastMonth = 0;
  let recurring = 0;
  const byCat = new Map<string, number>();
  const byMonth = new Map<string, number>();
  for (const e of expenses) {
    total += e.amount;
    const k = expenseMonthKey(e);
    byMonth.set(k, (byMonth.get(k) ?? 0) + e.amount);
    if (k === cur) thisMonth += e.amount;
    if (k === prev) lastMonth += e.amount;
    if (e.recurring === "monthly") recurring += e.amount;
    else if (e.recurring === "yearly") recurring += e.amount / 12;
    byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount);
  }
  const months: { key: string; label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    months.push({ key, label: d.toLocaleDateString(undefined, { month: "short" }), total: byMonth.get(key) ?? 0 });
  }
  const pie = [...byCat.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const activeMonths = byMonth.size || 1;
  const delta = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null;
  return { total, thisMonth, lastMonth, delta, recurring, average: total / activeMonths, pie, months };
}
