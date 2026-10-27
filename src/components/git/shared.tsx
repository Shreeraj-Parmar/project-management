"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { copyToClipboard } from "@/lib/client";

export const GIT_COLOR = "#172b4d";

export function PanelEmpty({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-border-bold/50 bg-surface/60">
      <EmptyState compact icon={icon} color={GIT_COLOR} title={title} description={description} action={action} />
    </div>
  );
}

/** Section GitHub didn't let us read (Actions disabled, token scope, rate limit). */
export function Unavailable({ what, reason, url }: { what: string; reason: string; url: string }) {
  const status = reason.match(/GitHub API (\d{3})/)?.[1];
  const why = status === "404" ? "GitHub returned 404: the feature may be disabled for this repository, or the token can't see it." : status === "403" ? "GitHub refused (403): the token lacks the scope for this, or the rate limit is reached." : reason;
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-6 text-center">
      <p className="font-semibold text-ink">Couldn&apos;t load {what}</p>
      <p className="mx-auto mt-1 max-w-md text-body-sm text-ink-soft">{why}</p>
      <a className="link mt-2 inline-block text-body-sm font-medium" href={url} target="_blank" rel="noreferrer">
        Open on GitHub
      </a>
    </div>
  );
}

export function ShaChip({ sha, url }: { sha: string; url: string }) {
  const [done, setDone] = useState(false);
  return (
    <span className="inline-flex h-6 shrink-0 items-center overflow-hidden rounded-label bg-fill text-body-sm text-ink-soft">
      <a href={url} target="_blank" rel="noreferrer" className="px-1.5 font-mono font-semibold hover:bg-fill-hover" title="View on GitHub">
        {sha.slice(0, 7)}
      </a>
      <button
        type="button"
        title={done ? "Copied" : "Copy full SHA"}
        aria-label="Copy full SHA"
        className="flex h-6 w-6 items-center justify-center hover:bg-fill-hover"
        onClick={async () => {
          if (await copyToClipboard(sha)) {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }
        }}
      >
        {done ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      </button>
    </span>
  );
}

export function labelStyle(color: string) {
  const hex = color.replace("#", "");
  const n = parseInt(hex.length === 6 ? hex : "8590a2", 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return { background: `#${hex}`, color: lum > 0.6 ? "#172B4D" : "#FFFFFF" };
}

export function Labels({ labels }: { labels: { name: string; color: string }[] }) {
  if (!labels.length) return null;
  return (
    <>
      {labels.map((l) => {
        const s = labelStyle(l.color);
        return (
          <Badge key={l.name} bg={s.background} fg={s.color}>
            {l.name}
          </Badge>
        );
      })}
    </>
  );
}

export const compact = (n: number) => Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Ruby: "#701516",
  PHP: "#4F5D95",
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  HTML: "#e34c26",
  CSS: "#663399",
  SCSS: "#c6538c",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  Jupyter: "#DA5B0B",
  "Jupyter Notebook": "#DA5B0B",
  Elixir: "#6e4a7e",
  Scala: "#c22d40",
  Lua: "#000080",
  Objective: "#438eff",
  MDX: "#fcb32c",
  Astro: "#ff5a03",
};
export const languageColor = (name: string) => LANGUAGE_COLORS[name] ?? "#8590a2";
