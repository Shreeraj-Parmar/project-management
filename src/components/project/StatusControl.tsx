"use client";

import { Check, ChevronDown } from "lucide-react";
import { Lozenge, Menu, MenuItem } from "@/components/ui";
import { useProject } from "./ProjectContext";
import { STATUSES, statusMeta } from "./status";
import { useBoardActions } from "./useBoardActions";

/** Board status as a Lozenge that opens a small picker (board header, over the glass bar). */
export function StatusControl() {
  const { project } = useProject();
  const { setStatus } = useBoardActions();
  const meta = statusMeta(project.status);

  return (
    <Menu
      align="left"
      width="w-72"
      title="Board status"
      trigger={
        <button
          type="button"
          aria-label={`Board status: ${meta.label}. Change status`}
          className="flex h-8 items-center gap-1 rounded-control pl-1.5 pr-1 text-white transition-colors hover:bg-on-board-ghost-hover active:bg-on-board-ghost-pressed"
        >
          <Lozenge appearance={meta.appearance}>{meta.label}</Lozenge>
          <ChevronDown size={14} aria-hidden />
        </button>
      }
    >
      {STATUSES.map((s) => (
        <MenuItem
          key={s.id}
          selected={project.status === s.id}
          description={s.description}
          trailing={project.status === s.id ? <Check size={16} className="shrink-0 text-brand" aria-hidden /> : null}
          onClick={() => void setStatus(s.id)}
        >
          <Lozenge appearance={s.appearance}>{s.label}</Lozenge>
        </MenuItem>
      ))}
    </Menu>
  );
}
