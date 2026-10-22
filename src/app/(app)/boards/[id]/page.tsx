"use client";

import Link from "next/link";
import {
  Braces,
  CheckSquare,
  Clock,
  ExternalLink,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  Plus,
  StickyNote,
  Upload,
  Wallet,
} from "lucide-react";
import { relativeTime, formatDate } from "@/lib/client";
import { MODULES } from "@/lib/constants";
import { useProject } from "@/components/project/ProjectContext";
import { buttonClass, EmptyState, Lozenge, PageHeader } from "@/components/ui";
import type { LozengeAppearance } from "@/components/ui";
import { GettingStarted } from "@/components/overview/GettingStarted";
import { ModuleTiles } from "@/components/overview/ModuleTiles";
import { RecentNotes, RecentTasks } from "@/components/overview/RecentPanels";

const STATUS: Record<string, { label: string; appearance: LozengeAppearance }> =
  {
    active: { label: "Active", appearance: "success" },
    paused: { label: "Paused", appearance: "warning" },
    completed: { label: "Completed", appearance: "inprogress" },
    archived: { label: "Archived", appearance: "default" },
  };

export default function OverviewPage() {
  const { project } = useProject();
  const s = project.stats;
  const base = `/boards/${project._id}`;
  const st = STATUS[project.status] ?? STATUS.active;
  const empty =
    s.tasks + s.env + s.passwords + s.files + s.notes + s.expenses === 0;

  const steps = [
    {
      id: "tasks",
      label: "Add your first task",
      hint: "Plan work as cards on the board",
      done: s.tasks > 0,
      href: `${base}/tasks`,
    },
    {
      id: "env",
      label: "Store environment variables",
      hint: "Keep .env values in one place",
      done: s.env > 0,
      href: `${base}/env`,
    },
    {
      id: "passwords",
      label: "Save a credential",
      hint: "Logins, API keys and tokens",
      done: s.passwords > 0,
      href: `${base}/passwords`,
    },
    {
      id: "notes",
      label: "Write a note",
      hint: "Decisions, snippets, links",
      done: s.notes > 0,
      href: `${base}/notes`,
    },
    {
      id: "files",
      label: "Upload a file",
      hint: "Attach assets and documents",
      done: s.files > 0,
      href: `${base}/files`,
    },
    {
      id: "git",
      label: "Connect a Git repository",
      hint: "See commits and pull requests",
      done: !!project.git?.repo,
      href: `${base}/git`,
    },
  ];

  const actions = [
    { label: "New task", icon: <Plus size={16} />, href: `${base}/tasks` },
    { label: "Add variable", icon: <Braces size={16} />, href: `${base}/env` },
    {
      label: "Add credential",
      icon: <KeyRound size={16} />,
      href: `${base}/passwords`,
    },
    {
      label: "New note",
      icon: <StickyNote size={16} />,
      href: `${base}/notes`,
    },
    { label: "Upload file", icon: <Upload size={16} />, href: `${base}/files` },
    {
      label: "Log expense",
      icon: <Wallet size={16} />,
      href: `${base}/spending`,
    },
  ];

  return (
    <div>
      <PageHeader
        title={project.name}
        description={
          project.description ||
          "No description yet. Use the board menu to edit."
        }
        icon={<LayoutDashboard size={20} />}
        color={MODULES[0].color}
        meta={
          <>
            <Lozenge appearance={st.appearance}>{st.label}</Lozenge>
            <span className="flex items-center gap-1 text-body-sm text-ink-muted">
              <Clock size={12} aria-hidden /> Created{" "}
              {formatDate(project.createdAt)}
            </span>
            <span className="text-body-sm text-ink-muted">
              Updated {relativeTime(project.updatedAt)}
            </span>
            {project.git?.repo ? (
              <Link
                href={`${base}/git`}
                className="link flex items-center gap-1 text-body-sm font-medium"
              >
                <GitBranch size={12} aria-hidden /> {project.git.repo}
              </Link>
            ) : null}
            {project.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-6 max-w-[220px] items-center gap-1 rounded-label bg-brand-soft px-2 text-body-sm font-medium text-brand-dark hover:bg-brand-soft-hover"
              >
                <ExternalLink size={12} aria-hidden className="shrink-0" />
                <span className="truncate">{l.label || l.url}</span>
              </a>
            ))}
          </>
        }
      />

      <div className="space-y-6">
        {empty ? (
          <section className="t-card t-card--static">
            <EmptyState
              compact
              icon={<CheckSquare size={22} />}
              title="This board is empty"
              description="Start by adding a task, then store variables, credentials and notes alongside it."
              action={
                <Link
                  href={`${base}/tasks`}
                  className={buttonClass({ variant: "primary" })}
                >
                  <Plus size={16} aria-hidden /> Add your first task
                </Link>
              }
            />
          </section>
        ) : null}

        <GettingStarted projectId={project._id} steps={steps} />

        <ModuleTiles base={base} stats={s} />

        <div className="grid gap-4 lg:grid-cols-2">
          <RecentTasks base={base} project={project} />
          <RecentNotes base={base} project={project} />
        </div>

        <section aria-label="Quick actions" className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={buttonClass({ variant: "secondary" })}
            >
              {a.icon}
              {a.label}
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
