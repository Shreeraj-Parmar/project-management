"use client";

import { EyeOff } from "lucide-react";
import { PASSWORD_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/client";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { SearchInput } from "@/components/ui/SearchInput";
import { categoryMeta } from "./categories";

export type SortKey = "name" | "updated" | "oldest" | "category";

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "name", label: "Name (A-Z)" },
  { id: "updated", label: "Recently updated" },
  { id: "oldest", label: "Oldest update" },
  { id: "category", label: "Category" },
];

export function isSortKey(v: unknown): v is SortKey {
  return SORT_OPTIONS.some((o) => o.id === v);
}

/** Search on the left; sort and "Hide all" on the right; category chips with counts underneath. */
export function VaultToolbar({
  query,
  onQuery,
  category,
  onCategory,
  counts,
  sort,
  onSort,
  revealedCount,
  onHideAll,
}: {
  query: string;
  onQuery: (q: string) => void;
  category: string;
  onCategory: (c: string) => void;
  /** Count per category for the current search, plus `all`. */
  counts: Record<string, number>;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  revealedCount: number;
  onHideAll: () => void;
}) {
  const chips = [{ id: "all", label: "All" }, ...PASSWORD_CATEGORIES.map((c) => ({ id: c as string, label: c as string }))];
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={query} onValueChange={onQuery} placeholder="Search credentials" className="sm:max-w-xs sm:flex-1" />
        <div className="flex items-center gap-2 sm:ml-auto">
          {revealedCount > 0 ? (
            <Button variant="subtle" icon={<EyeOff size={16} />} onClick={onHideAll} className="shrink-0">
              Hide all ({revealedCount})
            </Button>
          ) : null}
          <Select size="sm" aria-label="Sort credentials" value={sort} onChange={(e) => onSort(e.target.value as SortKey)} className="min-w-0 flex-1 sm:w-[12.5rem] sm:flex-none">
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                Sort: {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div role="group" aria-label="Filter by category" className="relative -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {chips.map((c) => {
          const on = category === c.id;
          const n = counts[c.id] ?? 0;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onCategory(c.id)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-control px-3 text-body font-medium transition-colors",
                on ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-fill hover:text-ink"
              )}
            >
              {c.id !== "all" ? <span aria-hidden className={cn("h-2 w-2 rounded-full", categoryMeta(c.id).dot)} /> : null}
              {c.label}
              <span className={cn("rounded-full px-1.5 text-micro font-semibold leading-4", on ? "bg-canvas text-brand" : "bg-fill text-ink-soft")}>{n}</span>
              <span className="sr-only">{n === 1 ? "credential" : "credentials"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
