"use client";

import { CheckSquare, FolderKanban, Lock, Wallet } from "lucide-react";
import { formatMoney } from "@/lib/client";
import { MODULES } from "@/lib/constants";
import type { DashboardData } from "@/lib/types";
import { Skeleton } from "@/components/ui";

function Card({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: React.ReactNode }) {
  return (
    <div className="t-card t-card--static flex items-center gap-3 px-3 py-2.5">
      <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card text-white" style={{ background: color }}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="truncate text-body-sm font-semibold text-ink-soft">{label}</div>
        <div className="truncate text-h-m font-semibold tabular-nums text-ink">{value}</div>
      </div>
    </div>
  );
}

/** Four compact numbers from /api/dashboard. */
export function SummaryCards({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="status" aria-label="Loading summary">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={56} width="100%" className="!rounded-card" />
        ))}
      </div>
    );
  }
  const c = data.counts;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card icon={<FolderKanban size={16} />} color={MODULES[0].color} label="Boards" value={c.projects} />
      <Card icon={<CheckSquare size={16} />} color={MODULES[1].color} label="Open tasks" value={c.openTasks} />
      <Card icon={<Wallet size={16} />} color={MODULES[6].color} label="Total spent" value={formatMoney(c.spent)} />
      <Card icon={<Lock size={16} />} color={MODULES[3].color} label="Secrets stored" value={c.env + c.passwords} />
    </div>
  );
}
