"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/client";
import { Button } from "./Button";

type Tag = "div" | "h1" | "h2" | "h3" | "span";

/**
 * Click-to-edit text for board, list and card titles (Trello behaviour).
 * - Click / Enter / F2 on the display enters edit mode and selects the text.
 * - Enter saves (single line, or `multiline` + submitOn="enter"). Cmd/Ctrl+Enter saves multi-line fields.
 * - Esc cancels (and does not close an enclosing modal). Blur saves unless `saveOnBlur={false}`.
 * - Empty or unchanged text silently reverts. `onSave` receives the trimmed string.
 *
 *   <InlineEdit value={list.title} onSave={rename} label="List title" textClassName="text-h-xs font-semibold" />
 */
export function InlineEdit({
  value,
  onSave,
  label = "Title",
  placeholder = "Add a title",
  multiline = false,
  submitOn,
  saveOnBlur,
  allowEmpty = false,
  readOnly = false,
  maxLength,
  as: As = "div",
  onBoard = false,
  className,
  textClassName,
  editorClassName,
  rows = 1,
  truncate = false,
  showActions,
  editing: editingProp,
  onEditingChange,
}: {
  value: string;
  onSave: (next: string) => void | Promise<void>;
  /** Accessible name of the field. */
  label?: string;
  placeholder?: string;
  /** Textarea (auto-grows) instead of an input. */
  multiline?: boolean;
  /** Which key saves. Default: "enter" for single line, "mod-enter" for multiline. */
  submitOn?: "enter" | "mod-enter";
  /** Default true for single-line, false for multiline (which then shows Save / Cancel buttons). */
  saveOnBlur?: boolean;
  allowEmpty?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  /** Wrapper element, e.g. "h1" for a board name. */
  as?: Tag;
  /** White text + translucent hover for use on a board gradient. */
  onBoard?: boolean;
  className?: string;
  /** Typography applied to both display and editor, e.g. "text-h-s font-semibold". */
  textClassName?: string;
  editorClassName?: string;
  rows?: number;
  /** Single-line ellipsis in display mode (board header titles). */
  truncate?: boolean;
  showActions?: boolean;
  editing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}) {
  const [innerEditing, setInnerEditing] = useState(false);
  const controlled = editingProp !== undefined;
  const editing = controlled ? !!editingProp : innerEditing;
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const finished = useRef(false);
  const submit = submitOn ?? (multiline ? "mod-enter" : "enter");
  const blurSaves = saveOnBlur ?? !multiline;
  const actions = showActions ?? (multiline && !blurSaves);

  const setEditing = (v: boolean) => {
    if (!controlled) setInnerEditing(v);
    onEditingChange?.(v);
  };

  useEffect(() => {
    if (editing) {
      finished.current = false;
      setDraft(value);
      requestAnimationFrame(() => {
        ref.current?.focus();
        ref.current?.select();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (editing && multiline && el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [draft, editing, multiline]);

  function commit() {
    if (finished.current) return;
    finished.current = true;
    const next = multiline && submit === "enter" ? draft.replace(/\s*\n\s*/g, " ").trim() : draft.trim();
    setEditing(false);
    if ((!allowEmpty && !next) || next === value.trim()) return;
    void onSave(next);
  }
  function cancel() {
    finished.current = true;
    setEditing(false);
  }

  if (!editing) {
    return (
      <As className={cn("min-w-0", className)}>
        <button
          type="button"
          disabled={readOnly}
          onClick={() => setEditing(true)}
          onKeyDown={(e) => {
            if (e.key === "F2") {
              e.preventDefault();
              setEditing(true);
            }
          }}
          aria-label={`${label}: ${value || "empty"}. Click to edit`}
          title={readOnly ? undefined : "Click to edit"}
          className={cn(
            "-mx-2 block w-[calc(100%+1rem)] max-w-none cursor-text rounded-control px-2 py-1 text-left transition-colors disabled:cursor-default",
            onBoard ? "text-white hover:bg-on-board-ghost-hover disabled:hover:bg-transparent" : "text-ink hover:bg-fill disabled:hover:bg-transparent",
            textClassName
          )}
        >
          <span className={cn(truncate ? "block truncate" : "block break-words", !value && (onBoard ? "text-white/80" : "text-ink-muted"))}>{value || placeholder}</span>
        </button>
      </As>
    );
  }

  const common = {
    ref,
    value: draft,
    maxLength,
    placeholder,
    "aria-label": label,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: () => {
      if (blurSaves) commit();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancel();
      } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        const mod = e.metaKey || e.ctrlKey;
        if ((submit === "enter" && !e.shiftKey) || (submit === "mod-enter" && mod)) {
          e.preventDefault();
          commit();
        } else if (!multiline) {
          e.preventDefault();
        }
      }
    },
    className: cn(
      "-mx-2 block w-[calc(100%+1rem)] max-w-none rounded-control border-0 bg-white px-2 py-1 text-ink shadow-[0_0_0_2px_var(--color-focus)] outline-none placeholder:text-ink-muted",
      multiline && "resize-none overflow-hidden",
      textClassName,
      editorClassName
    ),
  };

  return (
    <As className={cn("min-w-0", className)}>
      {multiline ? <textarea {...common} rows={rows} /> : <input {...common} type="text" />}
      {actions ? (
        <div className="mt-2 flex items-center gap-1">
          <Button size="md" onMouseDown={(e) => e.preventDefault()} onClick={commit}>
            Save
          </Button>
          <Button size="md" variant="subtle" onMouseDown={(e) => e.preventDefault()} onClick={cancel}>
            Cancel
          </Button>
        </div>
      ) : null}
    </As>
  );
}
