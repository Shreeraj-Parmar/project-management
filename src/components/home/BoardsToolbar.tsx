"use client";

import { Label, SearchInput, Select } from "@/components/ui";
import { SORT_OPTIONS, type SortKey, type StatusFilter } from "./board-utils";

/** Trello's boards toolbar: labelled Sort by / Filter by selects and a Search field (all 32px). */
export function BoardsToolbar({
  sort,
  onSort,
  status,
  onStatus,
  showStatus,
  query,
  onQuery,
}: {
  sort: SortKey;
  onSort: (s: SortKey) => void;
  status: StatusFilter;
  onStatus: (s: StatusFilter) => void;
  showStatus: boolean;
  query: string;
  onQuery: (q: string) => void;
}) {
  return (
    <div role="search" aria-label="Filter boards" className="mb-4 flex flex-wrap items-end gap-x-3 gap-y-3">
      <div className="w-full sm:w-52">
        <Label htmlFor="boards-sort">Sort by</Label>
        <Select id="boards-sort" size="sm" value={sort} onChange={(e) => onSort(e.target.value as SortKey)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
      {showStatus ? (
        <div className="w-full sm:w-44">
          <Label htmlFor="boards-filter">Filter by</Label>
          <Select id="boards-filter" size="sm" value={status} onChange={(e) => onStatus(e.target.value as StatusFilter)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
      ) : null}
      <div className="w-full sm:ml-auto sm:w-64">
        <Label htmlFor="boards-search">Search</Label>
        <SearchInput id="boards-search" placeholder="Search boards" value={query} onValueChange={onQuery} autoComplete="off" />
      </div>
    </div>
  );
}
