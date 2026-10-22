"use client";

import Link from "next/link";
import { cn } from "@/lib/client";

export type Crumb = { label: React.ReactNode; href?: string; onClick?: () => void; icon?: React.ReactNode };

/**
 * ADS breadcrumbs: subtle links, "/" separators, last item is the current page (bold, not a link).
 * `onBoard` renders white text for a board gradient / glass header.
 */
export function Breadcrumbs({ items, className, onBoard }: { items: Crumb[]; className?: string; onBoard?: boolean }) {
  const link = onBoard ? "text-white/90 hover:text-white" : "text-ink-soft hover:text-ink";
  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center text-body">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          const inner = (
            <>
              {c.icon}
              <span className="truncate">{c.label}</span>
            </>
          );
          return (
            <li key={i} className={cn("flex min-w-0 items-center", last ? "shrink-0" : "shrink")}>
              {last ? (
                <span aria-current="page" className={cn("inline-flex max-w-[24ch] items-center gap-1 truncate font-semibold sm:max-w-[40ch]", onBoard ? "text-white" : "text-ink")}>
                  {inner}
                </span>
              ) : c.href ? (
                <Link href={c.href} className={cn("inline-flex min-w-0 items-center gap-1 rounded-sm hover:underline", link)}>
                  {inner}
                </Link>
              ) : (
                <button type="button" onClick={c.onClick} className={cn("inline-flex min-w-0 items-center gap-1 rounded-sm hover:underline", link)}>
                  {inner}
                </button>
              )}
              {!last ? (
                <span aria-hidden className={cn("mx-2 shrink-0", onBoard ? "text-white/70" : "text-ink-muted")}>
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
