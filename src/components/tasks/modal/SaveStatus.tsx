"use client";

import { Check, CircleAlert, Loader2 } from "lucide-react";
import type { SaveStatus as Status } from "./useTaskPatch";

/** Subtle "Saving..." / "Saved" indicator. A live region so screen readers hear the outcome once. */
export function SaveStatus({ status }: { status: Status }) {
  return (
    <span role="status" aria-live="polite" className="flex h-5 items-center gap-1 text-body-sm text-ink-soft">
      {status === "saving" ? (
        <>
          <Loader2 size={12} className="animate-spin" aria-hidden />
          Saving...
        </>
      ) : status === "saved" ? (
        <>
          <Check size={12} className="text-success-text" aria-hidden />
          Saved
        </>
      ) : status === "error" ? (
        <>
          <CircleAlert size={12} className="text-danger" aria-hidden />
          Not saved
        </>
      ) : null}
    </span>
  );
}
