"use client";

import { useState } from "react";
import { Button, Textarea } from "@/components/ui";

/** Trello description: a filled block that turns into a textarea with Save / Cancel. Esc cancels, Cmd/Ctrl+Enter saves. */
export function DescriptionEditor({ value, onSave }: { value: string; onSave: (next: string) => Promise<unknown> | unknown }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);

  function start() {
    setDraft(value);
    setEditing(true);
  }
  async function save() {
    const next = draft.trim();
    if (next === value.trim()) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onSave(next);
    } finally {
      setBusy(false);
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={start}
        aria-label={value ? "Edit board description" : "Add a board description"}
        className="block min-h-14 w-full whitespace-pre-wrap break-words rounded-control bg-fill px-3 py-2 text-left text-body text-ink transition-colors hover:bg-fill-hover"
      >
        {value || <span className="text-ink-soft">Add a more detailed description…</span>}
      </button>
    );
  }

  return (
    <div>
      <Textarea
        data-autofocus
        aria-label="Board description"
        value={draft}
        rows={5}
        placeholder="What is this project about?"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            setEditing(false);
          } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void save();
          }
        }}
      />
      <div className="mt-2 flex items-center gap-1">
        <Button loading={busy} onClick={() => void save()}>
          Save
        </Button>
        <Button variant="subtle" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
