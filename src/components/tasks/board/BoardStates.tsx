"use client";

import { Columns3 } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";

/** Loading state: three lists with card-shaped skeletons, same geometry as the real board so nothing jumps. */
export function BoardSkeleton() {
  const cols = [
    [64, 88, 64, 64],
    [88, 64, 64],
    [64, 88],
  ];
  return (
    <div role="status" aria-label="Loading board" className="flex h-full min-h-0 flex-col">
      <div aria-hidden className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-2 sm:px-2">
        <div className="h-8 w-44 rounded-card bg-black/25" />
        <div className="ml-auto h-8 w-20 rounded-card bg-black/25" />
      </div>
      <div className="flex min-h-0 flex-1 items-start overflow-hidden px-3 pb-2 pt-1 sm:px-2">
        {cols.map((cards, i) => (
          <div key={i} className="t-list mr-2 w-[var(--w-list)] shrink-0 overflow-hidden">
            <div className="h-1 bg-fill-hover" />
            <div className="px-5 pb-1 pt-3">
              <Skeleton height={14} width={i === 0 ? 72 : i === 1 ? 104 : 56} />
            </div>
            <div className="px-2 pb-2 pt-2">
              {cards.map((h, j) => (
                <div key={j} className="t-card t-card--static mb-2 px-3 pb-2 pt-2" style={{ height: h }}>
                  {j % 2 === 0 ? <Skeleton height={8} width={40} className="mb-2" /> : null}
                  <Skeleton height={12} width="85%" />
                  {h > 64 ? <Skeleton height={12} width="55%" className="mt-2" /> : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A board without any list: one clear call to action. */
export function NoListsState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex h-full min-h-0 items-start justify-center px-4 pt-10">
      <div className="t-card t-card--static w-full max-w-md">
        <EmptyState
          compact
          color="#0c66e4"
          icon={<Columns3 size={24} />}
          title="This board has no lists yet"
          description="Lists group your cards, for example To Do, In Progress and Done."
          action={<Button onClick={onAdd}>Add a list</Button>}
        />
      </div>
    </div>
  );
}
