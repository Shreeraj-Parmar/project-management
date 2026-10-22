"use client";

import { Archive, CalendarClock, LayoutGrid, LayoutDashboard, Plus, Star } from "lucide-react";
import { cn } from "@/lib/client";
import { Tabs } from "@/components/ui";
import { WorkspaceTile } from "../nav/BoardThumb";

export type HomeView = "boards" | "starred" | "archived";

function SideItem({ icon, label, count, active, onClick, current }: { icon: React.ReactNode; label: string; count?: number; active?: boolean; onClick: () => void; current?: boolean }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={current ? "page" : undefined}
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-control px-3 text-left text-body transition-colors",
          active ? "bg-brand-soft font-semibold text-brand" : "text-ink-soft hover:bg-fill hover:text-ink"
        )}
      >
        <span aria-hidden className="flex shrink-0">
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count ? <span className={cn("text-body-sm", active ? "text-brand" : "text-ink-muted")}>{count}</span> : null}
      </button>
    </li>
  );
}

/** Trello's workspace sidebar (256px): Boards / Starred / Archived, then the workspace with its shortcuts. */
export function HomeSidebar({
  view,
  onView,
  counts,
  upcoming,
  onCreate,
  onJump,
}: {
  view: HomeView;
  onView: (v: HomeView) => void;
  counts: { starred: number; archived: number };
  upcoming: number;
  onCreate: (el: HTMLElement) => void;
  onJump: (id: "overview" | "upcoming") => void;
}) {
  return (
    <aside className="hidden w-64 shrink-0 md:block" aria-label="Workspace">
      <nav aria-label="Boards navigation" className="sticky top-[72px] space-y-5">
        <ul className="space-y-0.5">
          <SideItem icon={<LayoutGrid size={16} />} label="Boards" active={view === "boards"} current={view === "boards"} onClick={() => onView("boards")} />
          <SideItem icon={<Star size={16} />} label="Starred" count={counts.starred} active={view === "starred"} current={view === "starred"} onClick={() => onView("starred")} />
          <SideItem icon={<Archive size={16} />} label="Archived" count={counts.archived} active={view === "archived"} current={view === "archived"} onClick={() => onView("archived")} />
        </ul>

        <div className="border-t border-line pt-4">
          <h2 className="mb-2 px-3 text-micro font-semibold uppercase tracking-wider text-ink-soft">Workspace</h2>
          <div className="flex items-center gap-3 px-3 py-1">
            <WorkspaceTile size={32} />
            <div className="min-w-0">
              <div className="truncate text-body font-semibold text-ink">DevBoard</div>
              <div className="truncate text-body-sm text-ink-muted">Personal workspace</div>
            </div>
          </div>
          <ul className="mt-2 space-y-0.5">
            <SideItem icon={<LayoutDashboard size={16} />} label="Overview" onClick={() => onJump("overview")} />
            <SideItem icon={<CalendarClock size={16} />} label="Upcoming tasks" count={upcoming} onClick={() => onJump("upcoming")} />
            <li>
              <button
                type="button"
                onClick={(e) => onCreate(e.currentTarget)}
                className="flex h-8 w-full items-center gap-2 rounded-control px-3 text-left text-body text-ink-soft transition-colors hover:bg-fill hover:text-ink"
              >
                <Plus size={16} aria-hidden />
                Create board
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}

/** Phones: the sidebar becomes a segmented control above the content. */
export function MobileViewSwitch({ view, onView, counts }: { view: HomeView; onView: (v: HomeView) => void; counts: { starred: number; archived: number } }) {
  return (
    <div className="md:hidden">
      <Tabs
        variant="segmented"
        className="w-full [&>*]:flex-1 [&>*]:justify-center"
        ariaLabel="Board views"
        value={view}
        onChange={(id) => onView(id as HomeView)}
        tabs={[
          { id: "boards", label: "Boards" },
          { id: "starred", label: "Starred", count: counts.starred || undefined },
          { id: "archived", label: "Archived", count: counts.archived || undefined },
        ]}
      />
    </div>
  );
}
