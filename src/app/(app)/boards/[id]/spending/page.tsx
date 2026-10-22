"use client";

import { useMemo, useState } from "react";
import { Wallet, Plus, Trash2, Pencil, Repeat, TrendingUp, CalendarDays, PieChart as PieIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { api, cn, formatMoney, formatDate, toDateInput, useFetch } from "@/lib/client";
import { MODULES, SPEND_CATEGORIES } from "@/lib/constants";
import type { Expense } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { ModuleHeader, Spinner, ErrorBox, EmptyState, Badge } from "@/components/ui/Misc";
import { Button, IconButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Confirm";
import { useToast } from "@/components/ui/Toast";

const MOD = MODULES.find((m) => m.id === "spending")!;
const CAT_COLORS = ["#ae4787", "#0c66e4", "#1f845a", "#c25100", "#5e4db2", "#946f00", "#c9372c", "#227d9b", "#5b7f24", "#626f86"];
const catColor = (c: string) => CAT_COLORS[Math.max(0, (SPEND_CATEGORIES as readonly string[]).indexOf(c)) % CAT_COLORS.length];
const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD"];

export default function SpendingPage() {
  const { project, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/spending`;
  const { data, loading, error, refetch, setData } = useFetch<Expense[]>(base);
  const [editing, setEditing] = useState<Expense | "new" | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const expenses = data ?? [];
  const currency = expenses[0]?.currency ?? "USD";

  const stats = useMemo(() => {
    const total = expenses.reduce((a, e) => a + e.amount, 0);
    const monthly = expenses.reduce((a, e) => a + (e.recurring === "monthly" ? e.amount : e.recurring === "yearly" ? e.amount / 12 : 0), 0);
    const now = new Date();
    const thisMonth = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).reduce((a, e) => a + e.amount, 0);

    const byCat = new Map<string, number>();
    expenses.forEach((e) => byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amount));
    const pie = [...byCat.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: "short" }), total: 0 });
    }
    expenses.forEach((e) => {
      const d = new Date(e.date);
      const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (m) m.total += e.amount;
    });
    return { total, monthly, thisMonth, pie, months };
  }, [expenses]);

  async function remove(e: Expense) {
    await api.del(`${base}/${e._id}`);
    setData((prev) => (prev ? prev.filter((x) => x._id !== e._id) : prev));
    refetchProject(true);
    toast("Expense deleted", "success");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ModuleHeader
        title="Spending"
        description="Track hosting, domains, SaaS subscriptions and one-off costs for this project."
        color={MOD.color}
        icon={<Wallet size={20} />}
        actions={
          <Button color={MOD.color} icon={<Plus size={15} />} onClick={() => setEditing("new")}>
            Add expense
          </Button>
        }
      />

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => refetch()} />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Total spent" value={formatMoney(stats.total, currency)} icon={<Wallet size={18} />} color={MOD.color} />
            <Stat label="Recurring / month" value={formatMoney(stats.monthly, currency)} icon={<Repeat size={18} />} color="#5e4db2" hint="monthly + yearly/12" />
            <Stat label="This month" value={formatMoney(stats.thisMonth, currency)} icon={<CalendarDays size={18} />} color="#0c66e4" />
          </div>

          {expenses.length > 0 ? (
            <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_280px]">
              <div className="t-card p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                  <TrendingUp size={15} style={{ color: MOD.color }} /> Last 6 months
                </h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.months} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#626f86" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#626f86" }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "#091e420f" }} formatter={(v: number) => formatMoney(v, currency)} contentStyle={{ borderRadius: 8, border: "1px solid #dcdfe4", fontSize: 12 }} />
                      <Bar dataKey="total" fill={MOD.color} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="t-card p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
                  <PieIcon size={15} style={{ color: MOD.color }} /> By category
                </h3>
                <div className="flex items-center gap-3">
                  <div className="h-28 w-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.pie} dataKey="value" innerRadius={30} outerRadius={52} paddingAngle={2} stroke="none">
                          {stats.pie.map((p) => (
                            <Cell key={p.name} fill={catColor(p.name)} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatMoney(v, currency)} contentStyle={{ borderRadius: 8, border: "1px solid #dcdfe4", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="min-w-0 flex-1 space-y-1 text-xs">
                    {stats.pie.slice(0, 5).map((p) => (
                      <li key={p.name} className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: catColor(p.name) }} />
                        <span className="truncate text-ink-soft">{p.name}</span>
                        <span className="ml-auto font-semibold text-ink">{Math.round((p.value / stats.total) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {expenses.length === 0 ? (
            <EmptyState icon={<Wallet size={22} />} color={MOD.color} title="No expenses yet" description="Log your domain, hosting bills, API credits and tools to see what this project really costs." action={<Button color={MOD.color} onClick={() => setEditing("new")}>Add expense</Button>} />
          ) : (
            <div className="t-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#f7f8f9] text-left text-xs font-bold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-2.5">Expense</th>
                    <th className="hidden px-4 py-2.5 sm:table-cell">Category</th>
                    <th className="hidden px-4 py-2.5 md:table-cell">Date</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {expenses.map((e) => (
                    <tr key={e._id} className="group hover:bg-[#f7f8f9]">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-ink">{e.title}</div>
                        {e.note ? <div className="truncate text-xs text-ink-muted">{e.note}</div> : null}
                      </td>
                      <td className="hidden px-4 py-2.5 sm:table-cell">
                        <Badge bg={catColor(e.category) + "22"} fg={catColor(e.category)}>
                          {e.category}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-2.5 text-ink-muted md:table-cell">
                        {formatDate(e.date)}
                        {e.recurring !== "none" ? <span className="ml-1.5 inline-flex items-center gap-0.5 text-[11px] text-[#5e4db2]"><Repeat size={10} /> {e.recurring}</span> : null}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-ink">{formatMoney(e.amount, e.currency)}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100">
                          <IconButton title="Edit" onClick={() => setEditing(e)}>
                            <Pencil size={15} />
                          </IconButton>
                          <IconButton title="Delete" onClick={() => setDeleting(e)} className="hover:!text-danger">
                            <Trash2 size={15} />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {editing ? (
        <ExpenseModal
          base={base}
          item={editing === "new" ? null : editing}
          defaultCurrency={currency}
          onClose={() => setEditing(null)}
          onSaved={() => {
            refetch(true);
            refetchProject(true);
            setEditing(null);
          }}
        />
      ) : null}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} title={`Delete "${deleting?.title}"?`} />
    </div>
  );
}

function Stat({ label, value, icon, color, hint }: { label: string; value: string; icon: React.ReactNode; color: string; hint?: string }) {
  return (
    <div className="t-card flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</div>
        <div className="truncate text-xl font-bold text-ink">{value}</div>
        {hint ? <div className="text-[11px] text-ink-muted">{hint}</div> : null}
      </div>
    </div>
  );
}

function ExpenseModal({ base, item, defaultCurrency, onClose, onSaved }: { base: string; item: Expense | null; defaultCurrency: string; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(item?.title ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [currency, setCurrency] = useState(item?.currency ?? defaultCurrency);
  const [category, setCategory] = useState(item?.category ?? "Hosting");
  const [date, setDate] = useState(toDateInput(item?.date ?? new Date()));
  const [recurring, setRecurring] = useState(item?.recurring ?? "none");
  const [note, setNote] = useState(item?.note ?? "");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { title, amount: Number(amount), currency, category, date, recurring, note };
      if (item) await api.patch(`${base}/${item._id}`, body);
      else await api.post(base, body);
      toast("Saved", "success");
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={item ? "Edit expense" : "Add expense"} accent={MOD.color} width="max-w-md">
      <form onSubmit={save} className="space-y-4">
        <Field label="What did you pay for?">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Vercel Pro, domain renewal, OpenAI credits…" />
        </Field>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Field label="Amount">
            <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Currency">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {SPEND_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Recurring">
          <div className="flex gap-1 rounded-md bg-[#091e420f] p-0.5">
            {(["none", "monthly", "yearly"] as const).map((r) => (
              <button type="button" key={r} onClick={() => setRecurring(r)} className={cn("flex-1 rounded px-2 py-1.5 text-sm capitalize", recurring === r ? "bg-white font-semibold shadow-sm" : "text-ink-soft")}>
                {r === "none" ? "One-off" : r}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Note" hint="optional">
          <Textarea className="min-h-[56px]" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" color={MOD.color} loading={busy} disabled={!title.trim() || amount === ""}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
