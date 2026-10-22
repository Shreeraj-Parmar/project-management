"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select, Tabs, Textarea, useToast } from "@/components/ui";
import { api, toDateInput } from "@/lib/client";
import { SPEND_CATEGORIES } from "@/lib/constants";
import type { Expense } from "@/lib/types";
import { CURRENCIES } from "./utils";

type Errors = { title?: string; amount?: string; date?: string };

export function ExpenseModal({ base, item, defaultCurrency, onClose, onSaved }: { base: string; item: Expense | null; defaultCurrency: string; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(item?.title ?? "");
  const [amount, setAmount] = useState(item ? String(item.amount) : "");
  const [currency, setCurrency] = useState(item?.currency ?? defaultCurrency);
  const [category, setCategory] = useState(item?.category ?? "Hosting");
  const [date, setDate] = useState(toDateInput(item?.date ?? new Date()));
  const [recurring, setRecurring] = useState<string>(item?.recurring ?? "none");
  const [note, setNote] = useState(item?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function validate(): Errors {
    const e: Errors = {};
    if (!title.trim()) e.title = "Enter what this expense is for.";
    const n = Number(amount);
    if (amount.trim() === "" || !Number.isFinite(n)) e.amount = "Enter an amount.";
    else if (n < 0) e.amount = "Amount can't be negative.";
    if (!date) e.date = "Pick a date.";
    return e;
  }

  async function save(ev: React.FormEvent) {
    ev.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const body = { title: title.trim(), amount: Number(amount), currency, category, date, recurring, note };
      if (item) await api.patch(`${base}/${item._id}`, body);
      else await api.post(base, body);
      toast(item ? "Expense updated" : "Expense added", "success");
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save the expense", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? "Edit expense" : "Add expense"}
      size="medium"
      footer={
        <>
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="expense-form" loading={busy}>
            {item ? "Save" : "Add expense"}
          </Button>
        </>
      }
    >
      <form id="expense-form" onSubmit={save} noValidate className="space-y-4">
        <Field label="What did you pay for?" required error={errors.title}>
          <Input data-autofocus value={title} invalid={Boolean(errors.title)} onChange={(e) => setTitle(e.target.value)} placeholder="Vercel Pro, domain renewal, OpenAI credits" />
        </Field>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <Field label="Amount" required error={errors.amount}>
            <Input type="number" inputMode="decimal" step="0.01" min="0" value={amount} invalid={Boolean(errors.amount)} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Currency">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {SPEND_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Date" required error={errors.date}>
            <Input type="date" value={date} invalid={Boolean(errors.date)} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Repeats">
          <Tabs
            variant="segmented"
            value={recurring}
            onChange={setRecurring}
            tabs={[
              { id: "none", label: "One-off" },
              { id: "monthly", label: "Monthly" },
              { id: "yearly", label: "Yearly" },
            ]}
          />
        </Field>
        <Field label="Note" hint="(optional)">
          <Textarea className="min-h-[64px]" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
