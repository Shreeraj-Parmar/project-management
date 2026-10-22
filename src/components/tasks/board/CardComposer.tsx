"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button, IconButton } from "@/components/ui";
import { autoGrow, reveal, scrollParent, splitTitles, useClickAway } from "./hooks";

/**
 * Trello add-card composer. Replaces the "Add a card" button in place.
 * Enter adds and keeps the composer open and focused. Shift+Enter inserts a line break (each line becomes its own card on add).
 * Pasting several lines adds one card per line right away. Esc, X and click-away close it; the typed text is kept as a draft.
 */
export function CardComposer({
  initialText = "",
  onSubmit,
  onClose,
  onDraft,
}: {
  initialText?: string;
  /** Receives one title per card. Resolves once the cards exist so the list can scroll to them. */
  onSubmit: (titles: string[], opts: { pasted: boolean }) => void | Promise<unknown>;
  onClose: () => void;
  /** Called with the current text when the composer closes (kept as an in-memory draft). */
  onDraft?: (text: string) => void;
}) {
  const [text, setText] = useState(initialText);
  const rootRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(text);
  textRef.current = text;

  const close = () => {
    onDraft?.(textRef.current);
    onClose();
  };
  useClickAway(rootRef, close);

  useLayoutEffect(() => {
    autoGrow(areaRef.current);
  }, [text]);

  useEffect(() => {
    const el = areaRef.current;
    el?.focus({ preventScroll: true });
    if (el) el.setSelectionRange(el.value.length, el.value.length);
    reveal(scrollParent(rootRef.current), rootRef.current);
  }, []);

  const titles = splitTitles(text);
  const rawLines = text.split(/\r?\n/).filter((l) => l.trim()).length;

  function submit() {
    if (!titles.length) return;
    void onSubmit(titles, { pasted: false });
    setText("");
    requestAnimationFrame(() => {
      areaRef.current?.focus({ preventScroll: true });
      reveal(scrollParent(rootRef.current), rootRef.current);
    });
  }

  return (
    <div ref={rootRef} className="px-2 pb-2 pt-1">
      <div className="t-card t-card--static px-3 pb-1 pt-2 focus-within:ring-2 focus-within:ring-focus">
        <textarea
          ref={areaRef}
          value={text}
          rows={1}
          maxLength={2000}
          aria-label="Card title"
          placeholder="Enter a title for this card..."
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (!/\r?\n/.test(pasted.trim())) return;
            const lines = splitTitles(pasted);
            if (lines.length < 2) return;
            e.preventDefault();
            void onSubmit(lines, { pasted: true });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              close();
            }
          }}
          className="block min-h-[54px] w-full resize-none border-0 bg-transparent p-0 text-body text-ink outline-none placeholder:text-ink-muted"
        />
      </div>
      {titles.length > 1 ? (
        <p aria-live="polite" className="mt-1 text-body-sm text-ink-muted">
          {rawLines > titles.length
            ? `Only the first ${titles.length} lines will be added, as ${titles.length} cards.`
            : `${titles.length} lines will be added as ${titles.length} cards.`}
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-1">
        <Button type="button" onClick={submit} disabled={!titles.length}>
          Add card
        </Button>
        <IconButton title="Cancel" onClick={close}>
          <X size={16} />
        </IconButton>
      </div>
    </div>
  );
}
