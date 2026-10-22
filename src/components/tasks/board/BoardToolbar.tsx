"use client";

import { Button, SectionMessage } from "@/components/ui";
import { FilterPopover } from "./FilterPopover";
import type { Board } from "./useBoard";

/** Slim row above the lists: result summary on the left, Filter on the right. Chips are dark glass so white text reads on every board background. */
export function BoardToolbar({ board, filterOpen, onFilterOpenChange }: { board: Board; filterOpen: boolean; onFilterOpenChange: (open: boolean) => void }) {
  const { filtering, visibleCount, tasks, doneCount } = board;
  const open = tasks.length - doneCount;
  return (
    <>
      <div className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-2 sm:px-2">
        <div aria-live="polite" className="flex h-8 min-w-0 items-center gap-3 rounded-card bg-black/45 px-3 text-body text-white">
          {filtering ? (
            <>
              <span className="truncate font-medium">
                Showing {visibleCount} {visibleCount === 1 ? "card" : "cards"}
              </span>
              <button
                type="button"
                onClick={board.clearFilter}
                className="shrink-0 rounded-control font-medium underline underline-offset-2 hover:no-underline"
              >
                Clear filters
              </button>
            </>
          ) : (
            <span className="truncate">
              {tasks.length === 0 ? (
                "No cards yet"
              ) : (
                <>
                  {open} open <span aria-hidden>·</span> {doneCount} complete
                </>
              )}
            </span>
          )}
        </div>
        <div className="ml-auto shrink-0">
          <FilterPopover filter={board.filter} onChange={board.setFilter} onClear={board.clearFilter} open={filterOpen} onOpenChange={onFilterOpenChange} />
        </div>
      </div>
      {filtering && visibleCount === 0 && tasks.length > 0 ? (
        <div className="shrink-0 px-3 pb-1 pt-1 sm:px-2">
          <SectionMessage
            appearance="info"
            className="max-w-xl"
            title="No cards match your filters."
            actions={
              <Button variant="link" onClick={board.clearFilter}>
                Clear filters
              </Button>
            }
          />
        </div>
      ) : null}
    </>
  );
}
