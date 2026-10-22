"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button, Checkbox, Field, Input, useToast } from "@/components/ui";
import { api } from "@/lib/client";
import { REPO_RE } from "./utils";

/** Shared by the first-run card and the "Change repo" modal. */
export function ConnectForm({
  base,
  current,
  hasToken,
  formId,
  onSaved,
  onBusy,
  footer,
}: {
  base: string;
  current: string;
  hasToken: boolean;
  formId?: string;
  onSaved: (repo: string, hasToken: boolean) => void;
  onBusy?: (b: boolean) => void;
  footer?: React.ReactNode;
}) {
  const { toast } = useToast();
  const [repo, setRepo] = useState(current);
  const [token, setToken] = useState("");
  const [clearToken, setClearToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = repo.trim();
    if (!value) return setError("Enter a repository as owner/name or a GitHub URL.");
    if (!REPO_RE.test(value)) return setError("Use the format owner/name, for example vercel/next.js.");
    setError(undefined);
    setBusy(true);
    onBusy?.(true);
    try {
      const body: { repo: string; token?: string } = { repo: value };
      if (token) body.token = token;
      else if (clearToken) body.token = "";
      const res = await api.put<{ repo: string; hasToken: boolean }>(base, body);
      toast(`Connected ${res.repo}`, "success");
      onSaved(res.repo, res.hasToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect the repository.");
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }

  return (
    <form id={formId} onSubmit={submit} noValidate className="space-y-4">
      <Field label="Repository" required error={error} helper="owner/name or a GitHub URL">
        <Input data-autofocus className="font-mono" value={repo} invalid={Boolean(error)} onChange={(e) => setRepo(e.target.value)} placeholder="owner/name" autoComplete="off" spellCheck={false} />
      </Field>
      <Field label="Access token" hint="(optional)" helper={hasToken ? "A token is saved for this project. Leave blank to keep it." : undefined}>
        <Input type="password" className="font-mono" value={token} onChange={(e) => setToken(e.target.value)} placeholder={hasToken ? "••••••••" : "ghp_…"} autoComplete="off" />
      </Field>
      {hasToken ? <Checkbox label="Remove the saved token" checked={clearToken} onCheckedChange={setClearToken} /> : null}
      <p className="flex gap-2 text-body-sm text-ink-muted">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>The token is stored encrypted and only needed for private repositories. Read access is enough.</span>
      </p>
      {footer ? (
        <div className="flex justify-end gap-2">{footer}</div>
      ) : (
        <Button type="submit" fullWidth loading={busy}>
          Connect
        </Button>
      )}
    </form>
  );
}
