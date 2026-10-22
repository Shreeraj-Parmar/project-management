"use client";

import { Braces, CheckSquare, Files, GitBranch, KeyRound, Plus, StickyNote, Wallet } from "lucide-react";
import { BOARD_TEMPLATES, MODULES, boardBackground } from "@/lib/constants";
import { Button, Lozenge } from "@/components/ui";
import { templateSummary } from "./board-utils";

const FEATURES = [
  { id: "tasks", icon: CheckSquare, text: "Kanban with drag and drop" },
  { id: "env", icon: Braces, text: ".env variables, encrypted" },
  { id: "passwords", icon: KeyRound, text: "Logins and API keys" },
  { id: "files", icon: Files, text: "Uploads to your S3 bucket" },
  { id: "notes", icon: StickyNote, text: "Markdown notes, autosaved" },
  { id: "spending", icon: Wallet, text: "What the project costs" },
  { id: "git", icon: GitBranch, text: "Commits, issues and pull requests" },
] as const;

function MiniBoard() {
  return (
    <div className="w-full max-w-[300px] rounded-card bg-white/20 p-2.5 shadow-overlay backdrop-blur-[2px]" aria-hidden>
      <div className="mb-2 h-2.5 w-24 rounded-full bg-white/90" />
      <div className="flex items-start gap-2">
        {[3, 2, 1].map((n, i) => (
          <div key={i} className="min-w-0 flex-1 rounded-card bg-white/45 p-1.5">
            <div className="mb-1.5 h-2 w-2/3 rounded-full bg-white/95" />
            {Array.from({ length: n }).map((_, j) => (
              <div key={j} className="mb-1.5 h-5 rounded-control bg-white/95 last:mb-0" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Zero boards: explains what a board is, shows what it holds and offers one clear next step. */
export function FirstRun({ onCreate }: { onCreate: (el: HTMLElement, templateId?: string) => void }) {
  return (
    <section aria-labelledby="first-run-title" className="overflow-hidden rounded-list border border-line bg-canvas shadow-card">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="p-6 sm:p-8">
          <Lozenge appearance="new">Welcome</Lozenge>
          <h2 id="first-run-title" className="mt-3 text-h-l font-semibold text-ink">
            Create your first board
          </h2>
          <p className="mt-2 max-w-xl text-body-lg text-ink-soft">
            A board is <strong className="font-semibold text-ink">one project</strong>. Keep its tasks, environment variables, passwords, files, notes, spending and git together instead of scattered across tools.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button size="lg" icon={<Plus size={16} aria-hidden />} onClick={(e) => onCreate(e.currentTarget)}>
              Create board
            </Button>
            <span className="text-body-sm text-ink-muted">Takes ten seconds: pick a colour, name it, done.</span>
          </div>

          <h3 className="mt-8 text-h-xxs font-semibold text-ink-soft">Every board comes with</h3>
          <ul className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {FEATURES.map((f) => {
              const m = MODULES.find((x) => x.id === f.id)!;
              const Icon = f.icon;
              return (
                <li key={f.id} className="flex items-center gap-3">
                  <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card text-white" style={{ background: m.color }}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-body font-semibold text-ink">{m.label}</span>
                    <span className="block truncate text-body-sm text-ink-muted">{f.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <h3 className="mt-8 text-h-xxs font-semibold text-ink-soft">Or start from a template</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {BOARD_TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={(e) => onCreate(e.currentTarget, t.id)}
                  className="w-full rounded-card border border-border-input bg-canvas px-3 py-2 text-left transition-colors hover:bg-surface"
                >
                  <span className="block text-body font-semibold text-ink">{t.label}</span>
                  <span className="block truncate text-body-sm text-ink-muted">{templateSummary(t.columns)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="hidden items-center justify-center p-8 lg:flex" style={{ background: boardBackground("ocean") }} aria-hidden>
          <MiniBoard />
        </div>
      </div>
    </section>
  );
}
