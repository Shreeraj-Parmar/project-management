"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/client";

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16 text-ink-muted", className)}>
      <Loader2 className="animate-spin" size={22} />
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-[#ffd5d2] bg-[#ffeceb] p-4 text-sm text-[#601e16]">
      <div className="font-semibold">Something went wrong</div>
      <div className="mt-1 break-words">{message}</div>
      {onRetry ? (
        <button onClick={onRetry} className="mt-2 text-xs font-semibold underline">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  color = "#0c66e4",
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: color }}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Badge({ children, bg = "#e9f2ff", fg = "#09326c", className }: { children: React.ReactNode; bg?: string; fg?: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold leading-4", className)} style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}

export function ModuleHeader({
  title,
  description,
  color,
  icon,
  actions,
}: {
  title: string;
  description?: string;
  color: string;
  icon: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white shadow-sm" style={{ background: color }}>
          {icon}
        </div>
        <div>
          <h1 className="text-xl font-bold leading-6 text-ink">{title}</h1>
          {description ? <p className="text-[13px] text-ink-muted">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatTile({ label, value, color, icon, href }: { label: string; value: React.ReactNode; color: string; icon: React.ReactNode; href?: string }) {
  const inner = (
    <div className="t-card flex items-center gap-3 p-4 transition">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[12px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
        <div className="truncate text-xl font-bold text-ink">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
