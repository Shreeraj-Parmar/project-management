"use client";

import Link from "next/link";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/client";
import { boardBackground, type ModuleId } from "@/lib/constants";
import { IconButton, Tooltip } from "@/components/ui";
import type { ProjectDetail } from "@/lib/types";
import { TooltipHint } from "./TooltipHint";
import { moduleById, moduleCount, moduleHref, MODULE_ICONS, NAV_GROUPS } from "./modules";

/** Board colour tile with the board's initial. */
export function BoardTile({ project, size = 32 }: { project: Pick<ProjectDetail, "name" | "color">; size?: number }) {
  const initial = (project.name.trim().charAt(0) || "B").toUpperCase();
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-control font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)]"
      style={{ width: size, height: size, background: boardBackground(project.color), fontSize: Math.round(size * 0.44) }}
    >
      {initial}
    </span>
  );
}

/** Up / Down / Home / End move between the module links while one of them has focus. */
function onNavKeyDown(e: React.KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
  const links = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("a[href]"));
  const i = links.indexOf(document.activeElement as HTMLElement);
  if (i < 0) return;
  e.preventDefault();
  const next = e.key === "Home" ? 0 : e.key === "End" ? links.length - 1 : e.key === "ArrowDown" ? Math.min(i + 1, links.length - 1) : Math.max(i - 1, 0);
  links[next]?.focus();
}

/**
 * Left sidebar (Trello's new board sidebar): glass over the board background, 260px, collapses to a 56px icon rail.
 * Active item = white pill with dark text. Rail items show a tooltip with the label and count.
 */
export function BoardSidebar({
  project,
  base,
  activeId,
  collapsed,
  onToggle,
}: {
  project: ProjectDetail;
  base: string;
  activeId: ModuleId;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      aria-label="Board sidebar"
      className={cn(
        "relative hidden shrink-0 flex-col border-r border-white/15 bg-black/[0.28] text-white backdrop-blur-[6px] transition-[width] duration-200 md:flex [&_:focus-visible]:outline-white",
        collapsed ? "w-14" : "w-[var(--w-sidebar)]"
      )}
    >
      {/* Board identity */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 border-b border-white/15 py-3">
          <Tooltip content={project.name} placement="right">
            <span className="rounded-control">
              <BoardTile project={project} />
              <span className="sr-only">{project.name}</span>
            </span>
          </Tooltip>
          <Tooltip content={<TooltipHint label="Expand sidebar" shortcut="[" />} placement="right">
            <IconButton title="Expand sidebar" tooltip={false} variant="transparent" size="sm" onClick={onToggle} aria-expanded={false}>
              <ChevronsRight size={16} aria-hidden />
            </IconButton>
          </Tooltip>
        </div>
      ) : (
        <div className="flex items-center gap-3 border-b border-white/15 px-3 py-3">
          <BoardTile project={project} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-body font-semibold leading-5 text-white" title={project.name}>
              {project.name}
            </div>
            <div className="text-body-sm text-white/90">Project board</div>
          </div>
          <Tooltip content={<TooltipHint label="Collapse sidebar" shortcut="[" />}>
            <IconButton title="Collapse sidebar" tooltip={false} variant="transparent" size="sm" onClick={onToggle} aria-expanded>
              <ChevronsLeft size={16} aria-hidden />
            </IconButton>
          </Tooltip>
        </div>
      )}

      {/* Modules */}
      <nav aria-label="Board modules" onKeyDown={onNavKeyDown} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3 pt-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && (collapsed ? "mt-2 border-t border-white/15 pt-2" : "mt-1"))}>
            {group.label && !collapsed ? <div className="px-1.5 pb-1 pt-3 text-h-xxs font-semibold text-white/90">{group.label}</div> : null}
            {gi === 0 && !collapsed ? <div className="pt-2" /> : null}
            <ul className="space-y-0.5">
              {group.ids.map((id) => {
                const m = moduleById(id);
                const Icon = MODULE_ICONS[id];
                const active = id === activeId;
                const count = moduleCount(id, project);
                const link = (
                  <Link
                    href={moduleHref(base, m)}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? `${m.label}${count ? `, ${count.n} ${count.phrase}` : ""}` : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-control px-1.5 text-body font-medium outline-offset-0 transition-colors focus-visible:outline-white",
                      collapsed && "justify-center px-0",
                      active ? "bg-white text-ink shadow-card" : "text-white hover:bg-white/15 active:bg-white/25"
                    )}
                  >
                    <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-control text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]" style={{ background: m.color }}>
                      <Icon size={14} />
                    </span>
                    {collapsed ? null : <span className="min-w-0 flex-1 truncate">{m.label}</span>}
                    {!collapsed && count ? (
                      <span
                        aria-label={`${count.n} ${count.phrase}`}
                        className={cn("rounded-full px-1.5 text-micro font-semibold leading-4", active ? "bg-fill text-ink-soft" : "bg-white/25 text-white")}
                      >
                        {count.n}
                      </span>
                    ) : null}
                  </Link>
                );
                return (
                  <li key={id}>
                    {collapsed ? (
                      <Tooltip content={count ? `${m.label} (${count.n} ${count.phrase})` : m.label} placement="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
