"use client";

import { useState } from "react";
import { GitBranch, GitCommit, Star, GitFork, CircleDot, ExternalLink, Link2, Unlink, RefreshCw, Lock, Globe, GitPullRequest, AlertTriangle, KeyRound, Shield } from "lucide-react";
import { api, cn, relativeTime, useFetch } from "@/lib/client";
import { MODULES } from "@/lib/constants";
import type { GitSnapshot } from "@/lib/github";
import { useProject } from "@/components/project/ProjectContext";
import { ModuleHeader, Spinner, ErrorBox, EmptyState, Badge } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

const MOD = MODULES.find((m) => m.id === "git")!;
type Resp = { connected: boolean; hasToken: boolean; globalToken: boolean; repoName?: string; error?: string } & Partial<GitSnapshot>;

export default function GitPage() {
  const { project, setProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/git`;
  const { data, loading, error, refetch } = useFetch<Resp>(base);
  const [connect, setConnect] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function disconnect() {
    if (!confirm("Disconnect this repository?")) return;
    await api.put(base, { repo: "" });
    setProject((p) => ({ ...p, git: { repo: "", hasToken: false } }));
    refetch();
    toast("Repository disconnected", "success");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ModuleHeader
        title="Git repository"
        description="Connect a GitHub repo to see commits, branches and open issues right here."
        color={MOD.color}
        icon={<GitBranch size={20} />}
        actions={
          data?.connected ? (
            <>
              <Button
                variant="secondary"
                icon={<RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />}
                onClick={async () => {
                  setRefreshing(true);
                  await refetch(true);
                  setRefreshing(false);
                }}
              >
                Refresh
              </Button>
              <Button variant="secondary" icon={<KeyRound size={15} />} onClick={() => setConnect(true)}>
                Settings
              </Button>
              <Button variant="danger" icon={<Unlink size={15} />} onClick={disconnect}>
                Disconnect
              </Button>
            </>
          ) : (
            <Button color={MOD.color} icon={<Link2 size={15} />} onClick={() => setConnect(true)}>
              Connect repo
            </Button>
          )
        }
      />

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => refetch()} />
      ) : !data?.connected ? (
        <EmptyState
          icon={<GitBranch size={22} />}
          color={MOD.color}
          title="No repository connected"
          description="Paste a GitHub URL or owner/name. Private repos need a GITHUB_TOKEN in .env or a per-project token."
          action={
            <Button color={MOD.color} onClick={() => setConnect(true)}>
              Connect repo
            </Button>
          }
        />
      ) : data.error || !data.repo ? (
        <div className="space-y-3">
          <div className="t-card flex items-center gap-3 p-4">
            <GitBranch size={18} className="text-ink-muted" />
            <span className="mono font-semibold">{data.repoName}</span>
          </div>
          <div className="flex gap-2 rounded-lg border border-[#ffd5d2] bg-[#ffeceb] p-4 text-sm text-[#601e16]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <b>Could not load repository data.</b>
              <div className="mt-1 break-words text-xs">{data.error}</div>
              {!data.hasToken && !data.globalToken ? <div className="mt-2 text-xs">Tip: private repos require a token. Add <span className="mono">GITHUB_TOKEN</span> to .env or set one in Settings.</div> : null}
            </div>
          </div>
        </div>
      ) : (
        <RepoView data={data as Resp & GitSnapshot} />
      )}

      {connect ? (
        <ConnectModal
          base={base}
          current={project.git?.repo ?? ""}
          hasToken={Boolean(data?.hasToken)}
          onClose={() => setConnect(false)}
          onSaved={(repo, hasToken) => {
            setProject((p) => ({ ...p, git: { repo, hasToken } }));
            setConnect(false);
            refetch();
          }}
        />
      ) : null}
    </div>
  );
}

function RepoView({ data }: { data: Resp & GitSnapshot }) {
  const { repo, commits, branches, issues } = data;
  const prs = issues.filter((i) => i.isPullRequest);
  const onlyIssues = issues.filter((i) => !i.isPullRequest);
  return (
    <div className="space-y-4">
      {/* Repo card */}
      <div className="t-card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 text-white" style={{ background: "linear-gradient(135deg,#172b4d,#44546f)" }}>
          <div className="min-w-0">
            <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-lg font-bold hover:underline">
              <GitBranch size={18} /> {repo.fullName} <ExternalLink size={14} className="opacity-70" />
            </a>
            {repo.description ? <p className="mt-1 text-sm text-white/80">{repo.description}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge bg="rgba(255,255,255,.2)" fg="#fff">
                {repo.private ? <><Lock size={10} className="mr-1 inline" />Private</> : <><Globe size={10} className="mr-1 inline" />Public</>}
              </Badge>
              {repo.language ? <Badge bg="rgba(255,255,255,.2)" fg="#fff">{repo.language}</Badge> : null}
              <Badge bg="rgba(255,255,255,.2)" fg="#fff">
                <GitBranch size={10} className="mr-1 inline" /> {repo.defaultBranch}
              </Badge>
              <span className="text-white/70">pushed {relativeTime(repo.pushedAt)}</span>
              {data.hasToken ? <span className="flex items-center gap-1 text-white/70"><Shield size={10} /> project token</span> : null}
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1"><Star size={14} /> {repo.stars}</span>
            <span className="flex items-center gap-1"><GitFork size={14} /> {repo.forks}</span>
            <span className="flex items-center gap-1"><CircleDot size={14} /> {repo.openIssues}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Commits */}
        <section className="t-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
            <GitCommit size={15} /> Recent commits
          </h3>
          <ul className="divide-y divide-line">
            {commits.map((c) => (
              <li key={c.sha} className="flex items-start gap-3 py-2">
                <a href={c.url} target="_blank" rel="noreferrer" className="mono mt-0.5 shrink-0 rounded bg-[#f1f2f4] px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft hover:bg-[#dcdfe4]">
                  {c.sha.slice(0, 7)}
                </a>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">{c.message}</div>
                  <div className="text-xs text-ink-muted">
                    <b className="font-semibold text-ink-soft">{c.author}</b> · {relativeTime(c.date)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          {/* Branches */}
          <section className="t-card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <GitBranch size={15} /> Branches <span className="text-xs font-normal text-ink-muted">({branches.length})</span>
            </h3>
            <ul className="max-h-56 space-y-1 overflow-auto text-sm">
              {branches.map((b) => (
                <li key={b.name} className="flex items-center gap-2">
                  <span className={cn("mono truncate rounded px-1.5 py-0.5 text-xs", b.name === repo.defaultBranch ? "bg-[#e9f2ff] font-semibold text-[#0055cc]" : "bg-[#f1f2f4] text-ink-soft")}>{b.name}</span>
                  {b.protected ? <Lock size={11} className="text-ink-muted" /> : null}
                </li>
              ))}
            </ul>
          </section>

          {/* Issues & PRs */}
          <section className="t-card p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <CircleDot size={15} /> Open issues & PRs
            </h3>
            {issues.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing open. 🎉</p>
            ) : (
              <ul className="max-h-72 space-y-1.5 overflow-auto text-sm">
                {[...prs, ...onlyIssues].map((i) => (
                  <li key={i.number}>
                    <a href={i.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded px-1 py-1 hover:bg-[#f7f8f9]">
                      {i.isPullRequest ? <GitPullRequest size={14} className="mt-0.5 shrink-0 text-[#1f845a]" /> : <CircleDot size={14} className="mt-0.5 shrink-0 text-[#c25100]" />}
                      <div className="min-w-0">
                        <div className="truncate text-ink">{i.title}</div>
                        <div className="flex flex-wrap items-center gap-1 text-[11px] text-ink-muted">
                          #{i.number} · {relativeTime(i.createdAt)}
                          {i.labels.map((l) => (
                            <span key={l.name} className="rounded px-1 font-semibold" style={{ background: `#${l.color}33`, color: `#${l.color}` }}>
                              {l.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ConnectModal({ base, current, hasToken, onClose, onSaved }: { base: string; current: string; hasToken: boolean; onClose: () => void; onSaved: (repo: string, hasToken: boolean) => void }) {
  const { toast } = useToast();
  const [repo, setRepo] = useState(current);
  const [token, setToken] = useState("");
  const [clearToken, setClearToken] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body: { repo: string; token?: string } = { repo };
      if (token) body.token = token;
      else if (clearToken) body.token = "";
      const res = await api.put<{ repo: string; hasToken: boolean }>(base, body);
      toast("Repository connected", "success");
      onSaved(res.repo, res.hasToken);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={current ? "Repository settings" : "Connect GitHub repository"} accent={MOD.color} width="max-w-md">
      <form onSubmit={save} className="space-y-4">
        <Field label="Repository" hint="owner/name or URL">
          <Input autoFocus className="mono" value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="https://github.com/you/your-repo" />
        </Field>
        <Field label="Personal access token" hint={hasToken ? "a token is saved for this project" : "optional, overrides GITHUB_TOKEN"}>
          <Input type="password" className="mono" value={token} onChange={(e) => setToken(e.target.value)} placeholder={hasToken ? "•••••••• (leave blank to keep)" : "ghp_…"} />
          {hasToken ? (
            <label className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
              <input type="checkbox" checked={clearToken} onChange={(e) => setClearToken(e.target.checked)} /> Remove saved token
            </label>
          ) : null}
        </Field>
        <p className="text-xs text-ink-muted">Tokens are encrypted at rest. Only read access (<span className="mono">repo</span> scope for private repos) is needed.</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" color={MOD.color} loading={busy} disabled={!repo.trim()}>
            {current ? "Save" : "Connect"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
