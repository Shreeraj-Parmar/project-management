"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFetch } from "@/lib/client";
import { boardBackground } from "@/lib/constants";
import type { ProjectDetail } from "@/lib/types";
import { TopNav } from "@/components/TopNav";
import { useBoards } from "@/components/nav/store";
import { recordBoardVisit } from "@/components/home/recent";
import { Button, ConfirmDialog, SectionMessage } from "@/components/ui";
import { ArchivedBanner } from "./ArchivedBanner";
import { BoardHeader } from "./BoardHeader";
import { BoardMenuDrawer } from "./BoardMenuDrawer";
import { BoardSidebar } from "./BoardSidebar";
import { MobileModuleTabs } from "./MobileModuleTabs";
import { activeModule } from "./modules";
import type { PanelId } from "./menu/panels";
import { ProjectContext, useProject } from "./ProjectContext";
import { ShellSkeleton } from "./ShellSkeleton";
import { useBoardActions } from "./useBoardActions";
import { useStoredBoolean } from "./useStoredBoolean";

const SIDEBAR_KEY = "devboard:board-sidebar-collapsed:v1";
const MENU_ID = "board-menu";
/** Narrow laptop and tablet widths start with the icon rail; the choice is remembered afterwards. */
const collapsedByDefault = () => typeof window !== "undefined" && window.innerWidth < 1024;

const isTyping = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true']");

/**
 * Board shell. Fetches the board once, provides ProjectContext (useProject), and paints the board background behind
 * the Trello-style chrome: glass header, sidebar (module navigation) and the right "Show menu" drawer.
 *
 * Layout contract with the module pages:
 * - Tasks is full-bleed on the board background: the page root gets a container with a definite height (h-full).
 * - Every other module renders inside a white content sheet (full width and height, rounded, shadow) that scrolls vertically.
 *   Those pages start with a PageHeader and add no outer background, padding or max width of their own.
 */
export function ProjectShell({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname() ?? "";
  const { data, error, loading, refetch, setData } = useFetch<ProjectDetail>(id ? `/api/projects/${id}` : null);
  const { data: cachedBoards } = useBoards({ enabled: false });

  const setProject = useCallback((updater: (p: ProjectDetail) => ProjectDetail) => setData((prev) => (prev ? updater(prev) : prev)), [setData]);

  // The page itself never scrolls: the shell is exactly one viewport tall and its regions scroll.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  const project = data && String(data._id) === String(id) ? data : null;

  useEffect(() => {
    if (project?._id) recordBoardVisit(project._id);
  }, [project?._id]);

  useEffect(() => {
    if (!project?.name) return;
    const prev = document.title;
    document.title = `${project.name} | DevBoard`;
    return () => {
      document.title = prev;
    };
  }, [project?.name]);

  const ctx = useMemo(() => (project ? { project, refetch, setProject } : null), [project, refetch, setProject]);

  if (loading && !project) {
    const cached = cachedBoards?.find((b) => b._id === id);
    return (
      <div className="flex h-dvh flex-col overflow-hidden" style={{ background: boardBackground(cached?.color ?? "ocean") }}>
        <TopNav transparent />
        <ShellSkeleton name={cached?.name} tasks={/\/tasks\/?$/.test(pathname)} />
      </div>
    );
  }

  if (error || !ctx) return <ShellError message={error ?? "Project not found"} onRetry={() => void refetch()} />;

  return (
    <ProjectContext.Provider value={ctx}>
      <ShellFrame base={`/boards/${ctx.project._id}`} pathname={pathname}>
        {children}
      </ShellFrame>
    </ProjectContext.Provider>
  );
}

function ShellError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const notFound = /not found|invalid id/i.test(message);
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface">
      <TopNav />
      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-10">
        <div className="mx-auto w-full max-w-lg">
          <SectionMessage
            appearance={notFound ? "warning" : "error"}
            title={notFound ? "Board not found" : "Couldn't load the board"}
            actions={
              <>
                {notFound ? null : (
                  <Button variant="link" onClick={onRetry} className="!font-semibold">
                    Try again
                  </Button>
                )}
                <Link href="/boards" className="link font-semibold">
                  Back to boards
                </Link>
              </>
            }
          >
            {notFound ? "This board doesn't exist, or it was deleted." : message}
          </SectionMessage>
        </div>
      </main>
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function deletionSummary(s: ProjectDetail["stats"]): string {
  const parts = [
    s.tasks ? plural(s.tasks, "task") : "",
    s.env ? plural(s.env, "variable") : "",
    s.passwords ? plural(s.passwords, "credential") : "",
    s.files ? plural(s.files, "file") : "",
    s.notes ? plural(s.notes, "note") : "",
    s.expenses ? plural(s.expenses, "expense") : "",
  ].filter(Boolean);
  if (parts.length === 0) return "";
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

function ShellFrame({ base, pathname, children }: { base: string; pathname: string; children: React.ReactNode }) {
  const { project } = useProject();
  const actions = useBoardActions();
  const active = activeModule(pathname, base);
  const isTasks = active.id === "tasks";
  const [collapsed, setCollapsed] = useStoredBoolean(SIDEBAR_KEY, collapsedByDefault);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<PanelId>("root");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLElement>(null);

  const closeMenu = useCallback((restoreFocus = true) => {
    setMenuOpen(false);
    setPanel("root");
    if (restoreFocus) requestAnimationFrame(() => menuButtonRef.current?.focus({ preventScroll: true }));
  }, []);
  const openMenu = useCallback((next: PanelId = "root") => {
    setPanel(next);
    setMenuOpen(true);
  }, []);

  // Navigating to another module closes the drawer; the new module starts at the top.
  useEffect(() => {
    setMenuOpen(false);
    setPanel("root");
    contentRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // "]" toggles the board menu and "[" the sidebar (Trello shortcuts), never while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== "]" && e.key !== "[") || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      e.preventDefault();
      if (e.key === "[") setCollapsed((c) => !c);
      else if (menuOpen) closeMenu();
      else openMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen, closeMenu, openMenu, setCollapsed]);

  const summary = deletionSummary(project.stats);
  const archived = project.status === "archived";

  return (
    <>
      <div className="flex h-dvh flex-col overflow-hidden" style={{ background: boardBackground(project.color) }}>
        <a
          href="#board-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[var(--z-flag)] focus:rounded-control focus:bg-canvas focus:px-3 focus:py-2 focus:text-body focus:font-semibold focus:text-ink focus:shadow-overlay"
        >
          Skip to board content
        </a>
        <TopNav transparent />
        <BoardHeader menuOpen={menuOpen} menuId={MENU_ID} menuButtonRef={menuButtonRef} onToggleMenu={() => (menuOpen ? closeMenu() : openMenu())} onOpenTags={() => openMenu("tags")} />

        <div className="flex min-h-0 flex-1">
          <BoardSidebar project={project} base={base} activeId={active.id} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

          <div className="flex min-w-0 flex-1 flex-col">
            <MobileModuleTabs base={base} activeId={active.id} />
            {archived ? <ArchivedBanner fullBleed={isTasks} /> : null}
            {isTasks ? (
              <main id="board-content" ref={contentRef} tabIndex={-1} aria-label={active.label} className="min-h-0 flex-1 overflow-hidden outline-none">
                <div className="h-full">{children}</div>
              </main>
            ) : (
              <main id="board-content" ref={contentRef} tabIndex={-1} aria-label={active.label} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-2 outline-none sm:p-3">
                <div className="content-sheet w-full flex-1 p-4 sm:p-6">{children}</div>
              </main>
            )}
          </div>
        </div>
      </div>

      {menuOpen ? <BoardMenuDrawer id={MENU_ID} panel={panel} onPanelChange={setPanel} onClose={() => closeMenu()} onDelete={() => setConfirmDelete(true)} /> : null}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={actions.remove}
        title={`Delete board "${project.name.length > 60 ? `${project.name.slice(0, 57)}…` : project.name}"?`}
        confirmLabel="Delete board"
        confirmText={project.name.length <= 40 ? project.name : "delete"}
        message={
          <>
            <p>
              <strong className="break-words font-semibold text-ink">{project.name}</strong> will be permanently deleted{summary ? `, together with ${summary}` : ""}. This cannot be undone.
            </p>
            <p className="mt-2">Not sure yet? Archive the board instead. You can restore it any time.</p>
          </>
        }
      />
    </>
  );
}
