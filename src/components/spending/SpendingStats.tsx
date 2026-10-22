"use client";

import { Lozenge } from "@/components/ui";
import { formatMoney } from "@/lib/client";
import type { computeStats } from "./utils";

type Stats = ReturnType<typeof computeStats>;

function Card({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="t-card t-card--static min-w-0 p-4">
      <div className="text-body-sm font-semibold text-ink-soft">{label}</div>
      <div className="mt-1 truncate text-h-l font-semibold tabular-nums text-ink">{value}</div>
      <div className="mt-1 flex min-h-4 items-center gap-1.5 text-body-sm text-ink-muted">{children}</div>
    </div>
  );
}

export function SpendingStats({ stats, currency }: { stats: Stats; currency: string }) {
  const { delta } = stats;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card label="Total spent" value={formatMoney(stats.total, currency)}>
        All time
      </Card>
      <Card label="This month" value={formatMoney(stats.thisMonth, currency)}>
        {delta === null ? (
          <span>No spend last month</span>
        ) : (
          <>
            <Lozenge appearance={delta > 0.5 ? "removed" : delta < -0.5 ? "success" : "default"}>
              {delta > 0.5 ? "↑" : delta < -0.5 ? "↓" : "–"} {Math.abs(Math.round(delta))}%
            </Lozenge>
            <span className="hidden sm:inline">vs last month</span>
          </>
        )}
      </Card>
      <Card label="Monthly average" value={formatMoney(stats.average, currency)}>
        Across months with spend
      </Card>
      <Card label="Recurring per month" value={formatMoney(stats.recurring, currency)}>
        Monthly plus yearly / 12
      </Card>
    </div>
  );
}
