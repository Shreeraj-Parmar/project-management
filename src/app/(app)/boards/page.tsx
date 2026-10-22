"use client";

import { useCallback, useMemo, useState } from "react";
import { Archive, Clock, LayoutGrid, Search, Star } from "lucide-react";
import { api } from "@/lib/client";
import type { Project } from "@/lib/types";
import { TopNav } from "@/components/TopNav";
import { CreateBoardModal } from "@/components/CreateBoardModal";
import { Button, EmptyState, ErrorBox, SectionMessage, useToast } from "@/components/ui";
import { boardsResource, useBoards, useDashboard } from "@/components/nav/store";
import { BoardGrid, BoardTile, CreateTile, TileSkeletons } from "@/components/home/BoardTile";
import { BoardsToolbar } from "@/components/home/BoardsToolbar";
import { FirstRun } from "@/components/home/FirstRun";
import { HomeSidebar, MobileViewSwitch, type HomeView } from "@/components/home/HomeSidebar";
import { SummaryCards } from "@/components/home/SummaryCards";
import { UpcomingPanel } from "@/components/home/UpcomingPanel";
import { WorkspaceHeader } from "@/components/home/WorkspaceHeader";
import { matchesBoard, sortBoards, type SortKey, type StatusFilter } from "@/components/home/board-utils";
import { useRecentBoards } from "@/components/home/recent";
import { useStoredState } from "@/components/home/storage";

const isSort = (v: string): v is SortKey => ["recent", "oldest", "az", "za", "created"].includes(v);

function SectionHeading({ icon, title, count, id }: { icon: React.ReactNode; title: string; count?: number; id?: string }) {
  return (
    <h2 id={id} className="mb-3 flex items-center gap-2 text-h-s font-semibold text-ink">
      <span aria-hidden className="flex shrink-0">
        {icon}
      </span>
      {title}
      {typeof count === "number" ? <span className="text-body font-normal text-ink-muted">({count})</span> : null}
    </h2>
  );
}

export default function BoardsPage() {
  const { toast } = useToast();
  const projects = useBoards({ maxAge: 5000 });
  const dash = useDashboard({ maxAge: 5000 });
  const [query, setQuery] = useState("");
  const [view, setView] = useState<HomeView>("boards");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useStoredState<SortKey>("devboard:home:sort", "recent", isSort);
  const [create, setCreate] = useState<{ anchor: HTMLElement; template?: string } | null>(null);

  const all = useMemo(() => projects.data ?? [], [projects.data]);
  const q = query.trim();
  const hasBoards = all.length > 0;
  const isEmpty = !projects.loading && !projects.error && !hasBoards;

  const starred = useMemo(() => sortBoards(all.filter((p) => p.starred && p.status !== "archived"), "recent"), [all]);
  const archivedCount = useMemo(() => all.filter((p) => p.status === "archived").length, [all]);
  const recent = useRecentBoards(all, { limit: 4 });
  const names = useMemo(() => new Map(all.map((p) => [p._id, p.name])), [all]);

  const list = useMemo(() => {
    let out = all.filter((p) => matchesBoard(p, q));
    if (view === "starred") out = out.filter((p) => p.starred && p.status !== "archived");
    else if (view === "archived") out = out.filter((p) => p.status === "archived");
    else out = out.filter((p) => (status === "all" ? p.status !== "archived" : p.status === status));
    return sortBoards(out, sort);
  }, [all, q, view, status, sort]);

  const toggleStar = useCallback(
    async (p: Project) => {
      const next = !p.starred;
      boardsResource.setData((prev) => (prev ? prev.map((x) => (x._id === p._id ? { ...x, starred: next } : x)) : prev));
      try {
        await api.patch(`/api/projects/${p._id}`, { starred: next });
      } catch (err) {
        toast(err instanceof Error ? err.message : "Couldn't update the star. Try again.", "error");
        void projects.refetch(true);
      }
    },
    [projects, toast]
  );

  /** Toggle: pressing the same trigger again closes the popover. */
  const openCreate = useCallback((anchor: HTMLElement, template?: string) => {
    setCreate((cur) => (cur && cur.anchor === anchor && cur.template === template ? null : { anchor, template }));
  }, []);

  const jump = (id: "overview" | "upcoming") => {
    setView("boards");
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (id === "upcoming") el?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    });
  };

  const upcomingCount = (dash.data?.overdue.length ?? 0) + (dash.data?.dueSoon.length ?? 0);
  const counts = { starred: starred.length, archived: archivedCount };
  const filtering = q.length > 0;
  const heading = view === "starred" ? "Starred boards" : view === "archived" ? "Archived boards" : "Your boards";
  const headingIcon =
    view === "starred" ? <Star size={20} className="text-[#e2b203]" fill="#e2b203" /> : view === "archived" ? <Archive size={20} className="text-ink-soft" /> : <LayoutGrid size={20} className="text-ink-soft" />;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[var(--z-flag)] focus:rounded-control focus:bg-canvas focus:px-3 focus:py-2 focus:text-body focus:font-semibold focus:text-brand focus:shadow-overlay"
      >
        Skip to boards
      </a>
      <TopNav />
      <div className="mx-auto flex w-full max-w-[1336px] flex-1 items-start gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <HomeSidebar view={view} onView={setView} counts={counts} upcoming={upcomingCount} onCreate={(el) => openCreate(el)} onJump={jump} />

        <main id="main-content" tabIndex={-1} className="min-w-0 max-w-[1000px] flex-1 space-y-8 outline-none">
          <MobileViewSwitch view={view} onView={setView} counts={counts} />

          <WorkspaceHeader onCreate={isEmpty ? undefined : (el) => openCreate(el)} />

          {projects.error && !hasBoards ? (
            <SectionMessage
              appearance="error"
              title="Couldn't load your boards"
              actions={
                <Button
                  variant="link"
                  className="!font-semibold"
                  onClick={() => {
                    void projects.refetch();
                    void dash.refetch();
                  }}
                >
                  Try again
                </Button>
              }
            >
              {projects.error}
            </SectionMessage>
          ) : isEmpty ? (
            <FirstRun onCreate={(el, template) => openCreate(el, template)} />
          ) : (
            <>
              {view === "boards" && !filtering ? (
                <div className="space-y-4">
                  {dash.error && !dash.data ? (
                    <ErrorBox title="Couldn't load the workspace summary" message="Your boards are fine. The numbers and due dates will be back once the summary loads." onRetry={() => dash.refetch()} />
                  ) : (
                    <>
                      <SummaryCards data={dash.data} loading={dash.loading || projects.loading} />
                      <UpcomingPanel data={dash.data} loading={dash.loading || projects.loading} names={names} />
                    </>
                  )}
                </div>
              ) : null}

              {view === "boards" && !filtering && !projects.loading && starred.length > 0 ? (
                <section aria-labelledby="starred-title">
                  <SectionHeading id="starred-title" icon={<Star size={20} className="text-[#e2b203]" fill="#e2b203" />} title="Starred boards" />
                  <BoardGrid>
                    {starred.map((p) => (
                      <li key={p._id}>
                        <BoardTile project={p} onToggleStar={() => toggleStar(p)} />
                      </li>
                    ))}
                  </BoardGrid>
                </section>
              ) : null}

              {view === "boards" && !filtering && !projects.loading && all.length >= 2 && recent.length > 0 ? (
                <section aria-labelledby="recent-title">
                  <SectionHeading id="recent-title" icon={<Clock size={20} className="text-ink-soft" />} title="Recently viewed" />
                  <BoardGrid>
                    {recent.map(({ project: p }) => (
                      <li key={p._id}>
                        <BoardTile project={p} onToggleStar={() => toggleStar(p)} />
                      </li>
                    ))}
                  </BoardGrid>
                </section>
              ) : null}

              <section id="boards" aria-labelledby="boards-title" className="scroll-mt-20">
                <SectionHeading id="boards-title" icon={headingIcon} title={heading} count={projects.loading ? undefined : list.length} />
                <BoardsToolbar sort={sort} onSort={setSort} status={status} onStatus={setStatus} showStatus={view === "boards"} query={query} onQuery={setQuery} />

                {projects.loading ? (
                  <TileSkeletons />
                ) : list.length === 0 ? (
                  <NoBoards view={view} query={q} filtered={status !== "all"} onClear={() => (q ? setQuery("") : setStatus("all"))} />
                ) : (
                  <BoardGrid>
                    {list.map((p) => (
                      <li key={p._id}>
                        <BoardTile project={p} onToggleStar={() => toggleStar(p)} />
                      </li>
                    ))}
                    {view === "boards" && !filtering ? (
                      <li>
                        <CreateTile onClick={(el) => openCreate(el)} />
                      </li>
                    ) : null}
                  </BoardGrid>
                )}
              </section>
            </>
          )}
        </main>
      </div>

      <CreateBoardModal
        open={!!create}
        onClose={() => setCreate(null)}
        anchor={create?.anchor}
        initialTemplate={create?.template}
        onCreated={() => void projects.refetch(true)}
      />
    </div>
  );
}

function NoBoards({ view, query, filtered, onClear }: { view: HomeView; query: string; filtered: boolean; onClear: () => void }) {
  if (query) {
    return (
      <EmptyState
        compact
        icon={<Search size={22} />}
        title={`No boards match “${query}”`}
        description="Try a different keyword, or search by tag."
        action={
          <Button variant="secondary" onClick={onClear}>
            Clear search
          </Button>
        }
      />
    );
  }
  if (view === "starred") {
    return <EmptyState compact color="#946f00" icon={<Star size={22} />} title="No starred boards yet" description="Hover a board and click the star to keep it here." />;
  }
  if (view === "archived") {
    return <EmptyState compact color="#44546f" icon={<Archive size={22} />} title="No archived boards" description="Archive a board from its menu to park it without deleting anything." />;
  }
  return (
    <EmptyState
      compact
      icon={<LayoutGrid size={22} />}
      title={filtered ? "No boards with that status" : "No boards to show"}
      action={
        filtered ? (
          <Button variant="secondary" onClick={onClear}>
            Show all boards
          </Button>
        ) : undefined
      }
    />
  );
}
