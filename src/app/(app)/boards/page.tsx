"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Star, Plus, LayoutGrid, CheckSquare, Wallet, Lock, Clock, AlertTriangle, FolderKanban } from "lucide-react";
import { api, formatMoney, formatDate, relativeTime, useFetch } from "@/lib/client";
import { boardBackground, MODULES } from "@/lib/constants";
import type { DashboardData, Project } from "@/lib/types";
import { TopNav } from "@/components/TopNav";
import { CreateBoardModal } from "@/components/CreateBoardModal";
import { Spinner, ErrorBox, StatTile, Badge } from "@/components/ui/Misc";
import { useToast } from "@/components/ui/Toast";

const STATUS_BADGE: Record<Project["status"], { bg: string; fg: string }> = {
  active: { bg: "#dcfff1", fg: "#164b35" },
  paused: { bg: "#fff7d6", fg: "#533f04" },
  completed: { bg: "#e9f2ff", fg: "#09326c" },
  archived: { bg: "#f1f2f4", fg: "#44546f" },
};

export default function BoardsPage() {
  const { toast } = useToast();
  const projects = useFetch<Project[]>("/api/projects");
  const dash = useFetch<DashboardData>("/api/dashboard");
  const [query, setQuery] = useState("");
  const [create, setCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | Project["status"]>("all");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (projects.data ?? []).filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
    });
  }, [projects.data, query, filter]);

  const starred = list.filter((p) => p.starred);
  const projectName = (id: string) => projects.data?.find((p) => p._id === id)?.name ?? "";

  async function toggleStar(p: Project) {
    const next = !p.starred;
    projects.setData((prev) => (prev ? prev.map((x) => (x._id === p._id ? { ...x, starred: next } : x)) : prev));
    try {
      await api.patch(`/api/projects/${p._id}`, { starred: next });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
      projects.refetch(true);
    }
  }

  return (
    <>
      <TopNav onSearch={setQuery} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {/* Dashboard stats */}
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
            <LayoutGrid size={18} className="text-brand" /> Workspace overview
          </h2>
          {dash.error ? (
            <ErrorBox message={dash.error} onRetry={() => dash.refetch()} />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile label="Boards" value={dash.data?.counts.projects ?? "–"} color={MODULES[0].color} icon={<FolderKanban size={18} />} />
              <StatTile label="Open tasks" value={dash.data?.counts.openTasks ?? "–"} color={MODULES[1].color} icon={<CheckSquare size={18} />} />
              <StatTile label="Total spent" value={dash.data ? formatMoney(dash.data.counts.spent) : "–"} color={MODULES[6].color} icon={<Wallet size={18} />} />
              <StatTile label="Secrets stored" value={dash.data ? dash.data.counts.env + dash.data.counts.passwords : "–"} color={MODULES[3].color} icon={<Lock size={18} />} />
            </div>
          )}
          {dash.data && (dash.data.overdue.length > 0 || dash.data.dueSoon.length > 0) ? (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {dash.data.overdue.length > 0 ? (
                <TaskList title="Overdue" icon={<AlertTriangle size={15} />} color="#c9372c" tasks={dash.data.overdue} projectName={projectName} />
              ) : null}
              {dash.data.dueSoon.length > 0 ? (
                <TaskList title="Due this week" icon={<Clock size={15} />} color="#946f00" tasks={dash.data.dueSoon} projectName={projectName} />
              ) : null}
            </div>
          ) : null}
        </section>

        {/* Starred */}
        {starred.length > 0 ? (
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
              <Star size={18} className="text-[#e2b203]" /> Starred boards
            </h2>
            <BoardGrid projects={starred} onStar={toggleStar} />
          </section>
        ) : null}

        {/* All boards */}
        <section id="boards">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <FolderKanban size={18} className="text-brand" /> Your boards
              <span className="text-sm font-normal text-ink-muted">({list.length})</span>
            </h2>
            <div className="flex items-center gap-1 rounded-md bg-[#091e420f] p-0.5 text-[13px]">
              {(["all", "active", "paused", "completed", "archived"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded px-2.5 py-1 capitalize ${filter === s ? "bg-white font-semibold text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {projects.loading ? (
            <Spinner />
          ) : projects.error ? (
            <ErrorBox message={projects.error} onRetry={() => projects.refetch()} />
          ) : (
            <BoardGrid projects={list} onStar={toggleStar} onCreate={() => setCreate(true)} />
          )}
        </section>
      </main>
      <CreateBoardModal open={create} onClose={() => setCreate(false)} onCreated={() => projects.refetch(true)} />
    </>
  );
}

function TaskList({ title, icon, color, tasks, projectName }: { title: string; icon: React.ReactNode; color: string; tasks: DashboardData["dueSoon"]; projectName: (id: string) => string }) {
  return (
    <div className="t-card p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold" style={{ color }}>
        {icon} {title}
      </div>
      <ul className="space-y-1">
        {tasks.map((t) => (
          <li key={t._id}>
            <Link href={`/boards/${t.projectId}/tasks`} className="flex items-center justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-[#091e420f]">
              <span className="truncate">
                {t.title}
                <span className="ml-2 text-xs text-ink-muted">{projectName(t.projectId)}</span>
              </span>
              <span className="shrink-0 text-xs text-ink-muted">{formatDate(t.dueDate, { month: "short", day: "numeric" })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BoardGrid({ projects, onStar, onCreate }: { projects: Project[]; onStar: (p: Project) => void; onCreate?: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {projects.map((p) => (
        <BoardTile key={p._id} project={p} onStar={() => onStar(p)} />
      ))}
      {onCreate ? (
        <button
          onClick={onCreate}
          className="flex h-[120px] flex-col items-center justify-center gap-1 rounded-lg bg-[#091e420f] text-sm font-medium text-ink-soft transition hover:bg-[#091e4224]"
        >
          <Plus size={20} />
          Create new board
        </button>
      ) : null}
    </div>
  );
}

function BoardTile({ project: p, onStar }: { project: Project; onStar: () => void }) {
  const pct = p.stats && p.stats.tasks > 0 ? Math.round((p.stats.done / p.stats.tasks) * 100) : 0;
  const status = STATUS_BADGE[p.status] ?? STATUS_BADGE.active;
  return (
    <div className="group relative h-[120px] overflow-hidden rounded-lg text-white shadow-sm transition hover:shadow-[var(--shadow-raised)]" style={{ background: boardBackground(p.color) }}>
      <Link href={`/boards/${p._id}`} className="absolute inset-0 flex flex-col p-3 hover:bg-black/10">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-bold drop-shadow">{p.name}</h3>
            {p.description ? <p className="mt-0.5 line-clamp-1 text-xs text-white/85">{p.description}</p> : null}
          </div>
          <Badge bg={status.bg} fg={status.fg} className="shrink-0 capitalize">
            {p.status}
          </Badge>
        </div>
        <div className="mt-auto">
          <div className="mb-1.5 flex flex-wrap gap-1">
            {p.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded bg-white/25 px-1.5 text-[10px] font-semibold uppercase tracking-wide">
                {t}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/90">
            <span className="flex items-center gap-1">
              <CheckSquare size={12} /> {p.stats?.done ?? 0}/{p.stats?.tasks ?? 0}
            </span>
            {p.stats?.spent ? (
              <span className="flex items-center gap-1">
                <Wallet size={12} /> {formatMoney(p.stats.spent)}
              </span>
            ) : null}
            <span className="ml-auto flex items-center gap-1 opacity-80">
              <Clock size={11} /> {relativeTime(p.updatedAt)}
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded bg-white/30">
            <div className="h-full rounded bg-white" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onStar();
        }}
        title={p.starred ? "Unstar" : "Star"}
        className={`absolute bottom-10 right-2 rounded p-1 transition ${p.starred ? "text-[#f5cd47]" : "text-white opacity-0 group-hover:opacity-100 hover:scale-110"}`}
      >
        <Star size={16} fill={p.starred ? "#f5cd47" : "none"} />
      </button>
    </div>
  );
}
