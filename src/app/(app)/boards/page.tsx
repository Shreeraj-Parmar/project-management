"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Star,
  Plus,
  LayoutGrid,
  CheckSquare,
  Wallet,
  Lock,
  Clock,
  AlertTriangle,
  FolderKanban,
  Archive,
  Search,
  Braces,
  KeyRound,
  Files,
  StickyNote,
  GitBranch,
  ArrowRight,
} from "lucide-react";
import { api, cn, formatMoney, formatDate, relativeTime, useFetch } from "@/lib/client";
import { boardBackground, MODULES } from "@/lib/constants";
import type { DashboardData, Project } from "@/lib/types";
import { TopNav } from "@/components/TopNav";
import { CreateBoardModal } from "@/components/CreateBoardModal";
import { Spinner, ErrorBox, StatTile } from "@/components/ui/Misc";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type View = "boards" | "starred" | "archived";
type Sort = "recent" | "az" | "za" | "created";
type StatusFilter = "all" | Project["status"];

const STATUS_DOT: Record<Project["status"], string> = {
  active: "#4bce97",
  paused: "#f5cd47",
  completed: "#579dff",
  archived: "#8590a2",
};

export default function BoardsPage() {
  const { toast } = useToast();
  const projects = useFetch<Project[]>("/api/projects");
  const dash = useFetch<DashboardData>("/api/dashboard");
  const [query, setQuery] = useState("");
  const [create, setCreate] = useState(false);
  const [view, setView] = useState<View>("boards");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("recent");

  const all = useMemo(() => projects.data ?? [], [projects.data]);
  const q = query.trim().toLowerCase();

  const list = useMemo(() => {
    const matches = (p: Project) => !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
    let out = all.filter(matches);
    if (view === "starred") out = out.filter((p) => p.starred);
    else if (view === "archived") out = out.filter((p) => p.status === "archived");
    else out = out.filter((p) => (status === "all" ? p.status !== "archived" : p.status === status));
    const by: Record<Sort, (a: Project, b: Project) => number> = {
      recent: (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      created: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      az: (a, b) => a.name.localeCompare(b.name),
      za: (a, b) => b.name.localeCompare(a.name),
    };
    return [...out].sort(by[sort]);
  }, [all, q, view, status, sort]);

  const starred = all.filter((p) => p.starred && p.status !== "archived");
  const recent = [...all]
    .filter((p) => p.status !== "archived")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);
  const archivedCount = all.filter((p) => p.status === "archived").length;
  const projectName = (id: string) => all.find((p) => p._id === id)?.name ?? "";

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

  const isEmpty = !projects.loading && !projects.error && all.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopNav onSearch={setQuery} />
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 gap-8 px-4 py-8 sm:px-6">
        {/* Sidebar (Trello home style) */}
        <aside className="hidden w-60 shrink-0 md:block">
          <nav className="sticky top-20 space-y-5">
            <ul className="space-y-0.5">
              <SideItem icon={<LayoutGrid size={16} />} label="Boards" active={view === "boards"} onClick={() => setView("boards")} />
              <SideItem icon={<Star size={16} />} label="Starred" count={starred.length} active={view === "starred"} onClick={() => setView("starred")} />
              <SideItem icon={<Archive size={16} />} label="Archived" count={archivedCount} active={view === "archived"} onClick={() => setView("archived")} />
            </ul>
            <div>
              <div className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Workspace</div>
              <div className="flex items-center gap-2 px-3 py-1.5">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-[#0747a6] to-[#0c66e4] text-sm font-bold text-white">D</span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink">DevBoard</div>
                  <div className="text-[11px] text-ink-muted">Personal workspace</div>
                </div>
              </div>
              <ul className="mt-1 space-y-0.5">
                <li>
                  <a href="#overview" className="flex items-center gap-2.5 rounded px-3 py-1.5 text-sm text-ink-soft hover:bg-[#091e420f] hover:text-ink">
                    <span className="w-4" /> Overview
                  </a>
                </li>
                <li>
                  <a href="#boards" className="flex items-center gap-2.5 rounded px-3 py-1.5 text-sm text-ink-soft hover:bg-[#091e420f] hover:text-ink">
                    <span className="w-4" /> All boards
                  </a>
                </li>
                <li>
                  <button onClick={() => setCreate(true)} className="flex w-full items-center gap-2.5 rounded px-3 py-1.5 text-left text-sm text-ink-soft hover:bg-[#091e420f] hover:text-ink">
                    <span className="w-4" /> Create board
                  </button>
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-line bg-surface p-3 text-[12px] leading-5 text-ink-soft">
              <div className="mb-1 flex items-center gap-1.5 font-bold text-ink">
                <FolderKanban size={14} className="text-brand" /> What is a board?
              </div>
              A board is <strong>one project</strong>. Every board has its own tasks (kanban), env variables, passwords, files, notes, spending and git repo, so nothing gets mixed between projects.
            </div>
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 space-y-10">
          {/* Mobile view switcher (sidebar is hidden on small screens) */}
          <div className="flex gap-1 rounded-md bg-[#091e420f] p-0.5 text-[13px] md:hidden">
            {(["boards", "starred", "archived"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn("flex-1 rounded px-2.5 py-1.5 capitalize", view === v ? "bg-white font-semibold text-ink shadow-sm" : "text-ink-soft")}
              >
                {v}
              </button>
            ))}
          </div>
          {/* Workspace header + overview */}
          <section id="overview" className="scroll-mt-16">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-[#0747a6] to-[#0c66e4] text-2xl font-bold text-white shadow-sm">D</span>
                <div>
                  <h1 className="text-xl font-bold leading-6 text-ink">DevBoard workspace</h1>
                  <p className="text-[13px] text-ink-muted">One board per project · tasks, secrets, files, notes, spending and git in one place</p>
                </div>
              </div>
              <Button icon={<Plus size={16} />} onClick={() => setCreate(true)}>
                Create board
              </Button>
            </div>

            <div className="mt-5">
              {dash.error ? (
                <ErrorBox message={dash.error} onRetry={() => dash.refetch()} />
              ) : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatTile label="Boards" value={dash.data?.counts.projects ?? "–"} color={MODULES[0].color} icon={<FolderKanban size={18} />} href="#boards" />
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
            </div>
          </section>

          {/* First-run onboarding */}
          {isEmpty ? <WelcomeCard onCreate={() => setCreate(true)} /> : null}

          {/* Starred */}
          {view === "boards" && !q && starred.length > 0 ? (
            <section>
              <SectionTitle icon={<Star size={18} className="text-[#e2b203]" fill="#e2b203" />} title="Starred boards" />
              <BoardGrid projects={starred} onStar={toggleStar} />
            </section>
          ) : null}

          {/* Recently viewed */}
          {view === "boards" && !q && recent.length > 0 ? (
            <section>
              <SectionTitle icon={<Clock size={18} className="text-ink-soft" />} title="Recently active" />
              <BoardGrid projects={recent} onStar={toggleStar} />
            </section>
          ) : null}

          {/* All boards */}
          <section id="boards" className="scroll-mt-16">
            <SectionTitle
              icon={view === "starred" ? <Star size={18} className="text-[#e2b203]" /> : view === "archived" ? <Archive size={18} className="text-ink-soft" /> : <LayoutGrid size={18} className="text-brand" />}
              title={view === "starred" ? "Starred boards" : view === "archived" ? "Archived boards" : "Your boards"}
              count={list.length}
            />
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <ToolbarSelect label="Sort by" value={sort} onChange={(v) => setSort(v as Sort)}>
                <option value="recent">Most recently active</option>
                <option value="created">Newest first</option>
                <option value="az">Alphabetically A–Z</option>
                <option value="za">Alphabetically Z–A</option>
              </ToolbarSelect>
              {view === "boards" ? (
                <ToolbarSelect label="Filter by" value={status} onChange={(v) => setStatus(v as StatusFilter)}>
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </ToolbarSelect>
              ) : null}
              <div className="ml-auto w-full sm:w-64">
                <label className="t-label">Search</label>
                <div className="relative">
                  <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search boards"
                    aria-label="Search boards"
                    className="t-input h-9"
                    style={{ paddingLeft: 32 }}
                  />
                </div>
              </div>
            </div>

            {projects.loading ? (
              <Spinner />
            ) : projects.error ? (
              <ErrorBox message={projects.error} onRetry={() => projects.refetch()} />
            ) : list.length === 0 && (q || view !== "boards" || status !== "all") ? (
              <div className="rounded-lg border border-dashed border-line px-6 py-12 text-center text-sm text-ink-muted">
                {q ? (
                  <>No boards match “{query}”.</>
                ) : view === "starred" ? (
                  <>No starred boards yet. Hover a board and click the star to pin it here.</>
                ) : view === "archived" ? (
                  <>No archived boards. Archive a board from its menu to park it without deleting anything.</>
                ) : (
                  <>No boards with that status.</>
                )}
              </div>
            ) : (
              <BoardGrid projects={list} onStar={toggleStar} onCreate={view === "boards" ? () => setCreate(true) : undefined} />
            )}
          </section>
        </main>
      </div>
      <CreateBoardModal open={create} onClose={() => setCreate(false)} onCreated={() => projects.refetch(true)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SideItem({ icon, label, count, active, onClick }: { icon: React.ReactNode; label: string; count?: number; active: boolean; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2.5 rounded px-3 py-1.5 text-left text-sm font-medium transition",
          active ? "bg-brand-soft text-brand-dark" : "text-ink-soft hover:bg-[#091e420f] hover:text-ink"
        )}
      >
        {icon}
        <span className="flex-1">{label}</span>
        {count ? <span className="rounded-full bg-[#091e420f] px-1.5 text-[11px] font-semibold text-ink-soft">{count}</span> : null}
      </button>
    </li>
  );
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
      {icon} {title}
      {typeof count === "number" ? <span className="text-sm font-normal text-ink-muted">({count})</span> : null}
    </h2>
  );
}

function ToolbarSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="w-full sm:w-52">
      <label className="t-label">{label}</label>
      <div className="relative">
        <Select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 py-0">
          {children}
        </Select>
      </div>
    </div>
  );
}

function WelcomeCard({ onCreate }: { onCreate: () => void }) {
  const modules = [
    { icon: <CheckSquare size={15} />, m: MODULES[1], text: "Kanban tasks with drag & drop" },
    { icon: <Braces size={15} />, m: MODULES[2], text: ".env variables, encrypted" },
    { icon: <KeyRound size={15} />, m: MODULES[3], text: "Server & API passwords" },
    { icon: <Files size={15} />, m: MODULES[4], text: "Files on S3" },
    { icon: <StickyNote size={15} />, m: MODULES[5], text: "Markdown notes" },
    { icon: <Wallet size={15} />, m: MODULES[6], text: "Spending per project" },
    { icon: <GitBranch size={15} />, m: MODULES[7], text: "GitHub commits, issues, PRs" },
  ];
  return (
    <section className="overflow-hidden rounded-xl border border-line">
      <div className="grid md:grid-cols-5">
        <div className="p-6 md:col-span-3">
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-brand">Welcome</div>
          <h2 className="text-xl font-bold text-ink">Start with your first board</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Think of a board as <strong>one project</strong> — for example “Portfolio site”, “Client API” or “Side project”. Inside the board you get a kanban for
            tasks, plus a place for that project’s env variables, passwords, files, notes, spending and git repo.
          </p>
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {modules.map(({ icon, m, text }) => (
              <li key={m.id} className="flex items-center gap-2 text-[13px] text-ink-soft">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white" style={{ background: m.color }}>
                  {icon}
                </span>
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button icon={<Plus size={16} />} onClick={onCreate}>
              Create your first board
            </Button>
            <span className="text-[12px] text-ink-muted">Takes 10 seconds — pick a color, type a title, done.</span>
          </div>
        </div>
        <div className="flex items-center justify-center bg-gradient-to-br from-[#0747a6] to-[#5067c5] p-6 md:col-span-2">
          <div className="w-full max-w-[220px] rounded-lg bg-white/20 p-2.5 shadow-lg backdrop-blur-[2px]">
            <div className="mb-2 h-2.5 w-20 rounded bg-white/90" />
            <div className="flex gap-1.5">
              {[3, 2, 1].map((n, i) => (
                <div key={i} className="flex-1 rounded bg-white/40 p-1">
                  <div className="mb-1 h-1.5 w-2/3 rounded bg-white/90" />
                  {Array.from({ length: n }).map((_, j) => (
                    <div key={j} className="mb-1 h-3.5 rounded-sm bg-white/95" />
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-white/90">
              <ArrowRight size={10} /> Tasks · Env · Passwords · Files · Notes · Spending · Git
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TaskList({ title, icon, color, tasks, projectName }: { title: string; icon: React.ReactNode; color: string; tasks: DashboardData["dueSoon"]; projectName: (id: string) => string }) {
  return (
    <div className="rounded-lg border border-line p-3">
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((p) => (
        <BoardTile key={p._id} project={p} onStar={() => onStar(p)} />
      ))}
      {onCreate ? (
        <button
          onClick={onCreate}
          className="flex h-[104px] flex-col items-center justify-center gap-1 rounded-lg bg-[#091e420f] text-sm font-medium text-ink-soft transition hover:bg-[#091e4224] hover:text-ink"
        >
          <Plus size={18} />
          Create new board
        </button>
      ) : null}
    </div>
  );
}

/** Trello-style board tile: background, bold title, star on hover. */
function BoardTile({ project: p, onStar }: { project: Project; onStar: () => void }) {
  const pct = p.stats && p.stats.tasks > 0 ? Math.round((p.stats.done / p.stats.tasks) * 100) : 0;
  return (
    <div className="group relative h-[104px] overflow-hidden rounded-lg text-white shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-raised)]" style={{ background: boardBackground(p.color) }}>
      <Link href={`/boards/${p._id}`} className="absolute inset-0 flex flex-col p-3 transition hover:bg-black/15" title={p.description || p.name}>
        <h3 className="truncate pr-6 text-[15px] font-bold leading-5 drop-shadow-sm">{p.name}</h3>
        {p.description ? <p className="mt-0.5 line-clamp-1 text-[12px] text-white/85">{p.description}</p> : null}
        <div className="mt-auto flex items-center gap-2 text-[11px] text-white/90">
          <span className="flex items-center gap-1 capitalize">
            <span className="h-2 w-2 rounded-full ring-1 ring-white/60" style={{ background: STATUS_DOT[p.status] }} /> {p.status}
          </span>
          {p.stats?.tasks ? (
            <span className="flex items-center gap-1">
              <CheckSquare size={11} /> {p.stats.done}/{p.stats.tasks}
            </span>
          ) : null}
          <span className="ml-auto flex items-center gap-1 whitespace-nowrap opacity-80">
            <Clock size={11} /> {relativeTime(p.updatedAt)}
          </span>
        </div>
        {p.stats?.tasks ? (
          <div className="mt-1.5 h-1 overflow-hidden rounded bg-white/30">
            <div className="h-full rounded bg-white" style={{ width: `${pct}%` }} />
          </div>
        ) : null}
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onStar();
        }}
        title={p.starred ? "Unstar board" : "Star board"}
        aria-label={p.starred ? "Unstar board" : "Star board"}
        className={cn(
          "absolute right-2 top-2 rounded p-1 transition",
          p.starred ? "text-[#f5cd47] hover:scale-110" : "translate-x-2 text-white opacity-0 group-hover:translate-x-0 group-hover:opacity-100 hover:scale-110"
        )}
      >
        <Star size={16} fill={p.starred ? "#f5cd47" : "none"} />
      </button>
    </div>
  );
}
