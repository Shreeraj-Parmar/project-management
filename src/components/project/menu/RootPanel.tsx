"use client";

import { Archive, ArchiveRestore, ChevronRight, CircleDot, Info, Link2, Palette, Tag, Trash2 } from "lucide-react";
import { boardBackground } from "@/lib/constants";
import { Lozenge, PopoverDivider, PopoverItem } from "@/components/ui";
import { useProject } from "../ProjectContext";
import { statusMeta } from "../status";
import { useBoardActions } from "../useBoardActions";
import type { PanelId } from "./panels";

const ROW = "min-h-10 rounded-control px-3";
const chevron = <ChevronRight size={16} className="shrink-0 text-ink-muted" aria-hidden />;

/** Drawer root (Trello "Menu"): one row per sub-panel, then the quick actions. */
export function RootPanel({ onNavigate, onDelete }: { onNavigate: (panel: PanelId) => void; onDelete: () => void }) {
  const { project } = useProject();
  const actions = useBoardActions();
  const meta = statusMeta(project.status);
  const archived = project.status === "archived";

  return (
    <div className="flex flex-col gap-0.5">
      <PopoverItem className={ROW} icon={<Info size={16} aria-hidden />} trailing={chevron} onClick={() => onNavigate("about")}>
        About this board
      </PopoverItem>
      <PopoverItem
        className={ROW}
        icon={<Palette size={16} aria-hidden />}
        trailing={
          <>
            <span aria-hidden className="h-5 w-8 shrink-0 rounded-control shadow-[inset_0_0_0_1px_rgba(9,30,66,0.2)]" style={{ background: boardBackground(project.color) }} />
            {chevron}
          </>
        }
        onClick={() => onNavigate("background")}
      >
        Change background
      </PopoverItem>
      <PopoverItem
        className={ROW}
        icon={<Tag size={16} aria-hidden />}
        trailing={
          <>
            {project.tags.length > 0 ? <span className="text-body-sm text-ink-muted">{project.tags.length}</span> : null}
            {chevron}
          </>
        }
        onClick={() => onNavigate("tags")}
      >
        Tags
      </PopoverItem>
      <PopoverItem
        className={ROW}
        icon={<CircleDot size={16} aria-hidden />}
        trailing={
          <>
            <Lozenge appearance={meta.appearance}>{meta.label}</Lozenge>
            {chevron}
          </>
        }
        onClick={() => onNavigate("status")}
      >
        Status
      </PopoverItem>

      <PopoverDivider className="my-2" />

      <PopoverItem className={ROW} icon={<Link2 size={16} aria-hidden />} onClick={() => void actions.copyLink()}>
        Copy board link
      </PopoverItem>
      <PopoverItem
        className={ROW}
        icon={archived ? <ArchiveRestore size={16} aria-hidden /> : <Archive size={16} aria-hidden />}
        onClick={() => void (archived ? actions.unarchive() : actions.archive())}
      >
        {archived ? "Unarchive board" : "Archive board"}
      </PopoverItem>
      <PopoverItem className={ROW} danger icon={<Trash2 size={16} aria-hidden />} onClick={onDelete}>
        Delete board…
      </PopoverItem>
    </div>
  );
}
