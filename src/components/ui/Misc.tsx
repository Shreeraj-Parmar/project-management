"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/client";
import { Button } from "./Button";
import { SectionMessage } from "./SectionMessage";

/** Centered loading spinner (page / panel level). Use Skeleton for known layouts. */
export function Spinner({ className, size = 22, label = "Loading" }: { className?: string; size?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className={cn("flex items-center justify-center py-16 text-ink-muted", className)}>
      <Loader2 className="animate-spin" size={size} />
    </div>
  );
}

/** Error block with optional retry. Built on SectionMessage (error). */
export function ErrorBox({ message, onRetry, title = "Something went wrong", className }: { message: string; onRetry?: () => void; title?: string; className?: string }) {
  return (
    <SectionMessage
      appearance="error"
      title={title}
      className={className}
      actions={
        onRetry ? (
          <Button variant="link" onClick={onRetry} className="!font-semibold">
            Try again
          </Button>
        ) : undefined
      }
    >
      {message}
    </SectionMessage>
  );
}

/**
 * Empty state: tinted icon disc, title, one sentence of help and the primary action.
 * `color` tints the disc (module colour); the icon takes the same colour.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  color = "#0c66e4",
  className,
  compact,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  color?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 text-center", compact ? "py-8" : "py-14", className)}>
      <div
        className={cn("mb-4 flex items-center justify-center rounded-full", compact ? "h-12 w-12" : "h-16 w-16")}
        style={{ background: `color-mix(in srgb, ${color} 14%, white)`, color }}
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="text-h-s font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-body text-ink-soft">{description}</p> : null}
      {action ? <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}

/**
 * Small status chip with custom colours (sentence case, 20px). For fixed semantic statuses prefer Lozenge.
 * Always pass bg and fg together with >= 4.5:1 contrast.
 */
export function Badge({ children, bg = "#091e420f", fg = "#44546f", className }: { children: React.ReactNode; bg?: string; fg?: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-5 items-center gap-1 rounded-control px-1.5 text-body-sm font-semibold", className)} style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

/**
 * Title row at the top of every module page (inside the content sheet).
 * Icon tile uses the module colour. Actions wrap under the title on phones.
 */
export function PageHeader({
  title,
  description,
  color = "#0c66e4",
  icon,
  actions,
  meta,
  breadcrumbs,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  color?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  /** Row under the description (lozenges, counts, last-synced). */
  meta?: React.ReactNode;
  /** Pass a <Breadcrumbs/> element. */
  breadcrumbs?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6", className)}>
      {breadcrumbs ? <div className="mb-3">{breadcrumbs}</div> : null}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon ? (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card text-white" style={{ background: color }} aria-hidden>
              {icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-h-m font-semibold text-ink sm:text-h-l">{title}</h1>
            {description ? <p className="mt-0.5 text-body text-ink-soft">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
    </header>
  );
}

/** Old name of PageHeader. Same props. */
export const ModuleHeader = PageHeader;

/** Number tile for dashboards (Overview, workspace summary). `href` makes it a link. */
export function StatTile({ label, value, color, icon, href }: { label: string; value: React.ReactNode; color: string; icon: React.ReactNode; href?: string }) {
  const inner = (
    <div className={cn("t-card flex items-center gap-3 p-4", !href && "t-card--static")}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card text-white" style={{ background: color }} aria-hidden>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-body-sm font-semibold text-ink-soft">{label}</div>
        <div className="truncate text-h-m font-bold text-ink">{value}</div>
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-card">
      {inner}
    </Link>
  ) : (
    inner
  );
}
