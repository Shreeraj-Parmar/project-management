"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { IconButton, ProgressBar } from "@/components/ui";
import { cn } from "@/lib/client";

export type ChecklistStep = { id: string; label: string; hint: string; done: boolean; href: string };

export function GettingStarted({ projectId, steps }: { projectId: string; steps: ChecklistStep[] }) {
  const key = `devboard:getting-started-dismissed:${projectId}`;
  const [dismissed, setDismissed] = useState(true); // hidden until localStorage is read (SSR-safe)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(key) === "1");
    } catch {
      setDismissed(false);
    }
  }, [key]);

  const doneCount = steps.filter((s) => s.done).length;
  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(key, "1");
    } catch {}
  }

  return (
    <section aria-labelledby="gs-title" className="t-card t-card--static p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="gs-title" className="text-h-s font-semibold text-ink">
            Getting started
          </h2>
          <p className="mt-0.5 text-body-sm text-ink-muted">
            {doneCount} of {steps.length} steps done
          </p>
        </div>
        <IconButton title="Dismiss getting started" size="sm" onClick={dismiss}>
          <X size={16} />
        </IconButton>
      </div>
      <ProgressBar className="mt-3" value={doneCount} max={steps.length} showValue label="Getting started progress" />
      <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.id}>
            <Link href={s.href} className="flex items-start gap-3 rounded-control px-1 py-2 hover:bg-fill-subtle">
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  s.done ? "border-success bg-success text-white" : "border-border-input bg-canvas",
                )}
              >
                {s.done ? <Check size={11} strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-body font-medium", s.done ? "text-ink-muted line-through" : "text-ink")}>{s.label}</span>
                <span className="block text-body-sm text-ink-muted">{s.hint}</span>
              </span>
              <span className="sr-only">{s.done ? "Done" : "Not done"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
