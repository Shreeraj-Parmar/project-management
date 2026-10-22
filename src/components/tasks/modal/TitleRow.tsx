"use client";

import { ChevronDown } from "lucide-react";
import type { Column, Task } from "@/lib/types";
import { Button, InlineEdit } from "@/components/ui";
import { CompleteCircle } from "./CompleteCircle";
import { SaveStatus } from "./SaveStatus";
import type { SaveStatus as Status } from "./useTaskPatch";
import { triggerProps, type PopApi } from "./types";

/**
 * Top of the card back: round complete circle, click-to-edit h2 title (Enter / blur saves, Esc reverts),
 * then "in list [To Do v]" (opens the Move popover) and the Saving / Saved indicator.
 */
export function TitleRow({
  task,
  column,
  status,
  pop,
  onTitle,
  onComplete,
}: {
  task: Task;
  column: Column | undefined;
  status: Status;
  pop: PopApi;
  onTitle: (t: string) => void;
  onComplete: (done: boolean) => void;
}) {
  return (
    <header className="px-4 pb-1 pt-4 pr-14">
      <div className="relative pl-8 md:pl-10">
        <CompleteCircle checked={Boolean(task.completedAt)} onChange={onComplete} className="absolute left-0 top-1.5 md:left-2" />
        <InlineEdit as="h2" value={task.title} label="Card title" placeholder="Card title" onSave={onTitle} maxLength={512} textClassName="text-h-m font-semibold" />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 pl-8 text-body md:pl-10 text-ink-soft">
        <span>in list</span>
        <Button
          variant="secondary"
          size="sm"
          iconRight={<ChevronDown size={14} aria-hidden />}
          className="max-w-[min(240px,60vw)]"
          aria-label={`Move card. Current list: ${column?.title ?? "unknown"}`}
          title="Move card"
          {...triggerProps(pop, "move", "title", true)}
        >
          {column?.title ?? "Unknown list"}
        </Button>
        <span className="ml-auto flex h-5 items-center">
          <SaveStatus status={status} />
        </span>
      </div>
    </header>
  );
}
