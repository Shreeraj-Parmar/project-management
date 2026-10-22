"use client";

import { cn } from "@/lib/client";

/** Shimmering placeholder. Match the radius of the real element (card rounded-card, avatar `circle`). */
export function Skeleton({ className, width, height, circle, style }: { className?: string; width?: number | string; height?: number | string; circle?: boolean; style?: React.CSSProperties }) {
  return <span aria-hidden className={cn("skeleton", circle && "!rounded-full", className)} style={{ width, height: height ?? 16, ...style }} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 && lines > 1 ? "60%" : "100%"} />
      ))}
    </div>
  );
}

/** Loading placeholder shaped like a Trello card (64px). */
export function SkeletonCard({ className }: { className?: string }) {
  return <Skeleton className={cn("!rounded-card", className)} height={64} width="100%" />;
}
