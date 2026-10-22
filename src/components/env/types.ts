import type { EnvVar } from "@/lib/types";

/** cards = stacked cards (narrow), compact = table without UPDATED, full = whole table. Measured on the page container, not the viewport. */
export type LayoutMode = "cards" | "compact" | "full";

export type SortState = { by: "key" | "updated"; dir: "asc" | "desc" };

/** Everything a row (table row or mobile card) needs. Built once in the page. */
export type EnvController = {
  /** id -> revealed value (secrets only appear here after the eye or Reveal all). */
  revealed: Readonly<Record<string, string>>;
  revealing: ReadonlySet<string>;
  selected: ReadonlySet<string>;
  highlightId: string | null;
  /** Environments other than the one being viewed (targets for Duplicate to). */
  otherEnvironments: string[];
  select: (id: string, on: boolean) => void;
  selectAll: (on: boolean) => void;
  toggleReveal: (v: EnvVar) => void;
  copyKey: (v: EnvVar) => Promise<boolean>;
  copyValue: (v: EnvVar) => Promise<boolean>;
  edit: (v: EnvVar) => void;
  remove: (v: EnvVar) => void;
  duplicate: (v: EnvVar, target: string) => void;
};

export type DraftVar = { key: string; value: string; note: string; secret: boolean };
