"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/client";
import { Lozenge } from "@/components/ui";
import type { EnvVar } from "@/lib/types";
import { MASK } from "./utils";

const LONG = 44;

/**
 * The VALUE cell. Secrets are masked with a fixed-length mask until revealed, plain values are shown.
 * Long values truncate to one line; clicking them expands the full text (without stealing a text selection).
 * `wrap` = card layout: always wrapped, capped at 112px with its own scroll.
 */
export function ValueCell({ v, shown, wrap }: { v: EnvVar; shown: string | undefined; wrap?: boolean }) {
  const [open, setOpen] = useState(false);
  const text = shown ?? (v.secret ? undefined : v.value);
  const tag = v.secret ? (
    <Lozenge icon={<Lock size={10} aria-hidden />} className="shrink-0">
      Secret
    </Lozenge>
  ) : null;

  if (!v.hasValue) {
    return (
      <div className={cn("flex min-w-0 items-center gap-2", wrap && "-ml-1.5")}>
        <span className="px-1.5 text-body italic text-ink-muted">Empty</span>
        <span className="ml-auto">{tag}</span>
      </div>
    );
  }

  if (text === undefined) {
    return (
      <div className={cn("flex min-w-0 items-center gap-2", wrap && "-ml-1.5")}>
        <span className="px-1.5 font-mono text-body tracking-[0.12em] text-ink-muted" role="img" aria-label="Hidden value">
          {MASK}
        </span>
        <span className="ml-auto">{tag}</span>
      </div>
    );
  }

  const long = text.length > LONG;
  const expanded = wrap || open;
  const mono = "font-mono text-[13px] leading-5 text-ink";
  return (
    <div className={cn("flex min-w-0 items-start gap-2", wrap && "-ml-1.5")}>
      {long && !wrap ? (
        <button
          type="button"
          aria-expanded={open}
          title={open ? "Show less" : "Show full value"}
          onClick={() => {
            if (window.getSelection()?.toString()) return;
            setOpen((o) => !o);
          }}
          className={cn(
            "min-w-0 flex-1 cursor-pointer rounded-control px-1.5 py-0.5 text-left outline-offset-0 hover:bg-fill",
            shown !== undefined && "bg-fill",
            mono,
            expanded ? "max-h-40 select-text overflow-auto whitespace-pre-wrap break-all" : "truncate",
          )}
        >
          {text}
        </button>
      ) : (
        <span
          className={cn(
            "min-w-0 flex-1 rounded-control px-1.5 py-0.5",
            shown !== undefined && "bg-fill",
            mono,
            wrap ? "max-h-28 select-text overflow-auto whitespace-pre-wrap break-all" : "truncate",
          )}
        >
          {text}
        </span>
      )}
      <span className={cn("ml-auto", !expanded && "self-center", expanded && "mt-0.5")}>{tag}</span>
    </div>
  );
}
