"use client";

import { Activity, Check, Pencil, Plus } from "lucide-react";
import type { Task } from "@/lib/types";
import { Section } from "./Section";
import { formatStamp } from "./meta";

type Entry = { key: string; at: string; icon: React.ReactNode; label: string };

/** Activity-lite: created / updated / completed timestamps as quiet rows, newest first. */
export function ActivitySection({ task }: { task: Task }) {
  const entries: Entry[] = [{ key: "created", at: task.createdAt, icon: <Plus size={12} />, label: "Card created" }];
  if (task.updatedAt && Math.abs(new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime()) > 1000) {
    entries.push({ key: "updated", at: task.updatedAt, icon: <Pencil size={12} />, label: "Last updated" });
  }
  if (task.completedAt) entries.push({ key: "completed", at: task.completedAt, icon: <Check size={12} />, label: "Marked complete" });
  entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <Section icon={<Activity size={20} />} title="Activity">
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.key} className="flex items-center gap-3 text-body text-ink-soft">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-fill text-ink-soft" aria-hidden>
              {e.icon}
            </span>
            <span className="min-w-0">
              <span className="font-medium text-ink">{e.label}</span>
              <time dateTime={e.at} className="ml-2 text-body-sm text-ink-soft">
                {formatStamp(e.at)}
              </time>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
