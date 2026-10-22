"use client";

import { cn } from "@/lib/client";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | number;
const PX: Record<Exclude<AvatarSize, number>, number> = { xs: 16, sm: 24, md: 32, lg: 40, xl: 96 };
const PALETTE = ["#0c66e4", "#1f845a", "#c25100", "#c9372c", "#6e5dc6", "#ae4787", "#227d9b", "#5b7f24"];

/** Deterministic colour from a name. Every palette entry has >= 4.5:1 contrast with white initials. */
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
export function initials(name: string): string {
  const parts = name.trim().split(/[\s._@-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Circle avatar with image or initials fallback. Pass `name` always (it is the accessible name). */
export function Avatar({ name, src, size = "md", color, className, ring }: { name: string; src?: string | null; size?: AvatarSize; color?: string; className?: string; ring?: string }) {
  const px = typeof size === "number" ? size : PX[size];
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn("relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold text-white", className)}
      style={{ width: px, height: px, fontSize: Math.max(8, Math.round(px * 0.4)), lineHeight: 1, background: color ?? avatarColor(name), boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/** Overlapping avatars with a "+N" chip. `ring` = background colour of the surface (white on cards, #f1f2f4 in lists). */
export function AvatarGroup({
  people,
  max = 4,
  size = "md",
  ring = "#ffffff",
  className,
}: {
  people: { name: string; src?: string | null; color?: string }[];
  max?: number;
  size?: AvatarSize;
  ring?: string;
  className?: string;
}) {
  const px = typeof size === "number" ? size : PX[size];
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className={cn("flex items-center", className)} role="group" aria-label={`${people.length} member${people.length === 1 ? "" : "s"}`}>
      {shown.map((p, i) => (
        <span key={p.name + i} className={i > 0 ? (px >= 32 ? "-ml-1" : "-ml-0.5") : ""}>
          <Avatar {...p} size={size} ring={ring} />
        </span>
      ))}
      {extra > 0 ? (
        <span
          className={cn("inline-flex items-center justify-center rounded-full bg-fill font-semibold text-ink-soft", px >= 32 ? "-ml-1" : "-ml-0.5")}
          style={{ width: px, height: px, boxShadow: `0 0 0 2px ${ring}`, fontSize: Math.max(10, Math.round(px * 0.38)) }}
          title={people.slice(max).map((p) => p.name).join(", ")}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
