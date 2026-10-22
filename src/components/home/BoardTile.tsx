"use client";

import Link from "next/link";
import { CheckSquare, Plus } from "lucide-react";
import { cn } from "@/lib/client";
import { boardBackground } from "@/lib/constants";
import type { Project } from "@/lib/types";
import { Skeleton } from "@/components/ui";
import { boardHref, STATUS_META } from "./board-utils";
import { recordBoardVisit } from "./recent";
import { StarButton } from "./StarButton";

/**
 * White text must stay >= 4.5:1 on every gradient. Gradients that end light (mango, lime, sky, forest, coral, sunset)
 * get a stronger scrim than the ones that are dark all the way (ocean, grape, flamingo, midnight).
 */
const SOFT_SCRIM = new Set(["ocean", "grape", "flamingo", "midnight"]);
const scrimFor = (color: string) =>
  SOFT_SCRIM.has(color)
    ? "linear-gradient(to bottom,rgba(0,0,0,0.4),rgba(0,0,0,0.26) 50%,rgba(0,0,0,0.5))"
    : "linear-gradient(to bottom,rgba(0,0,0,0.46),rgba(0,0,0,0.4) 50%,rgba(0,0,0,0.56))";

/** Trello board tile: gradient, dark scrim for legibility, bold 2-line title, quiet meta row, star on hover. */
export function BoardTile({ project: p, onToggleStar }: { project: Project; onToggleStar: () => void }) {
  const meta = STATUS_META[p.status];
  const tasks = p.stats?.tasks ?? 0;
  const done = p.stats?.done ?? 0;
  const archived = p.status === "archived";
  return (
    <div
      className={cn(
        "group relative h-24 overflow-hidden rounded-card shadow-card has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus",
        archived && "saturate-50"
      )} style={{ background: boardBackground(p.color) }}>
      <Link
        href={boardHref(p._id)}
        onClick={() => recordBoardVisit(p._id)}
        title={p.description ? `${p.name}\n${p.description}` : p.name}
        className="absolute inset-0 flex flex-col justify-between rounded-card p-2 text-white focus-visible:outline-none"
      >
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: scrimFor(p.color) }} />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-150 group-hover:bg-black/15" />
        <span className="relative line-clamp-2 break-words pr-6 text-h-s font-bold text-white">{p.name}</span>
        <span className="relative flex items-center gap-3 text-body-sm font-medium text-white">
          <span className="flex min-w-0 items-center gap-1.5">
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full ring-1 ring-black/30" style={{ background: meta.dot }} />
            <span className="truncate">{meta.label}</span>
          </span>
          {tasks > 0 ? (
            <span className="flex shrink-0 items-center gap-1" title={`${done} of ${tasks} tasks done`}>
              <CheckSquare size={12} aria-hidden />
              <span aria-label={`${done} of ${tasks} tasks done`}>
                {done}/{tasks}
              </span>
            </span>
          ) : null}
        </span>
      </Link>
      <StarButton starred={p.starred} name={p.name} onToggle={onToggleStar} />
    </div>
  );
}

/** The grey last tile of the grid. */
export function CreateTile({ onClick }: { onClick: (el: HTMLElement) => void }) {
  return (
    <button
      type="button"
      onClick={(e) => onClick(e.currentTarget)}
      className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-card bg-fill text-body text-ink-soft transition-colors hover:bg-fill-hover hover:text-ink active:bg-fill-pressed"
    >
      <Plus size={16} aria-hidden />
      Create new board
    </button>
  );
}

export function BoardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]", className)}>{children}</ul>;
}

export function TileSkeletons({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading boards">
      <BoardGrid>
        {Array.from({ length: count }).map((_, i) => (
          <li key={i}>
            <Skeleton height={96} width="100%" className="!rounded-card" />
          </li>
        ))}
      </BoardGrid>
    </div>
  );
}
