"use client";

import { useState } from "react";
import { Button, Field, Input, PopoverFooter } from "@/components/ui";
import { splitChecklistText } from "./meta";

/** Checklist popover (quick add): Enter adds an item and keeps the field open for the next one. */
export function ChecklistQuickAdd({ count, onAdd }: { count: number; onAdd: (texts: string[]) => void }) {
  const [text, setText] = useState("");
  const [added, setAdded] = useState(0);

  function submit() {
    const items = splitChecklistText(text);
    if (!items.length) return;
    onAdd(items);
    setAdded((a) => a + items.length);
    setText("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <p className="mb-3 text-body-sm text-ink-soft">Break this card into steps. Press Enter to add an item and keep going.</p>
      <Field label="Item">
        <Input size="sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add an item" autoComplete="off" />
      </Field>
      <PopoverFooter>
        <Button type="submit" disabled={!text.trim()}>
          Add
        </Button>
      </PopoverFooter>
      {added > 0 ? (
        <p role="status" className="mt-2 text-body-sm text-success-text">
          Added {added} {added === 1 ? "item" : "items"}. The checklist now has {count}.
        </p>
      ) : null}
    </form>
  );
}

/** Anchored destructive confirm (Trello tier 1): one sentence of consequence, one red verb button. */
export function DeleteChecklistConfirm({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div>
      <p className="text-body text-ink-soft">Deleting a checklist is permanent and there is no way to get it back.</p>
      <Button variant="danger" fullWidth className="mt-3" onClick={onConfirm}>
        Delete checklist
      </Button>
    </div>
  );
}
