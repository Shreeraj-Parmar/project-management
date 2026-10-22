"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/client";
import { catColor, type computeStats } from "./utils";

type Stats = ReturnType<typeof computeStats>;
const tip = { borderRadius: 8, border: "1px solid #DCDFE4", fontSize: 12, color: "#172B4D", boxShadow: "0 8px 12px #091E4226" };

export function SpendingCharts({ stats, currency }: { stats: Stats; currency: string }) {
  const fmt = (v: unknown) => formatMoney(Number(v), currency);
  const compact = (v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v));
  return (
    <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
      <section className="t-card t-card--static p-4" aria-label="Spending by month">
        <h2 className="text-h-xs font-semibold text-ink">Last 6 months</h2>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.months} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#626F86" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#626F86" }} axisLine={false} tickLine={false} tickFormatter={compact} width={44} />
              <Tooltip cursor={{ fill: "#091E420F" }} formatter={(v) => [fmt(v), "Spent"]} contentStyle={tip} />
              <Bar dataKey="total" fill="#0C66E4" radius={[4, 4, 0, 0]} maxBarSize={44} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="t-card t-card--static p-4" aria-label="Spending by category">
        <h2 className="text-h-xs font-semibold text-ink">By category</h2>
        <div className="mt-3 flex items-center gap-4">
          <div className="h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.pie} dataKey="value" innerRadius={40} outerRadius={66} paddingAngle={2} stroke="none" isAnimationActive={false}>
                  {stats.pie.map((p) => (
                    <Cell key={p.name} fill={catColor(p.name)} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={tip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="min-w-0 flex-1 space-y-1.5 text-body-sm">
            {stats.pie.slice(0, 6).map((p) => (
              <li key={p.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: catColor(p.name) }} />
                <span className="truncate text-ink-soft">{p.name}</span>
                <span className="ml-auto font-semibold tabular-nums text-ink">{stats.total > 0 ? Math.round((p.value / stats.total) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
