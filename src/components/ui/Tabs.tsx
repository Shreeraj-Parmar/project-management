"use client";

import Link from "next/link";
import { useId, useRef } from "react";
import { cn } from "@/lib/client";

export type TabItem = {
  id: string;
  label: React.ReactNode;
  /** Count lozenge after the label. */
  count?: number;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** When any tab has href the bar renders as <nav> of links (aria-current) instead of a tablist. */
  href?: string;
};

export type TabsVariant = "underline" | "pill" | "segmented" | "glass";

const BAR: Record<TabsVariant, string> = {
  underline: "border-b-2 border-fill-hover gap-0",
  pill: "gap-1",
  segmented: "gap-0.5 rounded-control bg-fill p-0.5",
  glass: "gap-0.5 rounded-control bg-glass-board p-0.5",
};
const TAB: Record<TabsVariant, { base: string; on: string; off: string }> = {
  underline: {
    base: "-mb-0.5 h-10 border-b-2 px-3 font-medium",
    on: "border-brand text-brand active:text-brand-dark",
    off: "border-transparent text-ink-soft hover:border-fill-hover hover:text-ink",
  },
  pill: { base: "h-8 rounded-control px-3 font-medium", on: "bg-brand-soft text-brand", off: "text-ink-soft hover:bg-fill hover:text-ink" },
  segmented: { base: "h-7 rounded-control px-3 font-medium", on: "bg-canvas text-ink shadow-card", off: "text-ink-soft hover:bg-fill-hover hover:text-ink" },
  glass: { base: "h-7 rounded-control px-3 font-medium", on: "bg-white/30 text-white", off: "text-white hover:bg-white/20" },
};

/**
 * Tabs: `underline` (page / panel tabs, count lozenge), `pill`, `segmented` (view switcher),
 * `glass` (segmented over a board background). Arrow keys / Home / End move between tabs.
 *
 *   <Tabs tabs={[{id:"a",label:"All",count:12},{id:"b",label:"Archived"}]} value={tab} onChange={setTab} />
 */
export function Tabs({
  tabs,
  value,
  onChange,
  variant = "underline",
  className,
  ariaLabel = "Tabs",
  idPrefix,
  scrollable = true,
}: {
  tabs: TabItem[];
  value: string;
  onChange?: (id: string) => void;
  variant?: TabsVariant;
  className?: string;
  ariaLabel?: string;
  /** Prefix for ids so a <TabPanel> can reference the tab. */
  idPrefix?: string;
  scrollable?: boolean;
}) {
  const uid = useId();
  const prefix = idPrefix ?? `tabs${uid}`;
  const listRef = useRef<HTMLDivElement>(null);
  const nav = tabs.some((t) => t.href);
  const s = TAB[variant];

  const onKeyDown = (e: React.KeyboardEvent) => {
    const els = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-tab]:not([disabled]):not([aria-disabled=true])") ?? []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % els.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + els.length) % els.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = els.length - 1;
    if (n >= 0) {
      e.preventDefault();
      els[n].focus();
      if (!nav) els[n].click();
    }
  };

  const content = (t: TabItem, on: boolean) => (
    <>
      {t.icon}
      <span>{t.label}</span>
      {t.count !== undefined ? (
        <span className={cn("rounded-full px-1.5 text-micro font-semibold leading-4", on && variant === "underline" ? "bg-brand-soft text-brand" : variant === "glass" ? "bg-white/20 text-white" : "bg-fill text-ink-soft")}>{t.count}</span>
      ) : null}
    </>
  );

  return (
    <div ref={listRef} role={nav ? undefined : "tablist"} aria-label={ariaLabel} onKeyDown={onKeyDown} className={cn("flex items-center", scrollable && "overflow-x-auto", BAR[variant], className)}>
      {tabs.map((t) => {
        const on = t.id === value;
        const cls = cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-body transition-colors", s.base, on ? s.on : s.off, t.disabled && "pointer-events-none !text-ink-disabled");
        if (t.href) {
          return (
            <Link key={t.id} data-tab href={t.href} aria-current={on ? "page" : undefined} aria-disabled={t.disabled || undefined} className={cls}>
              {content(t, on)}
            </Link>
          );
        }
        return (
          <button
            key={t.id}
            data-tab
            type="button"
            role="tab"
            id={`${prefix}-tab-${t.id}`}
            aria-selected={on}
            aria-controls={`${prefix}-panel-${t.id}`}
            tabIndex={on ? 0 : -1}
            disabled={t.disabled}
            onClick={() => onChange?.(t.id)}
            className={cls}
          >
            {content(t, on)}
          </button>
        );
      })}
    </div>
  );
}

/** Panel for a tab. Renders only while selected. `idPrefix` must match the Tabs prop. */
export function TabPanel({ idPrefix, id, value, children, className }: { idPrefix: string; id: string; value: string; children: React.ReactNode; className?: string }) {
  if (id !== value) return null;
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${id}`} aria-labelledby={`${idPrefix}-tab-${id}`} tabIndex={0} className={cn("pt-4 outline-none focus-visible:outline-2", className)}>
      {children}
    </div>
  );
}
