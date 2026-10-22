"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { Field, TagInput } from "@/components/ui";
import { useBoards } from "@/components/nav/store";
import { useProject } from "../ProjectContext";
import { useBoardActions } from "../useBoardActions";

/** Board tags with the shared TagInput. Every change is saved immediately. Tags used on other boards are one click away. */
export function TagsPanel() {
  const { project } = useProject();
  const { setTags } = useBoardActions();
  const { data: boards } = useBoards({ enabled: false });

  const suggestions = useMemo(() => {
    const have = new Set(project.tags.map((t) => t.toLowerCase()));
    const counts = new Map<string, number>();
    for (const b of boards ?? []) {
      if (b._id === project._id) continue;
      for (const t of b.tags ?? []) if (!have.has(t.toLowerCase())) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 10)
      .map(([t]) => t);
  }, [boards, project._id, project.tags]);

  return (
    <div className="space-y-4">
      <Field label="Board tags" helper="Press Enter or comma to add a tag. Tags show next to the board name and help you search.">
        <TagInput value={project.tags} onChange={(tags) => void setTags(tags)} placeholder="Add a tag…" />
      </Field>
      {suggestions.length > 0 ? (
        <section>
          <h3 className="mb-1.5 text-h-xxs font-semibold text-ink-soft">Used on other boards</h3>
          <ul className="flex flex-wrap gap-1.5">
            {suggestions.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => void setTags([...project.tags, t])}
                  className="inline-flex h-6 items-center gap-1 rounded-control bg-fill pl-1.5 pr-2 text-body-sm font-semibold text-ink-soft transition-colors hover:bg-fill-hover hover:text-ink"
                  aria-label={`Add tag ${t}`}
                >
                  <Plus size={12} aria-hidden />
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
