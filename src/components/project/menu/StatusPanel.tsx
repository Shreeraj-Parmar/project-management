"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/client";
import { Lozenge } from "@/components/ui";
import { useProject } from "../ProjectContext";
import { STATUSES } from "../status";
import { useBoardActions } from "../useBoardActions";

/** Pick the board status. Archiving shows an Undo toast; the others just change the lozenge. */
export function StatusPanel() {
  const { project } = useProject();
  const { setStatus } = useBoardActions();

  return (
    <div role="radiogroup" aria-label="Board status" className="flex flex-col gap-0.5">
      {STATUSES.map((s) => {
        const checked = project.status === s.id;
        return (
          <label
            key={s.id}
            className={cn(
              "flex min-h-12 cursor-pointer items-center gap-3 rounded-control px-3 py-2 transition-colors hover:bg-fill has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2 has-[:focus-visible]:outline-focus",
              checked && "bg-brand-soft shadow-[inset_2px_0_0_var(--color-brand)] hover:bg-brand-soft-hover"
            )}
          >
            <input type="radio" name="board-status" value={s.id} checked={checked} onChange={() => void setStatus(s.id)} className="sr-only" />
            <span className="min-w-0 flex-1">
              <Lozenge appearance={s.appearance}>{s.label}</Lozenge>
              <span className="mt-1 block text-body-sm text-ink-soft">{s.description}</span>
            </span>
            {checked ? <Check size={16} className="shrink-0 text-brand" aria-hidden /> : null}
          </label>
        );
      })}
    </div>
  );
}
