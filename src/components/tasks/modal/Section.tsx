"use client";

import { useId } from "react";
import { cn } from "@/lib/client";

/**
 * Card-back section: a 20px icon sits in the 40px left gutter (the main column has pl-10),
 * then a 16/20 600 heading with optional actions on the right.
 */
export function Section({
  icon,
  title,
  actions,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn("relative mt-6", className)}>
      <span className="absolute -left-8 top-1.5 flex h-5 w-5 items-center justify-center text-ink-soft" aria-hidden>
        {icon}
      </span>
      <div className="mb-2 flex min-h-8 flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h3 id={id} className="text-h-s font-semibold text-ink">
          {title}
        </h3>
        {actions ? <div className="flex items-center gap-1">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** 12/16 600 caption above a meta group (Labels, Priority, Due date). */
export function MetaGroup({ caption, children, className }: { caption: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <h3 className="mb-1 text-h-xxs font-semibold text-ink-soft">{caption}</h3>
      {children}
    </div>
  );
}
