"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Lock, AlertTriangle } from "lucide-react";
import { api } from "@/lib/client";
import { Button } from "@/components/ui/Button";

type Status = { passwordConfigured: boolean; sessionSecretConfigured: boolean; mongoConfigured: boolean };

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/boards";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    api.get<Status>("/api/auth/status").then(setStatus).catch(() => null);
  }, []);

  const missing: string[] = [];
  if (status && !status.passwordConfigured) missing.push("APP_PASSWORD");
  if (status && !status.sessionSecretConfigured) missing.push("SESSION_SECRET");
  if (status && !status.mongoConfigured) missing.push("MONGODB_URI");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/auth/login", { password });
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-in w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center text-white">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur">
          <svg viewBox="0 0 64 64" className="h-9 w-9">
            <rect x="10" y="10" width="19" height="44" rx="4" fill="#fff" />
            <rect x="35" y="10" width="19" height="28" rx="4" fill="#fff" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">DevBoard</h1>
        <p className="mt-1 text-sm text-white/75">Your personal developer workspace</p>
      </div>

      <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-[var(--shadow-overlay)]">
        <div className="mb-4 flex items-center gap-2 text-ink">
          <Lock size={18} className="text-brand" />
          <h2 className="text-base font-semibold">Unlock workspace</h2>
        </div>

        {missing.length > 0 ? (
          <div className="mb-4 flex gap-2 rounded-lg border border-[#f8e6a0] bg-[#fff7d6] p-3 text-[13px] text-[#533f04]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              Server is missing env vars: <span className="mono font-semibold">{missing.join(", ")}</span>. Copy{" "}
              <span className="mono">.env.example</span> to <span className="mono">.env</span> and fill them in.
            </div>
          </div>
        ) : null}

        <label className="t-label">Password</label>
        <div className="relative">
          <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="t-input pl-9"
          />
        </div>
        {error ? <p className="mt-2 text-[13px] font-medium text-danger">{error}</p> : null}
        <Button type="submit" size="lg" className="mt-4 w-full" loading={busy} disabled={!password}>
          Continue
        </Button>
        <p className="mt-4 text-center text-xs text-ink-muted">Single-user workspace. No accounts, just one password.</p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4" style={{ background: "linear-gradient(135deg,#0747a6 0%,#0c66e4 50%,#5067c5 100%)" }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
