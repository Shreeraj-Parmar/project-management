"use client";

import { useEffect, useRef, useState } from "react";
import { CheckSquare, Trash2 } from "lucide-react";
import type { ChecklistItem } from "@/lib/types";
import { uid } from "@/lib/client";
import { Button, Checkbox, IconButton, InlineEdit, ProgressBar, useToast } from "@/components/ui";
import { Section } from "./Section";
import { splitChecklistText } from "./meta";
import { triggerProps, type PopApi } from "./types";

/** "Add an item" composer: Enter adds (one item per pasted line) and stays open, Esc or Cancel closes. */
function ItemComposer({ onAdd, onClose }: { onAdd: (texts: string[]) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: false });
  }, []);

  function submit() {
    const items = splitChecklistText(text);
    if (!items.length) return;
    onAdd(items);
    setText("");
    ref.current?.focus();
  }

  return (
    <div>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          } else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        aria-label="New checklist item"
        placeholder="Add an item"
        rows={2}
        className="t-input resize-none"
      />
      <div className="mt-2 flex items-center gap-2">
        <Button onClick={submit} disabled={!text.trim()}>
          Add
        </Button>
        <Button variant="subtle" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/**
 * Checklist: percentage + progress bar, items (checkbox, click-to-edit text, delete), "Hide checked items",
 * delete checklist (anchored confirm) and the "Add an item" composer.
 */
export function ChecklistSection({ items, onChange, pop }: { items: ChecklistItem[]; onChange: (next: ChecklistItem[]) => void; pop: PopApi }) {
  const { toast } = useToast();
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [hideChecked, setHideChecked] = useState(false);
  const [adding, setAdding] = useState(false);

  const done = items.filter((i) => i.done).length;
  const visible = hideChecked ? items.filter((i) => !i.done) : items;

  function update(id: string, patch: Partial<ChecklistItem>) {
    onChange(itemsRef.current.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function remove(id: string) {
    const list = itemsRef.current;
    const index = list.findIndex((i) => i.id === id);
    if (index < 0) return;
    const removed = list[index];
    onChange(list.filter((i) => i.id !== id));
    toast("Checklist item deleted.", "info", {
      action: {
        label: "Undo",
        onClick: () => {
          const cur = itemsRef.current;
          if (cur.some((i) => i.id === removed.id)) return;
          const next = cur.slice();
          next.splice(Math.min(index, next.length), 0, removed);
          onChange(next);
        },
      },
    });
  }

  function add(texts: string[]) {
    onChange([...itemsRef.current, ...texts.map((text) => ({ id: uid(), text, done: false }))]);
  }

  return (
    <Section
      icon={<CheckSquare size={20} />}
      title="Checklist"
      actions={
        <>
          {done > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => setHideChecked((v) => !v)} aria-pressed={hideChecked}>
              {hideChecked ? `Show checked items (${done})` : "Hide checked items"}
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" {...triggerProps(pop, "deleteChecklist", "checklist")}>
            Delete
          </Button>
        </>
      }
    >
      <ProgressBar value={done} max={items.length} showValue label={`Checklist progress: ${done} of ${items.length} done`} className="mb-2" />

      {hideChecked && visible.length === 0 ? <p className="mb-2 px-1 py-2 text-body text-ink-soft">Everything in this checklist is complete!</p> : null}

      <ul className="-mx-1">
        {visible.map((item) => (
          <li key={item.id} className="group flex items-start gap-2 rounded-card px-1 py-0.5 hover:bg-fill-subtle focus-within:bg-fill-subtle">
            <div className="pt-1.5 pl-1">
              <Checkbox checked={item.done} onCheckedChange={(v) => update(item.id, { done: v })} aria-label={item.text} />
            </div>
            <InlineEdit
              className={item.done ? "min-w-0 flex-1 opacity-75" : "min-w-0 flex-1"}
              value={item.text}
              label="Checklist item"
              multiline
              submitOn="enter"
              saveOnBlur
              showActions={false}
              maxLength={512}
              textClassName={item.done ? "text-body line-through" : "text-body"}
              onSave={(t) => update(item.id, { text: t })}
            />
            <IconButton
              size="sm"
              title="Delete item"
              aria-label={`Delete item: ${item.text}`}
              onClick={() => remove(item.id)}
              className="mt-1 shrink-0 opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
            >
              <Trash2 size={14} aria-hidden />
            </IconButton>
          </li>
        ))}
      </ul>

      <div className="mt-2">
        {adding ? (
          <ItemComposer onAdd={add} onClose={() => setAdding(false)} />
        ) : (
          <Button variant="secondary" onClick={() => setAdding(true)}>
            Add an item
          </Button>
        )}
      </div>
    </Section>
  );
}
