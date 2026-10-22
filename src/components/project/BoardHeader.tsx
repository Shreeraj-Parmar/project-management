"use client";

import Link from "next/link";
import { useState, type RefObject } from "react";
import { ChevronLeft, MoreHorizontal, Star } from "lucide-react";
import { cn } from "@/lib/client";
import { buttonClass, IconButton, InlineEdit, Tooltip } from "@/components/ui";
import { useProject } from "./ProjectContext";
import { TooltipHint } from "./TooltipHint";
import { StatusControl } from "./StatusControl";
import { useBoardActions } from "./useBoardActions";

const MAX_TAGS = 3;

/**
 * Board header (Trello): 56px translucent bar over the board background. Back to boards, click-to-edit board
 * title, star, status lozenge; tags and the "Show menu" button on the right. Phones: 48px, tags are in the menu.
 */
export function BoardHeader({
  menuOpen,
  menuId,
  onToggleMenu,
  onOpenTags,
  menuButtonRef,
}: {
  menuOpen: boolean;
  menuId: string;
  onToggleMenu: () => void;
  onOpenTags: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  const { project } = useProject();
  const { rename, toggleStar } = useBoardActions();
  const [editing, setEditing] = useState(false);
  const tags = project.tags;
  const chip = "rounded-control bg-black/25 px-2 py-0.5 text-body-sm font-semibold text-white";

  return (
    <div role="region" aria-label="Board header" className="glass-bar glass-bar--board flex h-12 shrink-0 items-center gap-1 px-2 sm:px-3 md:h-14 md:gap-2 md:px-4 [&_:focus-visible]:outline-white">
      <Tooltip content="All boards">
        <Link href="/boards" aria-label="All boards" className={buttonClass({ variant: "transparent", iconOnly: true, className: "icon-btn shrink-0" })}>
          <ChevronLeft size={18} aria-hidden />
        </Link>
      </Tooltip>

      <InlineEdit
        as="h1"
        onBoard
        truncate
        allowEmpty
        maxLength={80}
        label="Board name"
        value={project.name}
        onSave={async (next) => {
          await rename(next);
        }}
        editing={editing}
        onEditingChange={setEditing}
        className={cn("shrink", editing ? "w-[min(60vw,420px)]" : "max-w-[calc(100%-9rem)] sm:max-w-[min(46vw,560px)]")}
        textClassName="text-[18px] font-bold leading-8 py-0!"
        editorClassName="h-8"
      />

      <Tooltip content="Click to star or unstar this board. Starred boards show up at the top of your boards list.">
        <IconButton
          title="Star board"
          aria-label={project.starred ? "Unstar board" : "Star board"}
          aria-pressed={project.starred}
          tooltip={false}
          variant="transparent"
          onClick={() => void toggleStar()}
          className="shrink-0"
        >
          <Star size={16} aria-hidden className={cn("transition-colors", project.starred && "fill-[#f5cd47] text-[#f5cd47]")} />
        </IconButton>
      </Tooltip>

      <span aria-hidden className="mx-1 hidden h-5 w-px shrink-0 bg-white/30 sm:block" />
      <StatusControl />

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1 md:gap-2">
        {tags.length > 0 ? (
          <button
            type="button"
            onClick={onOpenTags}
            aria-label={`Tags: ${tags.join(", ")}. Edit tags`}
            className="hidden h-8 min-w-0 items-center gap-1 overflow-hidden rounded-control px-1 transition-colors hover:bg-on-board-ghost-hover lg:flex"
          >
            {tags.slice(0, MAX_TAGS).map((t) => (
              <span key={t} className={cn(chip, "max-w-[120px] truncate")}>
                {t}
              </span>
            ))}
            {tags.length > MAX_TAGS ? <span className={cn(chip, "shrink-0")}>+{tags.length - MAX_TAGS}</span> : null}
          </button>
        ) : null}

        <Tooltip content={<TooltipHint label="Show menu" shortcut="]" />}>
          <IconButton
            ref={menuButtonRef}
            title="Show menu"
            tooltip={false}
            variant="transparent"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? menuId : undefined}
            onClick={onToggleMenu}
            className={cn("shrink-0", menuOpen && "bg-on-board-ghost-pressed")}
          >
            <MoreHorizontal size={18} aria-hidden />
          </IconButton>
        </Tooltip>
      </div>
    </div>
  );
}
