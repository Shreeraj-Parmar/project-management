import Link from "next/link";
import { CheckSquare, Braces, KeyRound, Files, StickyNote, Wallet } from "lucide-react";
import { formatMoney } from "@/lib/client";
import { MODULES } from "@/lib/constants";
import type { ProjectDetail } from "@/lib/types";

const mod = (id: string) => MODULES.find((m) => m.id === id)!;

export function ModuleTiles({ base, stats: s }: { base: string; stats: ProjectDetail["stats"] }) {
  const tiles = [
    { m: mod("tasks"), icon: <CheckSquare size={18} />, value: `${s.doneTasks}/${s.tasks}`, sub: "tasks done" },
    { m: mod("env"), icon: <Braces size={18} />, value: s.env, sub: "env variables" },
    { m: mod("passwords"), icon: <KeyRound size={18} />, value: s.passwords, sub: "credentials" },
    { m: mod("files"), icon: <Files size={18} />, value: s.files, sub: "files" },
    { m: mod("notes"), icon: <StickyNote size={18} />, value: s.notes, sub: "notes" },
    { m: mod("spending"), icon: <Wallet size={18} />, value: formatMoney(s.spent), sub: `${s.expenses} expense${s.expenses === 1 ? "" : "s"}` },
  ];
  return (
    <section aria-label="Modules" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {tiles.map(({ m, icon, value, sub }) => (
        <Link
          key={m.id}
          href={base + m.path}
          className="t-card flex min-w-0 flex-col gap-3 p-4 transition-shadow hover:shadow-overlay"
          aria-label={`${m.label}: ${value} ${sub}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-card text-white" style={{ background: m.color }} aria-hidden>
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-h-l font-semibold text-ink">{value}</span>
            <span className="block truncate text-body-sm text-ink-muted">{sub}</span>
          </span>
        </Link>
      ))}
    </section>
  );
}
