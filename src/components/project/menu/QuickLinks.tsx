"use client";

import { useState } from "react";
import { ExternalLink, Pencil, Plus, X } from "lucide-react";
import { Button, Field, IconButton, Input } from "@/components/ui";
import type { ProjectDetail } from "@/lib/types";
import { useProject } from "../ProjectContext";
import { useBoardActions } from "../useBoardActions";
import { displayUrl, hostLabel, normalizeUrl, safeHref } from "./links";

type Link = ProjectDetail["links"][number];

function LinkForm({ initial, onSubmit, onCancel }: { initial?: Link; onSubmit: (link: Link) => void; onCancel: () => void }) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError(url.trim() ? "Enter a valid web address, like https://example.com." : "Link URL is required.");
      return;
    }
    onSubmit({ label: label.trim() || hostLabel(normalized), url: normalized });
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }
      }}
      className="space-y-3 rounded-card bg-surface p-3"
    >
      <Field label="Link name" hint="(optional)">
        <Input size="sm" value={label} maxLength={60} placeholder="Production" onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <Field label="URL" required error={error ?? undefined}>
        <Input
          size="sm"
          data-autofocus
          autoFocus
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={url}
          placeholder="https://app.example.com"
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
        />
      </Field>
      <div className="flex items-center gap-1">
        <Button type="submit">{initial ? "Save link" : "Add link"}</Button>
        <Button type="button" variant="subtle" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

/** Quick links of the board: open in a new tab, edit, remove (with Undo) and add. */
export function QuickLinks() {
  const { project } = useProject();
  const { setLinks, removeLink } = useBoardActions();
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const links = project.links;

  return (
    <div>
      {links.length === 0 && editing !== "new" ? <p className="mb-2 text-body text-ink-soft">Production, staging, docs, dashboards. Keep the links you open most often one click away.</p> : null}

      <ul className="-mx-1 space-y-0.5">
        {links.map((l, i) => {
          if (editing === i) {
            return (
              <li key={`${l.url}-${i}`} className="px-1 py-1">
                <LinkForm
                  initial={l}
                  onCancel={() => setEditing(null)}
                  onSubmit={(next) => {
                    setEditing(null);
                    void setLinks(links.map((x, j) => (j === i ? next : x)));
                  }}
                />
              </li>
            );
          }
          const href = safeHref(l.url);
          const body = (
            <>
              <span className="block truncate text-body font-medium text-ink">{l.label || displayUrl(l.url)}</span>
              <span className="block truncate text-body-sm text-ink-muted">{displayUrl(l.url)}</span>
            </>
          );
          return (
            <li key={`${l.url}-${i}`} className="group flex items-center gap-1 rounded-control pl-2 hover:bg-fill-subtle focus-within:bg-fill-subtle">
              <ExternalLink size={16} className="shrink-0 text-ink-soft" aria-hidden />
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 rounded-control px-1 py-1.5" title={l.url}>
                  {body}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <span className="min-w-0 flex-1 px-1 py-1.5" title={l.url}>
                  {body}
                </span>
              )}
              <span className="flex shrink-0 items-center opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <IconButton size="sm" title={`Edit link ${l.label}`} onClick={() => setEditing(i)}>
                  <Pencil size={14} aria-hidden />
                </IconButton>
                <IconButton size="sm" title={`Remove link ${l.label}`} onClick={() => void removeLink(i)}>
                  <X size={14} aria-hidden />
                </IconButton>
              </span>
            </li>
          );
        })}
      </ul>

      {editing === "new" ? (
        <div className="mt-2">
          <LinkForm
            onCancel={() => setEditing(null)}
            onSubmit={(next) => {
              setEditing(null);
              void setLinks([...links, next]);
            }}
          />
        </div>
      ) : (
        <Button variant="secondary" fullWidth alignStart className="mt-2" icon={<Plus size={16} aria-hidden />} onClick={() => setEditing("new")}>
          Add a link
        </Button>
      )}
    </div>
  );
}
