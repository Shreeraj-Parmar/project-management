"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, SearchX, Trash2 } from "lucide-react";
import { Badge, EmptyState, IconButton, Lozenge, Menu, MenuItem, SearchInput, Select, Button } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/client";
import { SPEND_CATEGORIES } from "@/lib/constants";
import type { Expense } from "@/lib/types";
import { catColor, expenseMonthKey, monthLabel } from "./utils";

function CategoryChip({ category }: { category: string }) {
  return (
    <Badge bg={catColor(category)} fg="#FFFFFF">
      {category}
    </Badge>
  );
}

function RecurringLozenge({ r }: { r: Expense["recurring"] }) {
  if (r === "none") return <span className="text-body-sm text-ink-muted">One-off</span>;
  return (
    <Lozenge appearance="new">{r}</Lozenge>
  );
}

function Actions({ e, onEdit, onDelete }: { e: Expense; onEdit: (e: Expense) => void; onDelete: (e: Expense) => void }) {
  return (
    <Menu trigger={<IconButton title={`Actions for ${e.title}`} size="sm"><MoreHorizontal size={16} /></IconButton>} width="w-40">
      <MenuItem icon={<Pencil size={16} />} onClick={() => onEdit(e)}>
        Edit
      </MenuItem>
      <MenuItem icon={<Trash2 size={16} />} danger onClick={() => onDelete(e)}>
        Delete
      </MenuItem>
    </Menu>
  );
}

export function ExpenseLedger({ expenses, onEdit, onDelete }: { expenses: Expense[]; onEdit: (e: Expense) => void; onDelete: (e: Expense) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [month, setMonth] = useState("all");

  const months = useMemo(() => [...new Set(expenses.map(expenseMonthKey))].sort().reverse(), [expenses]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return expenses.filter(
      (e) =>
        (cat === "all" || e.category === cat) &&
        (month === "all" || expenseMonthKey(e) === month) &&
        (!needle || e.title.toLowerCase().includes(needle) || (e.note ?? "").toLowerCase().includes(needle)),
    );
  }, [expenses, q, cat, month]);

  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>();
    [...filtered].sort((a, b) => +new Date(b.date) - +new Date(a.date)).forEach((e) => {
      const k = expenseMonthKey(e);
      map.set(k, [...(map.get(k) ?? []), e]);
    });
    return [...map.entries()];
  }, [filtered]);

  const filtering = q !== "" || cat !== "all" || month !== "all";
  const clear = () => {
    setQ("");
    setCat("all");
    setMonth("all");
  };

  return (
    <section aria-label="Expenses">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onValueChange={setQ} placeholder="Search expenses" className="w-full sm:max-w-xs" />
        <Select size="sm" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="w-full sm:w-44">
          <option value="all">All categories</option>
          {SPEND_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select size="sm" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month" className="w-full sm:w-44">
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </Select>
        {filtering ? (
          <Button variant="link" onClick={clear}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-card border border-line">
          <EmptyState compact icon={<SearchX size={24} />} color="#ae4787" title="No expenses match" description="Try a different search or clear the filters." action={<Button variant="secondary" onClick={clear}>Clear filters</Button>} />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-card border border-line sm:block">
            <table className="w-full text-body">
              <thead className="bg-surface text-left text-body-sm font-semibold text-ink-soft">
                <tr>
                  <th className="w-28 px-4 py-2">Date</th>
                  <th className="px-4 py-2">Expense</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Repeats</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="w-12 px-2 py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              {groups.map(([key, rows]) => {
                const cur = rows[0].currency;
                const sub = rows.reduce((a, e) => a + e.amount, 0);
                return (
                  <tbody key={key} className="border-t border-line">
                    <tr className="bg-fill-subtle">
                      <th colSpan={4} scope="colgroup" className="px-4 py-1.5 text-left text-h-xs font-semibold text-ink">
                        {monthLabel(key)} <span className="font-normal text-ink-muted">· {rows.length}</span>
                      </th>
                      <td className="px-4 py-1.5 text-right font-semibold tabular-nums text-ink">{formatMoney(sub, cur)}</td>
                      <td />
                    </tr>
                    {rows.map((e) => (
                      <tr key={e._id} className="border-t border-line hover:bg-fill-subtle">
                        <td className="whitespace-nowrap px-4 py-2 text-ink-soft">{formatDate(e.date, { month: "short", day: "numeric" })}</td>
                        <td className="max-w-0 px-4 py-2">
                          <div className="truncate font-medium text-ink">{e.title}</div>
                          {e.note ? <div className="truncate text-body-sm text-ink-muted">{e.note}</div> : null}
                        </td>
                        <td className="px-4 py-2"><CategoryChip category={e.category} /></td>
                        <td className="px-4 py-2"><RecurringLozenge r={e.recurring} /></td>
                        <td className="whitespace-nowrap px-4 py-2 text-right font-semibold tabular-nums text-ink">{formatMoney(e.amount, e.currency)}</td>
                        <td className="px-2 py-1 text-right"><Actions e={e} onEdit={onEdit} onDelete={onDelete} /></td>
                      </tr>
                    ))}
                  </tbody>
                );
              })}
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-4 sm:hidden">
            {groups.map(([key, rows]) => (
              <div key={key}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-h-xs font-semibold text-ink">{monthLabel(key)}</h3>
                  <span className="font-semibold tabular-nums text-ink">{formatMoney(rows.reduce((a, e) => a + e.amount, 0), rows[0].currency)}</span>
                </div>
                <ul className="space-y-2">
                  {rows.map((e) => (
                    <li key={e._id} className="t-card t-card--static flex items-start gap-2 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-ink">{e.title}</div>
                        <div className="mt-0.5 text-body-sm text-ink-muted">{formatDate(e.date, { month: "short", day: "numeric" })}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <CategoryChip category={e.category} />
                          {e.recurring !== "none" ? <RecurringLozenge r={e.recurring} /> : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-right font-semibold tabular-nums text-ink">{formatMoney(e.amount, e.currency)}</div>
                      <Actions e={e} onEdit={onEdit} onDelete={onDelete} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
