"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bell, CalendarClock, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/client";
import type { Task } from "@/lib/types";
import { Button, IconButton, Popover, Skeleton } from "@/components/ui";
import { dueInfo } from "../home/board-utils";
import { arrowNav } from "./Panels";
import { useBoards, useDashboard } from "./store";
import type { Tone } from "./HeaderMenus";

function Row({ task, board, overdue, onNavigate }: { task: Task; board: string; overdue: boolean; onNavigate: () => void }) {
  const info = dueInfo(task);
  return (
    <Link href={`/boards/${task.projectId}/tasks`} data-nav-item onClick={onNavigate} className="menu-item !items-start !gap-3 !py-2">
      <span
        aria-hidden
        className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", overdue ? "bg-danger-soft text-danger-text" : "bg-warning-soft text-warning")}
      >
        {overdue ? <TriangleAlert size={16} /> : <CalendarClock size={16} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 break-words font-semibold">{task.title}</span>
        <span className="flex gap-1 text-body-sm text-ink-muted">
          <span className={cn("shrink-0", overdue && "font-semibold text-danger-text")}>{info.long}</span>
          {board ? <span className="min-w-0 truncate">· {board}</span> : null}
        </span>
      </span>
    </Link>
  );
}

/** Bell with a count badge. Single user, so it reports what needs attention: overdue and due-this-week tasks. */
export function NotificationsMenu({ tone }: { tone: Tone }) {
  const dash = useDashboard();
  const boards = useBoards();
  const overdue = dash.data?.overdue ?? [];
  const soon = dash.data?.dueSoon ?? [];
  const count = overdue.length + soon.length;
  const names = useMemo(() => new Map((boards.data ?? []).map((p) => [p._id, p.name])), [boards.data]);
  const label = count > 0 ? `Notifications, ${count} due` : "Notifications";

  return (
    <Popover
      trigger={
        <IconButton title={label} variant={tone === "glass" ? "transparent" : "subtle"} className={tone === "glass" ? "aria-expanded:bg-white/25" : "aria-expanded:bg-brand-soft aria-expanded:text-brand"}>
          <Bell size={16} aria-hidden />
          {count > 0 ? (
            <span
              aria-hidden
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white",
                tone === "light" && "ring-2 ring-canvas"
              )}
            >
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </IconButton>
      }
      title="Notifications"
      width={380}
      placement="bottom-end"
      padded={false}
      bodyClassName="max-h-[min(560px,calc(100dvh-96px))] pb-2"
    >
      {(api) => (
        <div onKeyDown={arrowNav}>
          {dash.loading ? (
            <div className="space-y-2 px-3 py-2" role="status" aria-label="Loading notifications">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton circle width={32} height={32} />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton height={12} width="75%" />
                    <Skeleton height={10} width="45%" />
                  </div>
                </div>
              ))}
            </div>
          ) : dash.error && !dash.data ? (
            <div className="px-3 py-6 text-center">
              <div className="text-body font-semibold text-ink">Couldn&apos;t load notifications</div>
              <Button variant="link" className="mt-1" onClick={() => dash.refetch()}>
                Try again
              </Button>
            </div>
          ) : count === 0 ? (
            <div className="px-3 py-8 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success-text" aria-hidden>
                <Bell size={18} />
              </div>
              <div className="text-body font-semibold text-ink">You&apos;re all caught up</div>
              <div className="text-body text-ink-soft">Overdue and upcoming tasks show up here.</div>
            </div>
          ) : (
            <>
              {overdue.length > 0 ? (
                <section>
                  <h3 className="px-3 pb-1 pt-1 text-h-xxs font-semibold text-ink-soft">Overdue</h3>
                  {overdue.map((t) => (
                    <Row key={t._id} task={t} board={names.get(t.projectId) ?? ""} overdue onNavigate={api.close} />
                  ))}
                </section>
              ) : null}
              {soon.length > 0 ? (
                <section className={cn(overdue.length > 0 && "mt-1 border-t border-fill-hover pt-1")}>
                  <h3 className="px-3 pb-1 pt-1 text-h-xxs font-semibold text-ink-soft">Due this week</h3>
                  {soon.map((t) => (
                    <Row key={t._id} task={t} board={names.get(t.projectId) ?? ""} overdue={false} onNavigate={api.close} />
                  ))}
                </section>
              ) : null}
            </>
          )}
        </div>
      )}
    </Popover>
  );
}
