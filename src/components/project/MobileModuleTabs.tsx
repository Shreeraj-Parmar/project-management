"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/client";
import type { ModuleId } from "@/lib/constants";
import { MODULES } from "@/lib/constants";
import { MODULE_ICONS, moduleHref } from "./modules";

/** Phones (< 768px): the sidebar is hidden, modules live in a horizontally scrollable pill strip under the header. */
export function MobileModuleTabs({ base, activeId }: { base: string; activeId: ModuleId }) {
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the active pill in view (centered) when the module changes or the strip first renders.
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!list || !el) return;
    list.scrollTo({ left: Math.max(0, el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2) });
  }, [activeId]);

  return (
    <nav aria-label="Board modules" className="glass-bar glass-bar--board shrink-0 border-t border-white/10 md:hidden">
      <ul ref={listRef} className="flex gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MODULES.map((m) => {
          const Icon = MODULE_ICONS[m.id];
          const active = m.id === activeId;
          return (
            <li key={m.id} className="shrink-0">
              <Link
                href={moduleHref(base, m)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-body font-medium outline-offset-0 transition-colors focus-visible:outline-white",
                  active ? "bg-white text-ink shadow-card" : "bg-black/25 text-white active:bg-black/40"
                )}
              >
                <Icon size={14} aria-hidden style={active ? { color: m.color } : undefined} />
                {m.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
