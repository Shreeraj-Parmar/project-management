"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Copy, FileCode2, RotateCcw } from "lucide-react";
import { parseEnvText } from "@/lib/dotenv";
import type { EnvVar } from "@/lib/types";
import { Button, Lozenge, Modal, SectionMessage, Skeleton, Textarea } from "@/components/ui";
import { copyText, envLine, errMessage, parseEnv, plural, validateKey } from "./utils";

/**
 * Railway-style raw editor: the whole environment as one KEY=value text, edited freely.
 * Saving writes the difference: new keys are added (as secrets), changed values updated, missing keys deleted.
 * Notes, tags and visibility of keys that stay are untouched.
 */
export function RawEditorModal({
  environment,
  loadAll,
  onSave,
  onClose,
}: {
  environment: string;
  /** Decrypted variables of this environment. */
  loadAll: () => Promise<EnvVar[]>;
  onSave: (set: { key: string; value: string }[], remove: string[]) => Promise<void>;
  onClose: () => void;
}) {
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

  async function submit() {
    if (!diff || !canSave) return;
    setBusy(true);
    setError(null);
    try {
      await onSave([...diff.added, ...diff.changed], diff.removed);
    } catch (err) {
      setError(errMessage(err, "Couldn't save the changes. Try again."));
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Raw editor · ${environment}`}
      description="Edit every variable as plain KEY=value lines. Delete a line to remove that variable."
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
            {changes > 0 ? `Save ${plural(changes, "change")}` : "No changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
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
    </Modal>
  );
}
