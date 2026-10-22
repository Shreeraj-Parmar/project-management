"use client";

import { cn } from "@/lib/client";

/** Keyboard key cap, e.g. <Kbd>Esc</Kbd> or <Kbd>⌘</Kbd><Kbd>K</Kbd>. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-control bg-fill px-1 font-sans text-body-sm font-medium text-ink-soft shadow-[inset_0_-1px_0_#091e4224]", className)}>
      {children}
    </kbd>
  );
}
