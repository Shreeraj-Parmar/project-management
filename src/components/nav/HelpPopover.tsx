"use client";

import { CircleHelp, FolderKanban } from "lucide-react";
import { IconButton, Kbd, Popover } from "@/components/ui";
import { MODULES } from "@/lib/constants";
import type { Tone } from "./HeaderMenus";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["/"], label: "Search boards" },
  { keys: ["?"], label: "Open this help" },
  { keys: ["Esc"], label: "Close a popover or dialog" },
  { keys: ["↑", "↓"], label: "Move through rows" },
  { keys: ["Enter"], label: "Open the highlighted board" },
];

/** Help (?) popover: what a board is, what lives in it, and the keyboard hints that really exist. */
export function HelpPopover({ tone, open, onOpenChange }: { tone: Tone; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      trigger={
        <IconButton title="Help" variant={tone === "glass" ? "transparent" : "subtle"} className={tone === "glass" ? "aria-expanded:bg-white/25" : "aria-expanded:bg-brand-soft aria-expanded:text-brand"}>
          <CircleHelp size={16} aria-hidden />
        </IconButton>
      }
      triggerClassName="max-md:hidden!"
      title="Help"
      width={320}
      placement="bottom-end"
    >
      <section>
        <h3 className="flex items-center gap-2 text-body font-semibold text-ink">
          <FolderKanban size={16} className="text-brand" aria-hidden />
          What is a board?
        </h3>
        <p className="mt-1 text-body text-ink-soft">
          A board is <strong className="font-semibold text-ink">one project</strong>. Everything that belongs to the project lives inside it, so nothing gets mixed up.
        </p>
        <ul className="mt-2 flex flex-wrap gap-1">
          {MODULES.filter((m) => m.id !== "overview").map((m) => (
            <li key={m.id} className="inline-flex h-5 items-center gap-1.5 rounded-control bg-fill px-1.5 text-body-sm font-semibold text-ink-soft">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: m.color }} />
              {m.label}
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-4 border-t border-fill-hover pt-3">
        <h3 className="mb-1 text-h-xxs font-semibold text-ink-soft">Keyboard shortcuts</h3>
        <ul className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-3 text-body text-ink">
              <span>{s.label}</span>
              <span className="flex shrink-0 gap-1">
                {s.keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Popover>
  );
}
