"use client";

import Link from "next/link";
import { CheckSquare, Braces, KeyRound, Files, StickyNote, Wallet, GitBranch, ExternalLink, Clock, ArrowRight } from "lucide-react";
import { formatMoney, relativeTime, formatDate } from "@/lib/client";
import { MODULES, PRIORITY_STYLE } from "@/lib/constants";
import { useProject } from "@/components/project/ProjectContext";
import { Badge } from "@/components/ui/Misc";

export default function OverviewPage() {
  const { project } = useProject();
  const s = project.stats;
  const base = `/boards/${project._id}`;
  const pct = s.tasks ? Math.round((s.doneTasks / s.tasks) * 100) : 0;
  const mod = (id: string) => MODULES.find((m) => m.id === id)!;

  const tiles = [
    { m: mod("tasks"), icon: <CheckSquare size={18} />, value: `${s.doneTasks}/${s.tasks}`, sub: "tasks done" },
    { m: mod("env"), icon: <Braces size={18} />, value: s.env, sub: "env variables" },
    { m: mod("passwords"), icon: <KeyRound size={18} />, value: s.passwords, sub: "credentials" },
    { m: mod("files"), icon: <Files size={18} />, value: s.files, sub: "files in S3" },
    { m: mod("notes"), icon: <StickyNote size={18} />, value: s.notes, sub: "notes" },
    { m: mod("spending"), icon: <Wallet size={18} />, value: formatMoney(s.spent), sub: `${s.expenses} expenses` },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero */}
      <div className="t-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-ink">{project.name}</h2>
            <p className="mt-1 text-sm text-ink-soft">{project.description || "No description yet. Use the board menu to edit."}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              <span className="flex items-center gap-1">
                <Clock size={12} /> Created {formatDate(project.createdAt)}
              </span>
              <span>•</span>
              <span>Updated {relativeTime(project.updatedAt)}</span>
              {project.git?.repo ? (
                <>
                  <span>•</span>
                  <Link href={`${base}/git`} className="flex items-center gap-1 font-semibold text-ink-soft hover:text-ink">
                    <GitBranch size={12} /> {project.git.repo}
                  </Link>
                </>
              ) : null}
            </div>
          </div>
          <div className="w-full sm:w-64">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold text-ink-soft">
              <span>Progress</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#091e4224]">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: mod("tasks").color }} />
            </div>
          </div>
        </div>
        {project.links.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-md bg-brand-soft px-2.5 py-1 text-xs font-semibold text-[#0055cc] hover:bg-[#cce0ff]"
              >
                <ExternalLink size={12} /> {l.label || l.url}
              </a>
            ))}
          </div>
        ) : null}
      </div>

      {/* Module tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {tiles.map(({ m, icon, value, sub }) => (
          <Link key={m.id} href={base + m.path} className="t-card group flex flex-col gap-2 p-4 transition">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: m.color }}>
              {icon}
            </div>
            <div>
              <div className="text-lg font-bold text-ink">{value}</div>
              <div className="text-xs text-ink-muted">{sub}</div>
            </div>
            <div className="mt-auto flex items-center gap-1 text-xs font-semibold opacity-0 transition group-hover:opacity-100" style={{ color: m.color }}>
              Open <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent tasks */}
        <section className="t-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: mod("tasks").color }} /> Recent tasks
            </h3>
            <Link href={`${base}/tasks`} className="text-xs font-semibold text-brand hover:underline">
              Open board
            </Link>
          </div>
          {project.recentTasks.length === 0 ? (
            <p className="text-sm text-ink-muted">No tasks yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {project.recentTasks.map((t) => {
                const col = project.columns.find((c) => c.id === t.columnId);
                const pr = PRIORITY_STYLE[t.priority];
                return (
                  <li key={t._id} className="flex items-center gap-3 py-2">
                    <span className={`truncate text-sm ${t.completedAt ? "line-through text-ink-muted" : "text-ink"}`}>{t.title}</span>
                    <span className="ml-auto flex shrink-0 items-center gap-1.5">
                      <Badge bg={pr.bg} fg={pr.fg} className="capitalize">
                        {t.priority}
                      </Badge>
                      <Badge bg="#f1f2f4" fg="#44546f">
                        {col?.title ?? t.columnId}
                      </Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recent notes */}
        <section className="t-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: mod("notes").color }} /> Recent notes
            </h3>
            <Link href={`${base}/notes`} className="text-xs font-semibold text-brand hover:underline">
              All notes
            </Link>
          </div>
          {project.recentNotes.length === 0 ? (
            <p className="text-sm text-ink-muted">No notes yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {project.recentNotes.map((n) => (
                <Link key={n._id} href={`${base}/notes`} className="rounded-lg p-3 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-raised)]" style={{ background: n.color }}>
                  <div className="truncate text-sm font-semibold text-ink">{n.title}</div>
                  <p className="mt-1 line-clamp-3 text-xs text-ink-soft">{n.content || "Empty note"}</p>
                  <div className="mt-2 text-[11px] text-ink-muted">{relativeTime(n.updatedAt)}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
