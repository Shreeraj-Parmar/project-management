"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { Task } from "@/lib/types";
import { useToast } from "@/components/ui";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Optimistic PATCH for one task.
 * - Applies the change to the parent immediately (`onChange`), then calls the API.
 * - On failure rolls back only the keys that were sent and offers Retry in the toast.
 * - On success merges the server value of the sent keys, so overlapping saves cannot overwrite each other.
 * - Exposes a debounced "Saving..." / "Saved" status for the header indicator.
 */
export function useTaskPatch({ task, projectId, onChange }: { task: Task; projectId: string; onChange: (t: Task) => void }) {
  const { toast } = useToast();
  const taskRef = useRef(task);
  taskRef.current = task;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const pending = useRef(0);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const [status, setStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const patch = useCallback(
    async (update: Partial<Task>): Promise<boolean> => {
      const before = taskRef.current;
      const keys = Object.keys(update) as (keyof Task)[];
      const previous: Partial<Record<keyof Task, unknown>> = {};
      for (const k of keys) previous[k] = before[k];

      const optimistic = { ...before, ...update } as Task;
      taskRef.current = optimistic;
      onChangeRef.current(optimistic);

      pending.current += 1;
      if (savedTimer.current) clearTimeout(savedTimer.current);
      if (alive.current) setStatus("saving");
      try {
        const saved = await api.patch<Task>(`/api/projects/${projectId}/tasks/${before._id}`, update);
        const merged = { ...taskRef.current, updatedAt: saved.updatedAt ?? taskRef.current.updatedAt } as Task;
        for (const k of keys) (merged as Record<string, unknown>)[k] = saved[k] ?? (update as Record<string, unknown>)[k];
        taskRef.current = merged;
        onChangeRef.current(merged);
        pending.current -= 1;
        if (alive.current && pending.current === 0) {
          setStatus("saved");
          savedTimer.current = setTimeout(() => alive.current && setStatus("idle"), 2200);
        }
        return true;
      } catch (err) {
        pending.current -= 1;
        const rolled = { ...taskRef.current, ...previous } as Task;
        taskRef.current = rolled;
        onChangeRef.current(rolled);
        if (alive.current) setStatus(pending.current === 0 ? "error" : "saving");
        toast(err instanceof Error && err.message ? `Couldn't save your changes. ${err.message}` : "Couldn't save your changes. Try again.", "error", {
          action: { label: "Retry", onClick: () => void patch(update) },
        });
        return false;
      }
    },
    [projectId, toast]
  );

  return { patch, status, taskRef };
}
