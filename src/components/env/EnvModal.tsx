"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, Field, Input, Modal, SectionMessage, TagInput, Textarea, Toggle } from "@/components/ui";
import type { EnvVar } from "@/lib/types";
import { EnvChoiceFields, useEnvChoice } from "./EnvChoice";
import { errMessage, normalizeKey, validateKey } from "./utils";

export type SavePayload = { environment: string; key: string; value?: string; note: string; secret: boolean; tags: string[] };

/**
 * Add or edit one variable in a dialog (long values, moving to another environment, visibility).
 * The current value is fetched when editing; Save is blocked until it arrived so a slow request can never wipe it.
 */
export function EnvModal({
  item,
  environments,
  defaultEnv,
  keysByEnv,
  loadValue,
  onSave,
  onClose,
}: {
  item: EnvVar | null;
  environments: string[];
  defaultEnv: string;
  /** environment -> variable id by key, to spot duplicates. */
  keysByEnv: (env: string) => ReadonlyMap<string, string>;
  loadValue: (id: string) => Promise<string>;
  onSave: (payload: SavePayload, item: EnvVar | null) => Promise<void>;
  onClose: () => void;
}) {
  const editing = !!item;
  const [key, setKey] = useState(item?.key ?? "");
  const [value, setValue] = useState(item && !item.secret ? item.value : "");
  const [valueState, setValueState] = useState<"loading" | "ready" | "failed">(editing ? "loading" : "ready");
  const [valueTouched, setValueTouched] = useState(false);
  const [note, setNote] = useState(item?.note ?? "");
  const [secret, setSecret] = useState(item?.secret ?? true);
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);
  const env = useEnvChoice(item?.environment ?? defaultEnv);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!item) return;
    let cancelled = false;
    setValueState("loading");
    loadValue(item._id)
      .then((v) => {
        if (cancelled) return;
        setValue((cur) => (cur === "" ? v : cur));
        setValueState("ready");
      })
      .catch(() => !cancelled && setValueState("failed"));
    return () => {
      cancelled = true;
    };
  }, [item, loadValue, attempt]);

  const target = env.resolved;
  const keyFormat = validateKey(key);
  // Grandfather keys saved before the format rule existed: only complain when the key is changed.
  const keyFormatError = keyFormat && !(editing && key === item?.key) ? keyFormat : null;
  const clash = key && target ? keysByEnv(target).get(key) : undefined;
  const duplicate = !!clash && clash !== item?._id;
  const requiredError = submitted && !key ? "Enter a key, for example DATABASE_URL." : null;
  const keyError =
    keyFormatError ?? requiredError ?? (duplicate && editing ? `${key} already exists in ${target}. Choose another key or edit that variable.` : null);
  const canSave = !!key && !keyFormatError && !(duplicate && editing) && !!target && valueState !== "loading";

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setSubmitted(true);
    if (!canSave || busy) return;
    setBusy(true);
    setError(null);
    try {
      const payload: SavePayload = { environment: target, key: key.trim(), note, secret, tags };
      if (!editing || valueState === "ready" || valueTouched) payload.value = value;
      await onSave(payload, item);
    } catch (err) {
      setError(errMessage(err, "Couldn't save the variable. Try again."));
      setBusy(false);
    }
  }

  const title = editing ? "Edit variable" : "Add variable";
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={editing ? <span className="font-mono text-body-sm">{item.key}</span> : "Values are encrypted before they are stored."}
      footer={
        <>
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="env-form" loading={busy} disabled={!canSave}>
            {editing ? "Save changes" : "Add variable"}
          </Button>
        </>
      }
    >
      <form id="env-form" onSubmit={submit} className="space-y-4" noValidate>
        {error ? (
          <SectionMessage appearance="error" title="Couldn't save">
            {error}
          </SectionMessage>
        ) : null}
        <EnvChoiceFields environments={environments} state={env} />
        {target === "production" ? (
          <p className="-mt-2 flex items-start gap-1 text-body-sm text-warning">
            <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
            Production. Changes here affect your live app.
          </p>
        ) : null}
        <Field
          label="Key"
          required
          error={keyError}
          helper={
            !keyError && duplicate ? (
              <span className="inline-flex items-start gap-1 text-warning">
                <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
                <span>
                  <span className="font-mono">{key}</span> already exists in {target}. Saving replaces its value.
                </span>
              </span>
            ) : (
              "Letters, numbers and underscores. Converted to UPPER_CASE."
            )
          }
        >
          <Input
            data-autofocus
            className="font-mono"
            value={key}
            placeholder="DATABASE_URL"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setKey(normalizeKey(e.target.value))}
          />
        </Field>
        <Field
          label="Value"
          error={valueState === "failed" ? "Couldn't load the current value. It stays unchanged unless you type a new one." : undefined}
          helper={valueState === "failed" ? undefined : "Long or multi-line values are fine."}
        >
          <Textarea
            className="min-h-[96px] font-mono text-[13px]"
            value={value}
            placeholder={
              valueState === "loading" ? "Loading value…" : valueState === "failed" ? "Type a new value, or leave empty to keep the current one" : "value"
            }
            disabled={valueState === "loading"}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setValue(e.target.value);
              setValueTouched(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void submit();
              }
            }}
          />
        </Field>
        {valueState === "failed" ? (
          <Button type="button" variant="link" onClick={() => setAttempt((n) => n + 1)} className="-mt-2">
            Try loading the value again
          </Button>
        ) : null}
        <Field label="Note" hint="(optional)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where it comes from, who owns it" autoComplete="off" />
        </Field>
        <Field label="Tags" hint="(optional)" helper="What it is for, e.g. database, auth, payments.">
          {(p) => <TagInput {...p} value={tags} onChange={(t) => setTags(t.map((x) => x.toLowerCase()))} max={10} placeholder="database" />}
        </Field>
        <Toggle label="Secret" description="Masked in the table until you reveal it." checked={secret} onCheckedChange={setSecret} />
      </form>
    </Modal>
  );
}
