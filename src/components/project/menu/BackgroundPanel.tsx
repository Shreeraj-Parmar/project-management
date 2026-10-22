"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/client";
import { BOARD_COLORS } from "@/lib/constants";
import { useProject } from "../ProjectContext";
import { useBoardActions } from "../useBoardActions";

/** Grid of board backgrounds. Choosing one applies it live (the whole shell repaints) and saves right away. */
export function BackgroundPanel() {
  const { project } = useProject();
  const { setColor } = useBoardActions();

  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-h-xxs font-semibold text-ink-soft">Colors</legend>
      <div className="grid grid-cols-2 gap-x-2 gap-y-3">
        {BOARD_COLORS.map((c) => {
          const checked = c.id === project.color;
          return (
            <label key={c.id} className="group block cursor-pointer">
              <input type="radio" name="board-background" value={c.id} checked={checked} onChange={() => void setColor(c.id)} className="peer sr-only" />
              <span
                aria-hidden
                className={cn(
                  "relative block h-16 rounded-card shadow-[inset_0_0_0_1px_rgba(9,30,66,0.15)] transition-shadow group-hover:shadow-[inset_0_0_0_1px_rgba(9,30,66,0.15),0_0_0_2px_var(--color-fill-hover)]",
                  "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
                  checked && "ring-2 ring-brand ring-offset-2"
                )}
                style={{ background: c.css }}
              >
                {checked ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white">
                      <Check size={14} />
                    </span>
                  </span>
                ) : null}
              </span>
              <span className={cn("mt-1.5 block truncate text-body-sm", checked ? "font-semibold text-ink" : "text-ink-soft")}>{c.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
