"use client";

import { cn } from "@/lib/client";

/** 1px hairline. With `children` it renders a labelled divider ("or"). */
export function Divider({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return <hr className={cn("my-4 border-0 border-t border-line", className)} />;
  return (
    <div role="separator" className={cn("my-4 flex items-center gap-3 text-body-sm text-ink-muted", className)}>
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
