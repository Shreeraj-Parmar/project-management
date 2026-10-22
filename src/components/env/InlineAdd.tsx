"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, Plus, X } from "lucide-react";
import { cn } from "@/lib/client";
import { Button, Checkbox, Field, IconButton, Input, Kbd } from "@/components/ui";
import type { DraftVar } from "./types";
import { errMessage, normalizeKey, parseEnv, parseSingleLine, validateKey } from "./utils";

const EMPTY: DraftVar = { key: "", value: "", note: "", secret: true };

/**
 * "+ Add variable" row at the bottom of the list. Collapsed it is a ghost button; open it is a row of
 * key / value / note inputs. Enter adds and keeps the row open for the next variable, Esc cancels,
 * Tab walks key, value, note, secret, Add. Pasting KEY=value fills both inputs, pasting several lines
 * hands the text to the import dialog.
 *
 * `layout="row"` renders table rows (it must sit inside a <tbody>), `layout="card"` a stacked card.
 */
export function InlineAdd({
  layout,
  colSpan,
  showUpdated,
  noteColumn,
  open,
  onOpen,
  onClose,
  environment,
  existingKeys,
  onSubmit,
  onImportText,
}: {
  layout: "row" | "card";
  /** Number of columns of the table (row layout). */
  colSpan: number;
  showUpdated: boolean;
  /** false = compact table, the note input moves under key and value. */
  noteColumn: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  environment: string;
  existingKeys: ReadonlySet<string>;
  onSubmit: (draft: DraftVar) => Promise<void>;
  onImportText: (text: string) => void;
}) {
  const [draft, setDraft] = useState<DraftVar>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) keyRef.current?.focus({ preventScroll: false });
    else {
      setDraft(EMPTY);
      setTouched(false);
      setError(null);
    }
  }, [open]);

  const keyError = validateKey(draft.key) ?? (touched && !draft.key ? "Enter a key, for example DATABASE_URL." : null);
  const duplicate = !keyError && draft.key !== "" && existingKeys.has(draft.key);

  async function submit() {
    if (busy) return;
    setTouched(true);
    if (!draft.key || validateKey(draft.key)) {
      keyRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit(draft);
      setDraft((d) => ({ ...EMPTY, secret: d.secret }));
      setTouched(false);
      keyRef.current?.focus();
    } catch (err) {
      setError(errMessage(err, "Couldn't add the variable. Try again."));
    } finally {
      setBusy(false);
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };
  /** Esc anywhere in the open row (inputs, checkbox, buttons) cancels. */
  const onEscape = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const onPasteKey = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("=")) return;
    const many = parseEnv(text, existingKeys).entries;
    if (many.length > 1) {
      e.preventDefault();
      onImportText(text);
      return;
    }
    const one = parseSingleLine(text);
    if (one) {
      e.preventDefault();
      setDraft((d) => ({ ...d, key: one.key, value: one.value }));
      requestAnimationFrame(() => noteRef.current?.focus());
    }
  };

  const keyInput = (
    <Input
      ref={keyRef}
      size="sm"
      className="font-mono"
      placeholder="KEY_NAME"
      aria-label="New variable key"
      value={draft.key}
      invalid={!!keyError}
      autoComplete="off"
      spellCheck={false}
      onChange={(e) => setDraft((d) => ({ ...d, key: normalizeKey(e.target.value) }))}
      onKeyDown={onKeyDown}
      onPaste={onPasteKey}
    />
  );
  const valueInput = (
    <Input
      ref={valueRef}
      size="sm"
      className="font-mono"
      placeholder="value"
      aria-label="New variable value"
      value={draft.value}
      autoComplete="off"
      spellCheck={false}
      onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
      onKeyDown={onKeyDown}
    />
  );
  const noteInput = (
    <Input
      ref={noteRef}
      size="sm"
      placeholder="Note (optional)"
      aria-label="New variable note"
      value={draft.note}
      autoComplete="off"
      onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
      onKeyDown={onKeyDown}
    />
  );
  const secretBox = <Checkbox label="Secret" checked={draft.secret} onCheckedChange={(secret) => setDraft((d) => ({ ...d, secret }))} />;
  const submitLabel = duplicate ? "Replace" : "Add";
  const addButton = (
    <Button
      type="button"
      variant="primary"
      loading={busy}
      onClick={() => void submit()}
      aria-label={duplicate ? "Replace existing variable" : "Add variable to list"}
    >
      {submitLabel}
    </Button>
  );
  const cancelButton = (
    <IconButton title="Cancel" onClick={onClose}>
      <X size={16} />
    </IconButton>
  );

  const messages = (
    <>
      {keyError ? (
        <p role="alert" className="flex items-start gap-1 text-body-sm text-danger-text">
          <AlertCircle size={14} className="mt-px shrink-0" aria-hidden />
          {keyError}
        </p>
      ) : null}
      {duplicate ? (
        <p role="status" className="flex items-start gap-1 text-body-sm text-warning">
          <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
          <span>
            <span className="font-mono">{draft.key}</span> already exists in {environment}. Adding it replaces the current value.
          </span>
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-start gap-1 text-body-sm text-danger-text">
          <AlertCircle size={14} className="mt-px shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </>
  );
  const hasMessages = !!(keyError || duplicate || error);

  const hint = (
    <span className="hidden text-body-sm text-ink-muted sm:inline">
      <Kbd>Enter</Kbd> adds and keeps going, <Kbd>Esc</Kbd> cancels
    </span>
  );

  if (layout === "card") {
    if (!open) {
      return (
        <button
          type="button"
          onClick={onOpen}
          className="flex h-11 w-full items-center gap-2 rounded-card border border-dashed border-border-bold/60 px-3 text-body font-medium text-ink-soft hover:bg-fill-subtle hover:text-ink"
        >
          <Plus size={16} aria-hidden /> Add variable
        </button>
      );
    }
    return (
      <div role="group" aria-label="Add a variable" onKeyDown={onEscape} className="space-y-3 rounded-card border border-brand/60 bg-brand-soft/40 p-3">
        <Field label="Key">{keyInput}</Field>
        <Field label="Value">{valueInput}</Field>
        <Field label="Note" hint="(optional)">
          {noteInput}
        </Field>
        {secretBox}
        {hasMessages ? <div className="space-y-1">{messages}</div> : null}
        <div className="flex items-center gap-2">
          {addButton}
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <tr className="border-t border-line">
        <td colSpan={colSpan} className="p-0">
          <button
            type="button"
            onClick={onOpen}
            className="flex h-11 w-full items-center gap-2 px-4 text-left text-body font-medium text-ink-soft outline-offset-[-2px] hover:bg-fill-subtle hover:text-ink"
          >
            <Plus size={16} aria-hidden /> Add variable
          </button>
        </td>
      </tr>
    );
  }

  if (!noteColumn) {
    // Compact table (no NOTE column): key, value and the buttons share the first row, the note sits underneath.
    return (
      <>
        <tr onKeyDown={onEscape} className="border-t border-line bg-brand-soft/40 align-top">
          <td />
          <td className="px-3 pb-1 pt-3">{keyInput}</td>
          <td className="px-3 pb-1 pt-3">{valueInput}</td>
          <td className="px-2 pb-1 pt-3">
            <div className="flex items-center justify-end gap-1">
              {addButton}
              {cancelButton}
            </div>
          </td>
        </tr>
        <tr onKeyDown={onEscape} className="bg-brand-soft/40">
          <td />
          <td colSpan={colSpan - 1} className="px-3 pb-3 pt-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="min-w-[200px] flex-1">{noteInput}</div>
              {secretBox}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 empty:hidden">
              {hint}
              {hasMessages ? <div className="w-full min-w-0 space-y-1">{messages}</div> : null}
            </div>
          </td>
        </tr>
      </>
    );
  }

  return (
    <>
      <tr onKeyDown={onEscape} className="border-t border-line bg-brand-soft/40 align-top">
        <td />
        <td className="px-3 pb-1 pt-3">{keyInput}</td>
        <td className="px-3 pb-1 pt-3">{valueInput}</td>
        <td className="px-3 pb-1 pt-3">{noteInput}</td>
        {showUpdated ? <td /> : null}
        <td className="px-2 pb-1 pt-3">
          <div className="flex items-center justify-end gap-1">
            {addButton}
            {cancelButton}
          </div>
        </td>
      </tr>
      <tr onKeyDown={onEscape} className="bg-brand-soft/40">
        <td />
        <td colSpan={colSpan - 1} className="px-3 pb-3 pt-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {secretBox}
            {hint}
            <div className={cn("min-w-0", hasMessages && "w-full space-y-1")}>{messages}</div>
          </div>
        </td>
      </tr>
    </>
  );
}
