"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { api, relativeTime } from "@/lib/client";
import { PASSWORD_CATEGORIES } from "@/lib/constants";
import type { PasswordItem } from "@/lib/types";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { PasswordGenerator } from "./PasswordGenerator";
import { StrengthMeter } from "./StrengthMeter";
import { urlHint } from "./password-utils";

type SecretState = "loading" | "ready" | "error";

/** Stops browsers and password managers from filling these fields with the DevBoard login. */
const NO_AUTOFILL = {
  autoComplete: "off",
  autoCapitalize: "off",
  autoCorrect: "off",
  spellCheck: false,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-form-type": "other",
} as const;

/**
 * Add / edit a credential. Existing passwords are fetched through the reveal endpoint only when the
 * editor opens. The saved document comes back through `onSaved` so the page can update in place.
 */
export function CredentialModal({
  base,
  item,
  defaultCategory,
  onClose,
  onSaved,
}: {
  base: string;
  /** null = add a new credential. */
  item: PasswordItem | null;
  defaultCategory?: string;
  onClose: () => void;
  onSaved: (saved: PasswordItem, mode: "created" | "updated") => void;
}) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const initial = useRef({
    title: item?.title ?? "",
    category: item?.category ?? defaultCategory ?? "Server",
    username: item?.username ?? "",
    url: item?.url ?? "",
    notes: item?.notes ?? "",
  }).current;

  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [username, setUsername] = useState(initial.username);
  const [password, setPassword] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [url, setUrl] = useState(initial.url);
  const [notes, setNotes] = useState(initial.notes);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Only entries that have a stored secret need the reveal call.
  const needsSecret = Boolean(item?.hasPassword);
  const [secretState, setSecretState] = useState<SecretState>(needsSecret ? "loading" : "ready");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!item || !needsSecret) return;
    let cancelled = false;
    setSecretState("loading");
    api
      .get<PasswordItem>(`${base}/${item._id}`)
      .then((p) => {
        if (cancelled) return;
        setPassword(p.password ?? "");
        setSavedPassword(p.password ?? "");
        setSecretState("ready");
      })
      .catch(() => {
        if (!cancelled) setSecretState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [base, item, needsSecret, attempt]);

  const categories: string[] = [...PASSWORD_CATEGORIES];
  if (!categories.includes(category)) categories.push(category);

  const dirty =
    title !== initial.title || category !== initial.category || username !== initial.username || url !== initial.url || notes !== initial.notes || password !== savedPassword;
  const hint = urlHint(url);

  const validateTitle = useCallback((v: string) => (v.trim() ? null : "Enter a title for this credential."), []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const err = validateTitle(title);
    setSubmitted(true);
    setTitleError(err);
    if (err) {
      titleRef.current?.focus();
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      const body: Record<string, string> = { title: title.trim(), category, username: username.trim(), url: url.trim(), notes };
      // If the saved password could not be loaded and was left empty, omit the field so the server keeps it.
      if (!item || secretState === "ready" || password !== "") body.password = password;
      const saved = item ? await api.patch<PasswordItem>(`${base}/${item._id}`, body) : await api.post<PasswordItem>(base, body);
      onSaved(saved, item ? "updated" : "created");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Couldn't save this credential. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const passwordLoading = secretState === "loading";

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? "Edit credential" : "Add credential"}
      size="medium"
      closeOnBackdrop={!dirty}
      footer={
        <>
          {item ? <span className="mr-auto text-body-sm text-ink-muted">Updated {relativeTime(item.updatedAt)}</span> : null}
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={busy} disabled={passwordLoading}>
            {item ? "Save changes" : "Add credential"}
          </Button>
        </>
      }
    >
      <form id={formId} ref={formRef} onSubmit={save} noValidate className="space-y-4 pb-1">
        {formError ? (
          <SectionMessage appearance="error" title="Couldn't save this credential">
            {formError}
          </SectionMessage>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <Field label="Title" required error={titleError}>
            <Input
              ref={titleRef}
              data-autofocus
              value={title}
              maxLength={200}
              onChange={(e) => {
                setTitle(e.target.value);
                if (submitted) setTitleError(validateTitle(e.target.value));
              }}
              placeholder="Production server (SSH)"
              {...NO_AUTOFILL}
            />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Username, email or key ID" hint="(optional)">
          <Input className="mono" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="deploy" {...NO_AUTOFILL} />
        </Field>

        <Field
          label="Password or secret"
          hint="(optional)"
          helper={
            secretState === "error" ? (
              <span className="text-danger-text">
                Couldn&apos;t load the saved password. Leave this empty to keep it, or{" "}
                <Button type="button" variant="link" onClick={() => setAttempt((n) => n + 1)}>
                  try again
                </Button>
                .
              </span>
            ) : undefined
          }
        >
          {(p) => (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <Input
                    {...p}
                    name="credential-secret"
                    type={show ? "text" : "password"}
                    className="mono"
                    value={password}
                    disabled={passwordLoading}
                    placeholder={passwordLoading ? "Decrypting..." : ""}
                    onChange={(e) => setPassword(e.target.value)}
                    {...NO_AUTOFILL}
                    autoComplete="new-password"
                    endAdornment={
                      <IconButton size="sm" title={show ? "Hide password" : "Show password"} aria-pressed={show} disabled={passwordLoading} onClick={() => setShow((s) => !s)}>
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                      </IconButton>
                    }
                  />
                </div>
                <PasswordGenerator
                  disabled={passwordLoading}
                  onUse={(pw) => {
                    setPassword(pw);
                    setShow(true);
                  }}
                />
              </div>
              <StrengthMeter value={password} />
            </>
          )}
        </Field>

        <Field label="URL or host" hint="(optional)" helper={hint ? <span className="text-warning">{hint}</span> : "A web address, IP or host, such as https://console.example.com or ssh deploy@10.0.0.4."}>
          <Input className="mono" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://console.example.com" {...NO_AUTOFILL} />
        </Field>

        <Field label="Notes" hint="(optional)" helper="Notes are not encrypted. Keep secrets in the password field.">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
            placeholder="Port, where the 2FA backup codes are, who owns the account"
          />
        </Field>
      </form>
    </Modal>
  );
}
