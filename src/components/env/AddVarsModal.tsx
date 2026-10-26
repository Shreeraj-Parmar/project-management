"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, AlertTriangle, ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/client";
import { parseEnvText } from "@/lib/dotenv";
import { Button, Checkbox, Field, IconButton, Input, Modal, SectionMessage, TagInput, Toggle } from "@/components/ui";
import { envLabel, errMessage, normalizeEnvName, normalizeKey, plural, validateKey } from "./utils";

type Row = { id: number; key: string; value: string };

export type AddVarsPayload = { items: { key: string; value: string }[]; environments: string[]; note: string; secret: boolean; tags: string[] };

let nextId = 1;
const row = (key = "", value = ""): Row => ({ id: nextId++, key, value });

/** Rows from pasted text, or null when the text is not KEY=value lines. */
function rowsFromText(text: string): Row[] | null {
  if (!text.includes("=")) return null;
  const pairs = parseEnvText(text);
  return pairs.length ? pairs.map((p) => row(normalizeKey(p.key), p.value)) : null;
}

/**
 * Add several variables at once (Vercel / Railway style): key + value rows, environment checkboxes, tags.
 * Pasting a whole .env into any key or value field splits it into one row per variable.
 * Every row is written into every checked environment.
 */
export function AddVarsModal({
  environments,
  defaultEnv,
  initialText = "",
  keysIn,
  knownTags,
  onSave,
  onClose,
}: {
  environments: string[];
  defaultEnv: string;
  /** Pasted .env text to start from (e.g. a multi-line paste into the inline add row). */
  initialText?: string;
  keysIn: (env: string) => ReadonlySet<string>;
  /** Tags already used in the project, offered as one-click suggestions. */
  knownTags: string[];
  onSave: (payload: AddVarsPayload) => Promise<void>;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => rowsFromText(initialText) ?? [row()]);
  const [envs, setEnvs] = useState<string[]>([defaultEnv]);
  const [allEnvs, setAllEnvs] = useState<string[]>(environments);
  const [newEnv, setNewEnv] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [secret, setSecret] = useState(true);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filled = rows.filter((r) => r.key);
  const keyCounts = useMemo(() => {
    const c = new Map<string, number>();
    rows.forEach((r) => r.key && c.set(r.key, (c.get(r.key) ?? 0) + 1));
    return c;
  }, [rows]);
  const rowError = (r: Row): string | null => {
    if (!r.key) return submitted && r.value ? "Enter a key." : null;
    return validateKey(r.key) ?? ((keyCounts.get(r.key) ?? 0) > 1 ? "This key is listed twice." : null);
  };
  const hasRowErrors = rows.some((r) => rowError(r));
  /** env -> keys that already exist there and would be replaced. */
  const overwrites = useMemo(
    () =>
      envs
        .map((e) => {
          const existing = keysIn(e);
          return { env: e, keys: filled.filter((r) => existing.has(r.key)).map((r) => r.key) };
        })
        .filter((o) => o.keys.length > 0),
    [envs, filled, keysIn],
  );
  const canSave = filled.length > 0 && envs.length > 0 && !hasRowErrors && !busy;
  const total = filled.length * envs.length;

  function patch(id: number, p: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, row()]);
    requestAnimationFrame(() => {
      const inputs = listRef.current?.querySelectorAll<HTMLInputElement>("input[data-key]");
      inputs?.[inputs.length - 1]?.focus();
    });
  }

  function removeRow(id: number) {
    setRows((rs) => (rs.length === 1 ? [row()] : rs.filter((r) => r.id !== id)));
  }

  /** Pasting KEY=value text (one line or a whole file) into a row replaces that row with the parsed rows. */
  function onPaste(e: React.ClipboardEvent<HTMLInputElement>, r: Row, field: "key" | "value") {
    const text = e.clipboardData.getData("text");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    // A value that just happens to contain "=" (e.g. a URL query) stays a value.
    if (field === "value" && lines.length < 2) return;
    const parsed = rowsFromText(text);
    if (!parsed) return;
    e.preventDefault();
    setRows((rs) => {
      const i = rs.findIndex((x) => x.id === r.id);
      const keep = rs.filter((x, j) => j !== i && (x.key || x.value));
      const before = keep.filter((x) => rs.indexOf(x) < i);
      const after = keep.filter((x) => rs.indexOf(x) > i);
      // Later pasted keys replace earlier rows with the same key.
      const pastedKeys = new Set(parsed.map((p) => p.key));
      return [...before.filter((x) => !pastedKeys.has(x.key)), ...parsed, ...after.filter((x) => !pastedKeys.has(x.key))];
    });
  }

  function toggleEnv(e: string, on: boolean) {
    setEnvs((cur) => (on ? [...cur, e] : cur.filter((x) => x !== e)));
  }

  function addEnvironment() {
    const name = normalizeEnvName(newEnv);
    if (!name) return;
    setAllEnvs((a) => (a.includes(name) ? a : [...a, name]));
    setEnvs((cur) => (cur.includes(name) ? cur : [...cur, name]));
    setNewEnv("");
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setSubmitted(true);
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({ items: filled.map((r) => ({ key: r.key, value: r.value })), environments: envs, note: note.trim(), secret, tags });
    } catch (err) {
      setError(errMessage(err, "Couldn't save the variables. Try again."));
      setBusy(false);
    }
  }

  const allOn = allEnvs.length > 0 && allEnvs.every((e) => envs.includes(e));
  const suggestions = knownTags.filter((t) => !tags.includes(t)).slice(0, 8);

  return (
    <Modal
      open
      onClose={onClose}
      title="Add environment variables"
      description="Paste a whole .env into any field to fill the rows. Values are encrypted before they are stored."
      size="large"
      footer={
        <>
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-vars-form" loading={busy} disabled={!canSave}>
            {total > 0 ? `Save ${plural(total, "variable")}` : "Save"}
          </Button>
        </>
      }
    >
      <form id="add-vars-form" onSubmit={submit} className="space-y-5" noValidate>
        {error ? (
          <SectionMessage appearance="error" title="Couldn't save">
            {error}
          </SectionMessage>
        ) : null}

        <fieldset>
          <legend className="t-label">Environments</legend>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-control border border-line bg-surface/60 px-3 py-2.5">
            <Checkbox
              label={<span className="font-semibold">All</span>}
              checked={allOn}
              indeterminate={!allOn && envs.length > 0}
              onCheckedChange={(on) => setEnvs(on ? allEnvs : [])}
            />
            <span aria-hidden className="h-4 w-px bg-line" />
            {allEnvs.map((e) => (
              <Checkbox key={e} label={envLabel(e)} checked={envs.includes(e)} onCheckedChange={(on) => toggleEnv(e, on)} />
            ))}
            <div className="flex items-center gap-1">
              <Input
                size="sm"
                className="w-32"
                value={newEnv}
                placeholder="New environment"
                aria-label="New environment name"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setNewEnv(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEnvironment();
                  }
                }}
              />
              <IconButton size="sm" title="Add environment" disabled={!normalizeEnvName(newEnv)} onClick={addEnvironment}>
                <Plus size={14} />
              </IconButton>
            </div>
          </div>
          {submitted && envs.length === 0 ? (
            <p role="alert" className="mt-1 flex items-start gap-1 text-body-sm text-danger-text">
              <AlertCircle size={14} className="mt-px shrink-0" aria-hidden />
              Pick at least one environment.
            </p>
          ) : envs.includes("production") ? (
            <p className="mt-1 flex items-start gap-1 text-body-sm text-warning">
              <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
              Includes production. Changes there affect your live app.
            </p>
          ) : null}
        </fieldset>

        <div>
          <div className="mb-1 grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_32px] gap-2">
            <span className="t-label mb-0">Key</span>
            <span className="t-label mb-0">Value</span>
          </div>
          <div ref={listRef} className="max-h-[320px] space-y-2 overflow-auto pr-1">
            {rows.map((r, i) => {
              const err = rowError(r);
              return (
                <div key={r.id}>
                  <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_32px] items-center gap-2">
                    <Input
                      data-key
                      data-autofocus={i === 0 ? true : undefined}
                      size="sm"
                      className="font-mono"
                      placeholder="CLIENT_KEY"
                      aria-label={`Key ${i + 1}`}
                      value={r.key}
                      invalid={!!err}
                      autoComplete="off"
                      spellCheck={false}
                      onChange={(e) => patch(r.id, { key: normalizeKey(e.target.value) })}
                      onPaste={(e) => onPaste(e, r, "key")}
                    />
                    <Input
                      size="sm"
                      className="font-mono"
                      placeholder="value"
                      aria-label={`Value ${i + 1}`}
                      value={r.value}
                      autoComplete="off"
                      spellCheck={false}
                      onChange={(e) => patch(r.id, { value: e.target.value })}
                      onPaste={(e) => onPaste(e, r, "value")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && i === rows.length - 1 && r.key) {
                          e.preventDefault();
                          addRow();
                        }
                      }}
                    />
                    <IconButton size="sm" title={`Remove row ${i + 1}`} onClick={() => removeRow(r.id)}>
                      <Trash2 size={14} />
                    </IconButton>
                  </div>
                  {err ? (
                    <p role="alert" className="mt-0.5 flex items-start gap-1 text-body-sm text-danger-text">
                      <AlertCircle size={14} className="mt-px shrink-0" aria-hidden />
                      {err}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Button type="button" variant="secondary" size="md" icon={<Plus size={16} />} onClick={addRow}>
              Add another
            </Button>
            <span className="inline-flex items-center gap-1 text-body-sm text-ink-muted">
              <ClipboardPaste size={14} aria-hidden />
              Tip: paste a .env (KEY=value per line) into a key field to create all rows at once.
            </span>
          </div>
          {overwrites.length > 0 ? (
            <p role="status" className="mt-2 flex items-start gap-1 text-body-sm text-warning">
              <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
              <span>
                Already set, will be replaced:{" "}
                {overwrites.map((o, i) => (
                  <span key={o.env}>
                    {i > 0 ? "; " : ""}
                    <strong>{o.env}</strong> <span className="font-mono">{o.keys.slice(0, 4).join(", ")}</span>
                    {o.keys.length > 4 ? ` and ${o.keys.length - 4} more` : ""}
                  </span>
                ))}
              </span>
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tags" hint="(optional)" helper="What these are for, e.g. database, auth, payments. Enter or comma adds one.">
            {(p) => (
              <div>
                <TagInput {...p} value={tags} onChange={(t) => setTags(t.map((x) => x.toLowerCase()))} max={10} placeholder="database" />
                {suggestions.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {suggestions.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTags((cur) => [...cur, t])}
                        className="inline-flex h-6 items-center gap-0.5 rounded-control border border-dashed border-border-bold/60 px-1.5 text-body-sm text-ink-soft hover:bg-fill-subtle hover:text-ink"
                      >
                        <Plus size={12} aria-hidden /> {t}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </Field>
          <Field label="Note" hint="(optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where they come from, who owns them" autoComplete="off" />
          </Field>
        </div>
        <Toggle
          label="Secret"
          description="Masked in the table until you reveal it. Applies to every row."
          checked={secret}
          onCheckedChange={setSecret}
          className={cn(busy && "opacity-60")}
        />
      </form>
    </Modal>
  );
}
