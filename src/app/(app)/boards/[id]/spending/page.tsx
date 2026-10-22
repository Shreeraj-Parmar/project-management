"use client";

import { useMemo, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { api, useFetch } from "@/lib/client";
import { MODULES } from "@/lib/constants";
import type { Expense } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { Button, ConfirmDialog, EmptyState, ErrorBox, PageHeader, useToast } from "@/components/ui";
import { ExpenseLedger } from "@/components/spending/ExpenseLedger";
import { ExpenseModal } from "@/components/spending/ExpenseModal";
import { SpendingCharts } from "@/components/spending/SpendingCharts";
import { SpendingSkeleton } from "@/components/spending/SpendingSkeleton";
import { SpendingStats } from "@/components/spending/SpendingStats";
import { computeStats } from "@/components/spending/utils";

const MOD = MODULES.find((m) => m.id === "spending")!;

export default function SpendingPage() {
  const { project, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/spending`;
  const { data, loading, error, refetch, setData } = useFetch<Expense[]>(base);
  const [editing, setEditing] = useState<Expense | "new" | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const expenses = useMemo(() => data ?? [], [data]);
  const currency = expenses[0]?.currency ?? "USD";
  const stats = useMemo(() => computeStats(expenses), [expenses]);

  async function remove(e: Expense) {
    try {
      await api.del(`${base}/${e._id}`);
      setData((prev) => (prev ? prev.filter((x) => x._id !== e._id) : prev));
      refetchProject(true);
      toast(`Deleted "${e.title}"`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't delete the expense", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Spending"
        description="Track hosting, domains, SaaS subscriptions and one-off costs for this project."
        color={MOD.color}
        icon={<Wallet size={20} />}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setEditing("new")}>
            Add expense
          </Button>
        }
      />

      {loading && !data ? (
        <SpendingSkeleton />
      ) : error && !data ? (
        <ErrorBox title="Couldn't load expenses" message={error} onRetry={() => refetch()} />
      ) : expenses.length === 0 ? (
        <div className="rounded-card border border-dashed border-border-bold/50 bg-surface/60">
          <EmptyState
            icon={<Wallet size={28} />}
            color={MOD.color}
            title="No expenses yet"
            description="Log your domain, hosting bills, API credits and tools to see what this project really costs."
            action={<Button icon={<Plus size={16} />} onClick={() => setEditing("new")}>Add expense</Button>}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <SpendingStats stats={stats} currency={currency} />
          <SpendingCharts stats={stats} currency={currency} />
          <ExpenseLedger expenses={expenses} onEdit={setEditing} onDelete={setDeleting} />
        </div>
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
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
        title={`Delete "${deleting?.title ?? ""}"?`}
        message="This expense will be removed from your totals. This can't be undone."
        confirmLabel="Delete expense"
      />
    </div>
  );
}
