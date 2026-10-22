"use client";

import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { WorkspaceTile } from "../nav/BoardThumb";

/** Workspace identity row (tile, name, one quiet line) with the single primary action of the page. */
export function WorkspaceHeader({ onCreate }: { onCreate?: (el: HTMLElement) => void }) {
  return (
    <header id="overview" className="scroll-mt-20 border-b border-line pb-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <WorkspaceTile size={48} className="rounded-list sm:!h-14 sm:!w-14 sm:!text-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-h-m font-semibold text-ink sm:text-h-l">DevBoard workspace</h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-body text-ink-soft">
            <Lock size={12} aria-hidden />
            <span>Private · one board per project</span>
          </p>
        </div>
        {onCreate ? (
          <Button variant="secondary" className="max-sm:hidden" icon={<Plus size={16} aria-hidden />} onClick={(e) => onCreate(e.currentTarget)}>
            Create board
          </Button>
        ) : null}
      </div>
    </header>
  );
}
