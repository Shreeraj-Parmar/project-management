"use client";

import { CheckSquare, Clock, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui";
import { triggerProps, type PopApi } from "./types";

/** Row under the title: "+ Add" menu plus the three most used shortcuts, each opening a popover. */
export function QuickActions({ pop }: { pop: PopApi }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Add to card">
      <Button variant="secondary" icon={<Plus size={16} aria-hidden />} {...triggerProps(pop, "add", "quick", true)}>
        Add
      </Button>
      <Button variant="secondary" icon={<Tag size={16} aria-hidden />} {...triggerProps(pop, "labels", "quick")}>
        Labels
      </Button>
      <Button variant="secondary" icon={<Clock size={16} aria-hidden />} {...triggerProps(pop, "dates", "quick")}>
        Dates
      </Button>
      <Button variant="secondary" icon={<CheckSquare size={16} aria-hidden />} {...triggerProps(pop, "checklist", "quick")}>
        Checklist
      </Button>
    </div>
  );
}
