import Link from "next/link";
import { CheckSquare, StickyNote } from "lucide-react";
import { relativeTime } from "@/lib/client";
import { MODULES, PRIORITY_STYLE } from "@/lib/constants";
import { Badge, Lozenge } from "@/components/ui";
import type { ProjectDetail } from "@/lib/types";

function Panel({ title, icon, color, href, linkLabel, children }: { title: string; icon: React.ReactNode; color: string; href: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section className="t-card t-card--static p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-h-xs font-semibold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-control text-white" style={{ background: color }} aria-hidden>
            {icon}
          </span>
          {title}
        </h2>
        <Link href={href} className="link text-body-sm font-medium">
          {linkLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

export function RecentTasks({ base, project }: { base: string; project: ProjectDetail }) {
  const color = MODULES.find((m) => m.id === "tasks")!.color;
  return (
    <Panel title="Recent tasks" icon={<CheckSquare size={14} />} color={color} href={`${base}/tasks`} linkLabel="Open board">
      {project.recentTasks.length === 0 ? (
        <p className="py-4 text-body text-ink-muted">No tasks yet. Add your first card on the board.</p>
      ) : (
        <ul className="divide-y divide-line">
          {project.recentTasks.map((t) => {
            const col = project.columns.find((c) => c.id === t.columnId);
            const pr = PRIORITY_STYLE[t.priority];
            return (
              <li key={t._id}>
                <Link href={`${base}/tasks`} className="-mx-2 flex items-center gap-3 rounded-control px-2 py-2 hover:bg-fill-subtle">
                  <span className={`min-w-0 flex-1 truncate text-body ${t.completedAt ? "text-ink-muted line-through" : "text-ink"}`}>{t.title}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Badge bg={pr.bg} fg={pr.fg} className="capitalize">
                      {t.priority}
                    </Badge>
                    <span className="hidden sm:inline-flex">
                      <Lozenge maxWidth={110}>{col?.title ?? t.columnId}</Lozenge>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function RecentNotes({ base, project }: { base: string; project: ProjectDetail }) {
  const color = MODULES.find((m) => m.id === "notes")!.color;
  return (
    <Panel title="Recent notes" icon={<StickyNote size={14} />} color={color} href={`${base}/notes`} linkLabel="All notes">
      {project.recentNotes.length === 0 ? (
        <p className="py-4 text-body text-ink-muted">No notes yet. Jot down decisions and snippets.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {project.recentNotes.map((n) => (
            <Link key={n._id} href={`${base}/notes`} className="min-w-0 rounded-card border border-line p-3 shadow-card transition-shadow hover:shadow-overlay" style={{ background: n.color }}>
              <div className="truncate text-body font-semibold text-ink">{n.title}</div>
              <p className="mt-1 line-clamp-3 text-body-sm text-ink-soft">{n.content || "Empty note"}</p>
              <div className="mt-2 text-micro text-ink-muted">{relativeTime(n.updatedAt)}</div>
            </Link>
          ))}
        </div>
      )}
    </Panel>
  );
}
