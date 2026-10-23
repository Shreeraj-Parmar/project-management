"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button, Field, IconButton, Input, Logo, SectionMessage } from "@/components/ui";
import { safeNextPath } from "@/lib/redirect";

type Status = { passwordConfigured: boolean; sessionSecretConfigured: boolean; mongoConfigured: boolean };

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/auth/status", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Status>) : null))
      .then((s) => s && setStatus(s))
      .catch(() => null);
  }, []);

  const missing: string[] = [];
  if (status && !status.passwordConfigured) missing.push("APP_PASSWORD");
  if (status && !status.sessionSecretConfigured) missing.push("SESSION_SECRET");
  if (status && !status.mongoConfigured) missing.push("MONGODB_URI");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError(null);
    try {
      // Plain fetch: the shared api client redirects to /login on 401, which would hide the "wrong password" message.
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(res.status === 429 ? "Too many attempts. Try again in a minute." : data.error || "Login failed");
        setBusy(false);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  const keyHandler = (e: React.KeyboardEvent) => setCaps(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div className="fade-in w-full max-w-login">
      <form onSubmit={submit} className="rounded-card border border-line bg-canvas px-4 py-8 shadow-overlay min-[420px]:px-8 sm:rounded-list sm:px-10 sm:py-10">
        <div className="flex flex-col items-center text-center">
          <Logo size="lg" />
          <h1 className="mt-6 text-h-m font-semibold text-ink">Log in to continue</h1>
        </div>

        <div aria-live="polite" className="mt-5 space-y-3 empty:hidden">
          {error ? (
            <SectionMessage appearance="error">{error}</SectionMessage>
          ) : null}
          {missing.length > 0 ? (
            <SectionMessage appearance="warning" title="Server setup incomplete">
              Missing env vars: <span className="mono font-semibold">{missing.join(", ")}</span>. Copy <span className="mono">.env.example</span> to{" "}
              <span className="mono">.env</span> and fill them in.
            </SectionMessage>
          ) : null}
        </div>

        <div className="mt-5">
          <Field label="Password" htmlFor="password" helper={caps ? "Caps Lock is on." : undefined}>
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={keyHandler}
              onKeyUp={keyHandler}
              onBlur={() => setCaps(false)}
              placeholder="Enter password"
              invalid={!!error}
              endAdornment={
                <IconButton type="button" size="sm" title={show ? "Hide password" : "Show password"} onClick={() => setShow((v) => !v)}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              }
            />
          </Field>
        </div>

        <Button type="submit" size="lg" fullWidth className="mt-5" loading={busy} disabled={!password}>
          Continue
        </Button>

        <p className="mt-6 text-center text-body-sm text-ink-muted">
          Private single-user workspace. There is no sign-up; the password is the server&apos;s <span className="mono">APP_PASSWORD</span>.
        </p>
      </form>
      <p className="mt-6 text-center text-body-sm text-ink-muted">DevBoard &middot; Your personal developer workspace</p>
    </div>
  );
}

