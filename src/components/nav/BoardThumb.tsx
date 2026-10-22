import { cn } from "@/lib/client";
import { boardBackground } from "@/lib/constants";

/** Small gradient swatch that stands for a board in menus and lists (40x32 by default). */
export function BoardThumb({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cn("block shrink-0 rounded-control", className ?? "h-8 w-10")} style={{ background: boardBackground(color) }} />;
}

/** The workspace tile: rounded square with the initial, as in Trello's workspace rows. */
export function WorkspaceTile({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-card font-bold text-white", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.46), background: "linear-gradient(135deg,#0c66e4,#09326c)" }}
    >
      D
    </span>
  );
}
