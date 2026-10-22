import { Braces, CheckSquare, Files, GitBranch, KeyRound, LayoutDashboard, StickyNote, Wallet, type LucideIcon } from "lucide-react";
import { MODULES, type ModuleId } from "@/lib/constants";
import type { ProjectDetail } from "@/lib/types";

export type ModuleDef = (typeof MODULES)[number];

export const MODULE_ICONS: Record<ModuleId, LucideIcon> = {
  overview: LayoutDashboard,
  tasks: CheckSquare,
  env: Braces,
  passwords: KeyRound,
  files: Files,
  notes: StickyNote,
  spending: Wallet,
  git: GitBranch,
};

/** Sidebar grouping. The first group has no caption. */
export const NAV_GROUPS: { label?: string; ids: ModuleId[] }[] = [
  { ids: ["overview"] },
  { label: "Work", ids: ["tasks"] },
  { label: "Project vault", ids: ["env", "passwords", "files"] },
  { label: "Docs and money", ids: ["notes", "spending"] },
  { label: "Code", ids: ["git"] },
];

export function moduleById(id: ModuleId): ModuleDef {
  return MODULES.find((m) => m.id === id) ?? MODULES[0];
}

export function moduleHref(base: string, m: ModuleDef): string {
  return base + m.path;
}

/** Which module the current URL belongs to (overview when nothing else matches). */
export function activeModule(pathname: string, base: string): ModuleDef {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return MODULES.find((m) => m.path && (path === base + m.path || path.startsWith(base + m.path + "/"))) ?? MODULES[0];
}

/** Badge number and an accessible phrase for a module, or null when there is nothing to count. */
export function moduleCount(id: ModuleId, project: ProjectDetail): { n: number; phrase: string } | null {
  const s = project.stats;
  const map: Partial<Record<ModuleId, { n: number; phrase: string }>> = {
    tasks: { n: Math.max(0, s.tasks - s.doneTasks), phrase: "open tasks" },
    env: { n: s.env, phrase: "variables" },
    passwords: { n: s.passwords, phrase: "credentials" },
    files: { n: s.files, phrase: "files" },
    notes: { n: s.notes, phrase: "notes" },
    spending: { n: s.expenses, phrase: "expenses" },
  };
  const c = map[id];
  return c && c.n > 0 ? c : null;
}
