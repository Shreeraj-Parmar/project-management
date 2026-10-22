"use client";

import Link from "next/link";
import { Check, LayoutGrid, Star } from "lucide-react";
import { api, cn, relativeTime } from "@/lib/client";
import { BOARD_TEMPLATES, boardBackground } from "@/lib/constants";
import type { Project } from "@/lib/types";
import { Button, Skeleton, Tooltip, useToast } from "@/components/ui";
import { recordBoardVisit, useRecentBoards } from "../home/recent";
import { boardHref, templateSummary } from "../home/board-utils";
import { BoardThumb, WorkspaceTile } from "./BoardThumb";
import { boardsResource, useBoards } from "./store";

/** Up/Down/Home/End move focus between the rows (`data-nav-item`) of a popover panel. */
export function arrowNav(e: React.KeyboardEvent<HTMLElement>) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
  if (!keys.includes(e.key)) return;
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-nav-item]:not([disabled])"));
  if (!items.length) return;
  const i = items.indexOf(document.activeElement as HTMLElement);
  let n = i;
  if (e.key === "ArrowDown") n = i < 0 ? 0 : (i + 1) % items.length;
  else if (e.key === "ArrowUp") n = i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length;
  else if (e.key === "Home") n = 0;
  else n = items.length - 1;
  e.preventDefault();
  items[n]?.focus();
}

function Caption({ children }: { children: React.ReactNode }) {
  return <h3 className="px-3 pb-1 pt-2 text-h-xxs font-semibold text-ink-soft">{children}</h3>;
}

function RowSkeletons() {
  return (
    <div className="space-y-1 px-3 py-1" role="status" aria-label="Loading boards">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2 py-1">
          <Skeleton width={40} height={32} className="!rounded-control" />
          <div className="flex-1 space-y-1.5">
            <Skeleton height={12} width="70%" />
            <Skeleton height={10} width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelNote({ title, children }: { title?: string; children?: React.ReactNode }) {
  return (
    <div className="px-3 py-4 text-center">
      {title ? <div className="text-body font-semibold text-ink">{title}</div> : null}
      {children ? <div className={cn("text-body text-ink-soft", title && "mt-0.5")}>{children}</div> : null}
    </div>
  );
}

function Failed({ onRetry }: { onRetry: () => void }) {
  return (
    <PanelNote title="Couldn't load your boards">
      <Button variant="link" onClick={onRetry}>
        Try again
      </Button>
    </PanelNote>
  );
}

type RowProps = {
  project: Project;
  subtitle: React.ReactNode;
  onNavigate?: () => void;
  /** Interactive control on the right (outside the link). */
  action?: React.ReactNode;
  className?: string;
};

/** Board row used by Recent and Starred: gradient thumb, bold name, quiet subline. */
export function BoardRow({ project: p, subtitle, onNavigate, action }: RowProps) {
  return (
    <div className="relative">
      <Link
        href={boardHref(p._id)}
        data-nav-item
        onClick={() => {
          recordBoardVisit(p._id);
          onNavigate?.();
        }}
        className={cn("menu-item !gap-3 !py-1.5", !!action && "!pr-10")}
      >
        <BoardThumb color={p.color} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{p.name}</span>
          <span className="block truncate text-body-sm text-ink-muted">{subtitle}</span>
        </span>
      </Link>
      {action ? <span className="absolute right-1.5 top-1/2 -translate-y-1/2">{action}</span> : null}
    </div>
  );
}

const lastOpened = (visitedAt: number | null, p: Project) => (visitedAt ? `Last opened ${relativeTime(new Date(visitedAt))}` : `Updated ${relativeTime(p.updatedAt)}`);

export function RecentPanel({ onNavigate }: { onNavigate?: () => void }) {
  const boards = useBoards();
  const recent = useRecentBoards(boards.data, { limit: 6 });
  return (
    <div onKeyDown={arrowNav} className="py-1">
      <Caption>Recent boards</Caption>
      {boards.loading ? (
        <RowSkeletons />
      ) : boards.error && !boards.data ? (
        <Failed onRetry={() => boards.refetch()} />
      ) : recent.length === 0 ? (
        <PanelNote title="No recent boards">Boards you open will show up here.</PanelNote>
      ) : (
        recent.map(({ project, visitedAt }) => <BoardRow key={project._id} project={project} subtitle={lastOpened(visitedAt, project)} onNavigate={onNavigate} />)
      )}
      <hr role="separator" className="my-1 border-0 border-t border-fill-hover" />
      <Link href="/boards" data-nav-item onClick={onNavigate} className="menu-item">
        <LayoutGrid size={16} aria-hidden />
        View all boards
      </Link>
    </div>
  );
}

export function StarredPanel({ onNavigate }: { onNavigate?: () => void }) {
  const boards = useBoards();
  const { toast } = useToast();
  const starred = (boards.data ?? []).filter((p) => p.starred && p.status !== "archived");

  async function unstar(p: Project) {
    boardsResource.setData((prev) => (prev ? prev.map((x) => (x._id === p._id ? { ...x, starred: false } : x)) : prev));
    try {
      await api.patch(`/api/projects/${p._id}`, { starred: false });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't update the star. Try again.", "error");
      void boards.refetch(true);
    }
  }

  return (
    <div onKeyDown={arrowNav} className="py-1">
      <Caption>Starred boards</Caption>
      {boards.loading ? (
        <RowSkeletons />
      ) : boards.error && !boards.data ? (
        <Failed onRetry={() => boards.refetch()} />
      ) : starred.length === 0 ? (
        <PanelNote title="No starred boards">Star a board to keep it here.</PanelNote>
      ) : (
        starred.map((p) => (
          <BoardRow
            key={p._id}
            project={p}
            subtitle={`Updated ${relativeTime(p.updatedAt)}`}
            onNavigate={onNavigate}
            action={
              <Tooltip content="Remove from starred">
                <button
                  type="button"
                  data-nav-item
                  aria-label={`Remove ${p.name} from starred`}
                  onClick={() => unstar(p)}
                  className="group/star flex h-7 w-7 items-center justify-center rounded-control hover:bg-fill-hover"
                >
                  <Star size={16} className="text-[#e2b203] group-hover/star:text-ink-soft" fill="currentColor" aria-hidden />
                </button>
              </Tooltip>
            }
          />
        ))
      )}
    </div>
  );
}

export function TemplatesPanel({ onPick }: { onPick: (templateId: string) => void }) {
  return (
    <div onKeyDown={arrowNav} className="py-1">
      <Caption>Start with a template</Caption>
      {BOARD_TEMPLATES.map((t) => (
        <button key={t.id} type="button" data-nav-item onClick={() => onPick(t.id)} className="menu-item !items-start !gap-3 !py-2">
          <span className="mt-0.5 flex h-8 w-10 shrink-0 items-start gap-[2px] rounded-control p-[3px]" style={{ background: boardBackground("ocean") }} aria-hidden>
            {t.columns.slice(0, 5).map((c, i) => (
              <span key={c.id} className="min-w-0 flex-1 rounded-[1px] bg-white/80" style={{ height: `${[70, 50, 85, 60, 45][i % 5]}%` }} />
            ))}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t.label}</span>
            <span className="block truncate text-body-sm text-ink-muted">{templateSummary(t.columns)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function WorkspacesPanel({ onNavigate }: { onNavigate?: () => void }) {
  const boards = useBoards();
  const count = (boards.data ?? []).filter((p) => p.status !== "archived").length;
  return (
    <div onKeyDown={arrowNav} className="py-1">
      <Caption>Your workspace</Caption>
      <Link href="/boards" data-nav-item onClick={onNavigate} className="menu-item !gap-3 !py-2" aria-current="page">
        <WorkspaceTile size={32} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">DevBoard</span>
          <span className="block truncate text-body-sm text-ink-muted">
            Personal workspace{boards.data ? ` · ${count} ${count === 1 ? "board" : "boards"}` : ""}
          </span>
        </span>
        <Check size={16} className="!text-brand" aria-hidden />
      </Link>
    </div>
  );
}
