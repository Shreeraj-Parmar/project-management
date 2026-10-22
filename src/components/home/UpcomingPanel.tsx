"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ChevronDown, ChevronUp, Clock, TriangleAlert } from "lucide-react";
import type { DashboardData } from "@/lib/types";
import { Button, IconButton, Lozenge, Skeleton } from "@/components/ui";
import { dueInfo } from "./board-utils";
import { useStoredState } from "./storage";

const SHOWN = 4;

/** Overdue and due-this-week tasks across every board. Collapsible (the choice is remembered). */
export function UpcomingPanel({ data, loading, names }: { data: DashboardData | null; loading: boolean; names: Map<string, string> }) {
  const [state, setState] = useStoredState<"open" | "closed">("devboard:home:upcoming", "open", (v): v is "open" | "closed" => v === "open" || v === "closed");
  const [all, setAll] = useState(false);
  const collapsed = state === "closed";

  const items = useMemo(
    () => [...(data?.overdue ?? []).map((t) => ({ t, overdue: true })), ...(data?.dueSoon ?? []).map((t) => ({ t, overdue: false }))],
    [data]
  );
  const overdue = data?.overdue.length ?? 0;
  const soon = data?.dueSoon.length ?? 0;
  const shown = all ? items : items.slice(0, SHOWN);

  return (
    <section id="upcoming" aria-labelledby="upcoming-title" className="t-card t-card--static scroll-mt-20">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <CalendarClock size={20} className="shrink-0 text-ink-soft" aria-hidden />
        <h2 id="upcoming-title" className="text-h-s font-semibold text-ink">
          Upcoming
        </h2>
        {data && items.length > 0 ? (
          <p className="min-w-0 truncate text-body-sm text-ink-muted">
            {overdue > 0 ? <span className="font-semibold text-danger-text">{overdue} overdue</span> : null}
            {overdue > 0 && soon > 0 ? " · " : null}
            {soon > 0 ? `${soon} due this week` : null}
          </p>
        ) : null}
        <IconButton
          title={collapsed ? "Expand upcoming" : "Collapse upcoming"}
          size="sm"
          className="ml-auto"
          aria-expanded={!collapsed}
          aria-controls="upcoming-body"
          onClick={() => setState(collapsed ? "open" : "closed")}
        >
          {collapsed ? <ChevronDown size={16} aria-hidden /> : <ChevronUp size={16} aria-hidden />}
        </IconButton>
      </div>

      {!collapsed ? (
        <div id="upcoming-body" className="border-t border-line px-2 pb-2 pt-1">
          {loading ? (
            <div className="space-y-2 px-2 py-2" role="status" aria-label="Loading upcoming tasks">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={20} width={i === 1 ? "80%" : "92%"} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="flex items-center gap-2 px-2 py-3 text-body text-ink-soft">
              <CheckCircle2 size={16} className="text-success" aria-hidden />
              You&apos;re all caught up. Nothing is overdue or due this week.
            </p>
          ) : (
            <>
              <ul>
                {shown.map(({ t, overdue: isOverdue }) => {
                  const info = dueInfo(t);
                  return (
                    <li key={t._id}>
                      <Link href={`/boards/${t.projectId}/tasks`} className="flex min-h-9 items-center gap-3 rounded-control px-2 py-1.5 text-body hover:bg-fill">
                        {isOverdue ? <TriangleAlert size={16} className="shrink-0 text-danger" aria-hidden /> : <Clock size={16} className="shrink-0 text-warning" aria-hidden />}
                        <span className="min-w-0 flex-1 truncate font-medium text-ink">{t.title}</span>
                        <span className="hidden max-w-[200px] shrink-0 truncate text-body-sm text-ink-muted md:block">{names.get(t.projectId) ?? ""}</span>
                        <span className="w-14 shrink-0 text-right text-body-sm text-ink-soft">{info.short}</span>
                        <span className="hidden w-[68px] shrink-0 sm:block">
                          <Lozenge appearance={isOverdue ? "removed" : "moved"}>{isOverdue ? "Overdue" : "Due soon"}</Lozenge>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {items.length > SHOWN ? (
                <div className="px-2 pt-1">
                  <Button variant="subtle" size="sm" onClick={() => setAll((v) => !v)} aria-expanded={all}>
                    {all ? "Show fewer" : `Show ${items.length - SHOWN} more`}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
