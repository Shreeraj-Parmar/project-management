"use client";

import { Check, CheckSquare, Clock, Flag, MoveRight, Tag, Trash2 } from "lucide-react";
import { cn } from "@/lib/client";
import { Button } from "@/components/ui";
import { triggerProps, type PopApi } from "./types";

function SideButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button variant="secondary" fullWidth alignStart className={cn("font-normal", className)} {...props} />;
}

function Caption({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-4 text-h-xxs font-semibold text-ink-soft first:mt-0">{children}</h3>;
}

/**
 * 168px button sidebar. "Add to card" only shows on desktop (phones have the quick row under the title),
 * "Actions" and "Mark complete" always show; on phones they stack at the bottom of the sheet.
 */
export function Sidebar({
  pop,
  completed,
  onComplete,
  onDelete,
}: {
  pop: PopApi;
  completed: boolean;
  onComplete: (done: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <aside aria-label="Card actions" className="shrink-0 px-4 pb-6 md:w-[168px] md:box-content md:pb-4 md:pl-2 md:pt-1">
      <div className="hidden md:block">
        <Caption>Add to card</Caption>
        <div className="space-y-2">
          <SideButton icon={<Tag size={16} aria-hidden />} {...triggerProps(pop, "labels", "side")}>
            Labels
          </SideButton>
          <SideButton icon={<Clock size={16} aria-hidden />} {...triggerProps(pop, "dates", "side")}>
            Dates
          </SideButton>
          <SideButton icon={<CheckSquare size={16} aria-hidden />} {...triggerProps(pop, "checklist", "side")}>
            Checklist
          </SideButton>
          <SideButton icon={<Flag size={16} aria-hidden />} {...triggerProps(pop, "priority", "side", true)}>
            Priority
          </SideButton>
        </div>
      </div>

      <Caption>Actions</Caption>
      <div className="space-y-2">
        <SideButton icon={<MoveRight size={16} aria-hidden />} {...triggerProps(pop, "move", "side", true)}>
          Move
        </SideButton>
        <SideButton
          icon={<Trash2 size={16} aria-hidden />}
          className="hover:bg-danger-soft hover:text-danger-text"
          onClick={onDelete}
        >
          Delete
        </SideButton>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <SideButton
          aria-pressed={completed}
          icon={<Check size={16} aria-hidden />}
          className={cn(completed && "bg-success text-white hover:bg-success-dark hover:text-white active:bg-success-dark")}
          onClick={() => onComplete(!completed)}
        >
          {completed ? "Completed" : "Mark complete"}
        </SideButton>
      </div>
    </aside>
  );
}
