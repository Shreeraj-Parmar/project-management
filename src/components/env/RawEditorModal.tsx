"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Copy, FileCode2, RotateCcw } from "lucide-react";
import { parseEnvText } from "@/lib/dotenv";
import type { EnvVar } from "@/lib/types";
import { Button, ConfirmDialog, Field, Input, Lozenge, Modal, SectionMessage, Skeleton, Textarea } from "@/components/ui";
import { cn } from "@/lib/client";
import { copyText, envLabel, envLine, errMessage, normalizeEnvName, parseEnv, plural, validateKey } from "./utils";

const NEW_ENV = "__new";

/**
 * Railway-style raw editor: the whole environment as one KEY=value text, edited freely.
 * Pick the environment at the top (or type a new one); saving only touches that environment.
 * Saving writes the difference: new keys are added (as secrets), changed values updated, missing keys deleted.
 * Notes, tags and visibility of keys that stay are untouched.
 */
export function RawEditorModal({
  environment: initialEnv,
  environments,
  loadAll,
  onSave,
  onClose,
}: {
  /** Environment selected when the editor opens. */
  environment: string;
  /** Every known environment, for the picker. */
  environments: string[];
  /** Decrypted variables of every environment. */
  loadAll: () => Promise<EnvVar[]>;
  onSave: (environment: string, set: { key: string; value: string }[], remove: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [environment, setEnvironment] = useState(initialEnv);
  const [choice, setChoice] = useState<string>(initialEnv);
  const [customName, setCustomName] = useState("");
  const [pendingEnv, setPendingEnv] = useState<string | null>(null);
  const [current, setCurrent] = useState<Map<string, string> | null>(null);
  const [initial, setInitial] = useState("");
  const [text, setText] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setCurrent(null);
    loadAll()
      .then((all) => {
        if (cancelled) return;
        const mine = all.filter((v) => v.environment === environment).sort((a, b) => a.key.localeCompare(b.key));
        const raw = mine.map((v) => envLine(v.key, v.value)).join("\n") + (mine.length ? "\n" : "");
        setCurrent(new Map(mine.map((v) => [v.key, v.value])));
        setInitial(raw);
        setText(raw);
      })
      .catch((err) => !cancelled && setLoadError(errMessage(err, "Couldn't load the variables.")));
    return () => {
      cancelled = true;
    };
  }, [environment, loadAll, attempt]);

  const diff = useMemo(() => {
    if (!current) return null;
    const pairs = parseEnvText(text);
    const next = new Map(pairs.map((p) => [p.key, p.value]));
    const added = pairs.filter((p) => !current.has(p.key));
    const changed = pairs.filter((p) => current.has(p.key) && current.get(p.key) !== p.value);
    const removed = [...current.keys()].filter((k) => !next.has(k));
    // Only new keys must follow the format, keys saved before the rule existed keep working.
    const badKeys = added.map((p) => p.key).filter((k) => validateKey(k));
    const ignored = parseEnv(text, new Set()).ignored;
    return { added, changed, removed, badKeys, ignored };
  }, [current, text]);

  const changes = diff ? diff.added.length + diff.changed.length + diff.removed.length : 0;
  const canSave = !!diff && changes > 0 && diff.badKeys.length === 0 && !busy;
  const dirty = current !== null && text !== initial;
  const isNew = !environments.includes(environment);
  const customResolved = normalizeEnvName(customName);
  const allEnvs = environments.includes(environment) ? environments : [...environments, environment];

  /** Switch the editor to another environment; unsaved edits ask first. */
  function switchTo(next: string) {
    if (next === environment) return;
    if (dirty) {
      setPendingEnv(next);
      return;
    }
    setEnvironment(next);
    setError(null);
  }

  function onPick(value: string) {
    setChoice(value);
    if (value === NEW_ENV) {
      setCustomName("");
      return;
    }
    switchTo(value);
  }

  // Typing a new environment name retargets the editor once the name is valid.
  useEffect(() => {
    if (choice !== NEW_ENV) return;
    if (!customResolved || customResolved === environment) return;
    if (dirty) return; // keep the text; the confirm below handles it on blur / enter
    setEnvironment(customResolved);
    setError(null);
  }, [choice, customResolved, dirty, environment]);

  async function submit() {
    if (!diff || !canSave) return;
    if (choice === NEW_ENV && !customResolved) {
      setError("Give the new environment a name first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(environment, [...diff.added, ...diff.changed], diff.removed);
    } catch (err) {
      setError(errMessage(err, "Couldn't save the changes. Try again."));
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Raw editor"
      description="Pick an environment, then edit its variables as plain KEY=value lines. Only that environment changes when you save."
      size="large"
      footer={
        <>
          <Button
            type="button"
            variant="subtle"
            icon={<Copy size={16} />}
            disabled={!current}
            onClick={async () => {
              setCopied(await copyText(text));
              setTimeout(() => setCopied(false), 1500);
            }}
            className="mr-auto"
          >
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" icon={<FileCode2 size={16} />} loading={busy} disabled={!canSave} onClick={submit}>
            {changes > 0 ? `Save ${plural(changes, "change")} to ${environment}` : "No changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-3 rounded-card border border-line bg-surface p-3">
          <div role="radiogroup" aria-label="Environment" className="flex flex-wrap gap-1.5">
            {allEnvs.map((e) => {
              const on = choice !== NEW_ENV && e === environment;
              return (
                <button
                  key={e}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => onPick(e)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-control border px-3 text-body font-medium transition-colors",
                    on ? "border-brand bg-brand-soft text-brand-dark" : "border-line bg-canvas text-ink-soft hover:bg-fill hover:text-ink",
                  )}
                >
                  {envLabel(e)}
                  {e === "production" ? <span className="size-1.5 rounded-full bg-danger" aria-hidden /> : null}
                </button>
              );
            })}
            <button
              type="button"
              role="radio"
              aria-checked={choice === NEW_ENV}
              onClick={() => onPick(NEW_ENV)}
              className={cn(
                "inline-flex h-8 items-center rounded-control border border-dashed px-3 text-body font-medium transition-colors",
                choice === NEW_ENV ? "border-brand bg-brand-soft text-brand-dark" : "border-border-bold/60 text-ink-soft hover:bg-fill hover:text-ink",
              )}
            >
              + Other…
            </button>
          </div>
          {choice === NEW_ENV ? (
            <Field
              label="New environment"
              className="w-full sm:w-64"
              helper={customName.trim() && customResolved !== customName.trim() ? `Saved as “${customResolved}”.` : "Lowercase letters, numbers and dashes."}
              error={customName.trim() && !customResolved ? "Use letters, numbers or dashes." : undefined}
            >
              <Input
                size="sm"
                value={customName}
                autoFocus
                onChange={(e) => setCustomName(e.target.value)}
                onBlur={() => customResolved && customResolved !== environment && switchTo(customResolved)}
                onKeyDown={(e) => e.key === "Enter" && customResolved && switchTo(customResolved)}
                placeholder="preview"
                maxLength={32}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
          ) : null}
          <p className="w-full text-body-sm text-ink-muted">
            Editing <strong className="font-semibold text-ink">{environment}</strong>
            {isNew ? " (new, created on save)" : current ? ` · ${plural(current.size, "variable")}` : ""}
            {environment === "production" ? ". Changes here affect your live environment." : "."}
          </p>
        </div>
        {error ? (
          <SectionMessage appearance="error" title="Couldn't save">
            {error}
          </SectionMessage>
        ) : null}
        {loadError ? (
          <SectionMessage appearance="error" title="Couldn't load the variables">
            {loadError}{" "}
            <Button variant="link" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </Button>
          </SectionMessage>
        ) : !current ? (
          <Skeleton className="block w-full" height={340} />
        ) : (
          <>
            <Textarea
              data-autofocus
              aria-label={`Variables in ${environment} as .env text`}
              className="min-h-[340px] resize-y font-mono text-[13px] leading-5"
              value={text}
              spellCheck={false}
              autoComplete="off"
              placeholder={"DATABASE_URL=postgres://localhost/app\nNEXT_PUBLIC_API=https://api.example.com"}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            <div className="flex flex-wrap items-center gap-2 text-body-sm text-ink-soft" aria-live="polite">
              {diff && changes === 0 ? <span>No changes yet.</span> : null}
              {diff && diff.added.length > 0 ? <Lozenge appearance="success">{diff.added.length} new</Lozenge> : null}
              {diff && diff.changed.length > 0 ? <Lozenge appearance="moved">{diff.changed.length} changed</Lozenge> : null}
              {diff && diff.removed.length > 0 ? <Lozenge appearance="removed">{diff.removed.length} deleted</Lozenge> : null}
              {diff && diff.ignored.length > 0 ? <span className="text-ink-muted">{plural(diff.ignored.length, "line")} ignored (not KEY=value)</span> : null}
              {text !== initial ? (
                <Button variant="link" icon={<RotateCcw size={14} />} onClick={() => setText(initial)} className="ml-auto">
                  Reset
                </Button>
              ) : null}
            </div>
            {diff && diff.badKeys.length > 0 ? (
              <p role="alert" className="flex items-start gap-1 text-body-sm text-danger-text">
                <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
                <span>
                  Keys must be UPPER_CASE letters, numbers and underscores: <span className="font-mono">{diff.badKeys.slice(0, 5).join(", ")}</span>
                </span>
              </p>
            ) : null}
            {diff && diff.removed.length > 0 ? (
              <p className="flex items-start gap-1 text-body-sm text-warning">
                <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
                <span>
                  Saving deletes <span className="font-mono">{diff.removed.slice(0, 5).join(", ")}</span>
                  {diff.removed.length > 5 ? ` and ${diff.removed.length - 5} more` : ""}
                  {environment === "production" ? " from production" : ""}. There is no undo.
                </span>
              </p>
            ) : null}
          </>
        )}
      </div>
      <ConfirmDialog
        open={pendingEnv !== null}
        onClose={() => {
          setPendingEnv(null);
          if (choice === NEW_ENV && !environments.includes(environment)) return;
          setChoice(environment);
        }}
        onConfirm={() => {
          if (pendingEnv !== null) {
            setEnvironment(pendingEnv);
            setError(null);
          }
          setPendingEnv(null);
        }}
        title={`Switch to ${pendingEnv ?? ""}?`}
        message={`You have unsaved edits in ${environment}. Switching environments discards them.`}
        confirmLabel="Discard and switch"
        cancelLabel="Keep editing"
      />
    </Modal>
  );
}
