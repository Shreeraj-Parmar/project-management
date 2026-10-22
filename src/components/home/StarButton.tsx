"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/client";
import { Tooltip } from "@/components/ui";

/** Star toggle on a board tile: hidden until the tile is hovered or focused, always visible when starred and on touch. */
export function StarButton({ starred, name, onToggle }: { starred: boolean; name: string; onToggle: () => void }) {
  return (
    <Tooltip content={starred ? "Remove from starred" : "Star board"}>
      <button
        type="button"
        aria-label={`Star board ${name}`}
        aria-pressed={starred}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-control text-white transition-[opacity,transform,background-color] duration-150 hover:scale-110 hover:bg-black/25",
          starred
            ? "opacity-100"
            : "translate-y-1 opacity-0 focus-visible:translate-y-0 focus-visible:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
        )}
      >
        <Star size={16} aria-hidden fill={starred ? "#f5cd47" : "none"} stroke={starred ? "#f5cd47" : "currentColor"} className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
      </button>
    </Tooltip>
  );
}
