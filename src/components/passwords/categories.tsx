import { AtSign, Braces, Cloud, Database, Mail, Server, ShieldCheck } from "lucide-react";
import type { LozengeAppearance } from "@/components/ui/Lozenge";

/**
 * One colour per credential category, taken from the ADS accent scales so the tile on the card, the
 * lozenge and the dot in the filter chip always agree. Class names are written out in full so
 * Tailwind can see them.
 */
export type CategoryMeta = {
  icon: typeof Server;
  /** Tile behind the icon on the card (scale 200 background, scale 800 icon). */
  tile: string;
  /** Small dot in the filter chip (scale 700). */
  dot: string;
  /** Closest Lozenge appearance. */
  lozenge: LozengeAppearance;
  /** Extra classes for categories without a matching lozenge appearance. */
  lozengeClass?: string;
};

const META: Record<string, CategoryMeta> = {
  Server: { icon: Server, tile: "bg-blue-200 text-blue-800", dot: "bg-blue-700", lozenge: "inprogress" },
  Database: { icon: Database, tile: "bg-green-200 text-green-800", dot: "bg-green-700", lozenge: "success" },
  "API Key": { icon: Braces, tile: "bg-purple-200 text-purple-800", dot: "bg-purple-700", lozenge: "new" },
  Service: { icon: Cloud, tile: "bg-orange-200 text-orange-800", dot: "bg-orange-700", lozenge: "warning" },
  Email: { icon: Mail, tile: "bg-yellow-200 text-yellow-800", dot: "bg-yellow-700", lozenge: "moved" },
  Social: { icon: AtSign, tile: "bg-magenta-200 text-magenta-800", dot: "bg-magenta-700", lozenge: "default", lozengeClass: "bg-magenta-200 text-magenta-800" },
  Other: { icon: ShieldCheck, tile: "bg-neutral-300 text-neutral-800", dot: "bg-neutral-700", lozenge: "default" },
};

/** Unknown (legacy) categories fall back to "Other". */
export function categoryMeta(category: string): CategoryMeta {
  return META[category] ?? META.Other;
}

/** Square icon tile that stands in for an avatar on the credential card. */
export function CategoryTile({ category, size = 40 }: { category: string; size?: number }) {
  const m = categoryMeta(category);
  const Icon = m.icon;
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-card ${m.tile}`} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.5)} />
    </span>
  );
}
