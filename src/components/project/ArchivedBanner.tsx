"use client";

import { Archive } from "lucide-react";
import { cn } from "@/lib/client";
import { Button } from "@/components/ui";
import { useBoardActions } from "./useBoardActions";

/** Slim notice under the header while a board is archived (Trello shows the same for closed boards). */
export function ArchivedBanner({ fullBleed = false }: { fullBleed?: boolean }) {
  const { unarchive } = useBoardActions();
  return (
    <div role="status" className="shrink-0 px-3 pt-3 sm:px-4 lg:px-6">
      <div className={cn("flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-card bg-warning-soft px-3 py-2 text-body text-ink shadow-card", !fullBleed && "mx-auto max-w-page")}>
        <Archive size={16} className="shrink-0 text-[#e56910]" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="font-semibold">This board is archived.</span> It is hidden from your boards list.
        </span>
        <Button variant="secondary" size="sm" onClick={() => void unarchive()}>
          Restore board
        </Button>
      </div>
    </div>
  );
}
