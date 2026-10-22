"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/client";
import { buttonClass, Skeleton } from "@/components/ui";

/** Shimmer that stays visible over the translucent glass chrome (the default skeleton is tuned for white surfaces). */
function GlassSkeleton({ className, width, height }: { className?: string; width?: number | string; height?: number | string }) {
  return <Skeleton className={cn("bg-none bg-white/25 animate-pulse", className)} width={width} height={height} />;
}

/**
 * Loading state of the whole board shell: the real chrome layout (header, sidebar, content) with placeholders, painted
 * on the board colour when the boards cache already knows it, so there is no flash of another background.
 */
export function ShellSkeleton({ name, tasks }: { name?: string; tasks?: boolean }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" role="status" aria-label="Loading board">
      <div className="glass-bar glass-bar--board flex h-12 shrink-0 items-center gap-2 px-2 sm:px-3 md:h-14 md:px-4">
        <Link href="/boards" aria-label="All boards" className={buttonClass({ variant: "transparent", iconOnly: true, className: "icon-btn" })}>
          <ChevronLeft size={18} aria-hidden />
        </Link>
        {name ? <span className="max-w-[46vw] truncate text-[18px] font-bold leading-8 text-white">{name}</span> : <GlassSkeleton width={180} height={20} />}
        <GlassSkeleton width={32} height={32} className="!rounded-control" />
        <GlassSkeleton width={72} height={16} className="hidden sm:block" />
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[var(--w-sidebar)] shrink-0 border-r border-white/15 bg-black/[0.28] p-3 md:block">
          <div className="mb-4 flex items-center gap-3 border-b border-white/15 pb-3">
            <GlassSkeleton width={32} height={32} />
            <div className="space-y-1.5">
              <GlassSkeleton width={110} height={12} />
              <GlassSkeleton width={72} height={10} />
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex h-9 items-center gap-2.5 px-1.5">
                <GlassSkeleton width={24} height={24} />
                <GlassSkeleton width={`${50 + ((i * 17) % 35)}%`} height={12} />
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {tasks ? (
            <div className="flex gap-2 overflow-hidden px-3 pt-3 sm:px-2">
              {[3, 2, 4].map((n, i) => (
                <div key={i} className="w-[var(--w-list)] shrink-0 rounded-list bg-list p-2">
                  <Skeleton width={120} height={16} className="mx-1 my-2" />
                  <div className="space-y-2">
                    {Array.from({ length: n }).map((_, j) => (
                      <Skeleton key={j} className="!rounded-card" width="100%" height={j % 2 ? 56 : 80} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="content-sheet mx-auto w-full max-w-page space-y-6 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <Skeleton width={40} height={40} className="!rounded-card" />
                  <div className="space-y-2">
                    <Skeleton width={200} height={20} />
                    <Skeleton width={280} height={12} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="!rounded-card" width="100%" height={72} />
                  ))}
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <Skeleton className="!rounded-card" width="100%" height={160} />
                  <Skeleton className="!rounded-card" width="100%" height={160} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
