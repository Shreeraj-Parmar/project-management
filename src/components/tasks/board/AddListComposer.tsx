"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, IconButton, Input } from "@/components/ui";
import { reveal, scrollParent, useClickAway } from "./hooks";

/**
 * Trello "Add another list" tile. Collapsed it is a translucent glass button, open it becomes a list-coloured box
 * with an input. Enter adds the list and keeps the composer open for the next one.
 */
export function AddListComposer({
  open,
  onOpenChange,
  onAdd,
  first,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (title: string) => void;
  /** The board has no list yet: the tile reads "Add a list". */
  first?: boolean;
}) {
  const [title, setTitle] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useClickAway(rootRef, () => onOpenChange(false), open);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus({ preventScroll: true });
      reveal(scrollParent(rootRef.current, "x"), rootRef.current, "x");
    }
  }, [open]);

  function submit() {
    const t = title.trim();
    if (!t) return;
    onAdd(t);
    setTitle("");
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
      reveal(scrollParent(rootRef.current, "x"), rootRef.current, "x");
    });
  }

  return (
    <div ref={rootRef} className="w-[var(--w-list)] shrink-0">
      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="t-list p-2"
        >
          <Input
            ref={inputRef}
            size="sm"
            value={title}
            maxLength={60}
            aria-label="List name"
            placeholder="Enter list name"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onOpenChange(false);
              }
            }}
          />
          <div className="mt-2 flex items-center gap-1">
            <Button type="submit" disabled={!title.trim()}>
              Add list
            </Button>
            <IconButton title="Cancel" onClick={() => onOpenChange(false)}>
              <X size={16} />
            </IconButton>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="glass-panel flex h-11 w-full items-center gap-2 rounded-list bg-black/40 px-3 text-body font-medium text-white outline-offset-2 hover:bg-black/50"
        >
          <Plus size={16} aria-hidden />
          {first ? "Add a list" : "Add another list"}
        </button>
      )}
    </div>
  );
}
