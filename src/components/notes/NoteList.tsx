"use client";

import { Pin, StickyNote } from "lucide-react";
import { cn, relativeTime } from "@/lib/client";
import type { Note } from "@/lib/types";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { MODULES } from "@/lib/constants";
import { snippet } from "./markdown";

const MOD = MODULES.find((m) => m.id === "notes")!;

/** Pinned first, then most recently edited. */
export function sortNotes(notes: Note[]): Note[] {
  return notes.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function NoteCard({ n, selected, onSelect }: { n: Note; selected: boolean; onSelect: () => void }) {
  const text = snippet(n.content);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn("t-card relative flex w-full overflow-hidden text-left", selected && "!bg-brand-soft ring-2 ring-brand")}
      >
        <span aria-hidden className="w-1.5 shrink-0 border-r border-black/10" style={{ background: n.color }} />
        <span className="min-w-0 flex-1 px-3 py-2">
          <span className="flex items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-body font-semibold text-ink">{n.title || "Untitled note"}</span>
            {n.pinned ? <Pin size={12} className="shrink-0 text-ink-soft" fill="currentColor" aria-label="Pinned" /> : null}
          </span>
          <span className="mt-0.5 line-clamp-2 text-body-sm text-ink-soft">{text || <span className="text-ink-muted">Empty note</span>}</span>
          <span className="mt-1 block text-micro text-ink-muted">{relativeTime(n.updatedAt)}</span>
        </span>
      </button>
    </li>
  );
}

export function NoteList({ notes, selected, onSelect, query }: { notes: Note[]; selected: string | null; onSelect: (id: string) => void; query: string }) {
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);
  const groups = pinned.length && rest.length ? [["Pinned", pinned], ["Notes", rest]] as const : ([["", notes]] as const);
  return (
    <div className="space-y-3">
      {groups.map(([label, items]) => (
        <div key={label || "all"}>
          {label ? <h2 className="mb-1.5 px-1 text-h-xxs font-semibold uppercase text-ink-muted">{label}</h2> : null}
          <ul className="space-y-2">
            {items.map((n) => (
              <NoteCard key={n._id} n={n} selected={selected === n._id} onSelect={() => onSelect(n._id)} />
            ))}
          </ul>
        </div>
      ))}
      {notes.length === 0 && query ? <p className="px-1 py-6 text-center text-body text-ink-muted">No notes match &ldquo;{query}&rdquo;.</p> : null}
    </div>
  );
}

export function NotesSkeleton() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]" aria-busy="true" aria-label="Loading notes">
      <div className="space-y-2">
        <Skeleton height={32} className="!block w-full" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} height={76} className="!block w-full !rounded-card" />
        ))}
      </div>
      <Skeleton height={420} className="!block hidden w-full !rounded-card lg:!block" />
    </div>
  );
}

export function NotesEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-card border border-dashed border-border-bold/50 bg-surface/60">
      <EmptyState
        icon={<StickyNote size={28} />}
        color={MOD.color}
        title="No notes yet"
        description="Write down decisions, ideas, meeting logs and snippets in markdown."
        action={<Button onClick={onCreate}>New note</Button>}
      />
    </div>
  );
}

export function NoSelection() {
  return (
    <div className="hidden h-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-border-bold/50 bg-surface/60 p-6 text-center lg:flex">
      <StickyNote size={28} className="text-ink-muted" />
      <p className="text-body font-medium text-ink">Select a note to view or edit</p>
      <p className="text-body-sm text-ink-muted">Pick one from the list, or start a new one.</p>
    </div>
  );
}
