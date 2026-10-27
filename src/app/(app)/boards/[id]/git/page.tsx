"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, GitBranch, Link2, MoreHorizontal, RefreshCw, Unlink, ExternalLink, Pencil, Star, GitFork } from "lucide-react";
import { api, relativeTime, useFetch } from "@/lib/client";
import { MODULES } from "@/lib/constants";
import type { GitSnapshot } from "@/lib/github";
import { useProject } from "@/components/project/ProjectContext";
import { Button, ConfirmDialog, ErrorBox, IconButton, Lozenge, Menu, MenuItem, Modal, PageHeader, SectionMessage, useToast } from "@/components/ui";
import { ConnectForm } from "@/components/git/ConnectForm";
import { GitSkeleton } from "@/components/git/GitSkeleton";
import { RepoTabs } from "@/components/git/RepoTabs";
import { explainGitError } from "@/components/git/utils";

const MOD = MODULES.find((m) => m.id === "git")!;
type Resp = { connected: boolean; hasToken: boolean; globalToken: boolean; repoName?: string; error?: string } & Partial<GitSnapshot>;

function GithubMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.5 7.5 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export default function GitPage() {
  const { project, setProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/git`;
  const { data, loading, error, refetch } = useFetch<Resp>(base);
  const [changing, setChanging] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    if (data) setFetchedAt(new Date());
  }, [data]);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  async function refresh() {
    setRefreshing(true);
    await refetch(true);
    setRefreshing(false);
  }

  async function disconnect() {
    try {
      await api.put(base, { repo: "" });
      setProject((p) => ({ ...p, git: { repo: "", hasToken: false } }));
      refetch();
      toast("Repository disconnected", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't disconnect the repository", "error");
    }
  }

  const saved = (repo: string, hasToken: boolean) => {
    setProject((p) => ({ ...p, git: { repo, hasToken } }));
    setChanging(false);
    refetch();
  };

  const connected = Boolean(data?.connected);
  const repoName = data?.repo?.fullName ?? data?.repoName ?? project.git?.repo ?? "";

  let body: React.ReactNode;
  if (loading && !data) body = <GitSkeleton />;
  else if (error && !data) body = <ErrorBox title="Couldn't load repository" message={error} onRetry={() => refetch()} />;
  else if (!connected)
    body = (
      <div className="mx-auto w-full max-w-login py-6">
        <div className="t-card t-card--static p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-fill text-ink">
            <GithubMark size={26} />
          </div>
          <h2 className="text-h-m font-semibold text-ink">Connect a GitHub repository</h2>
          <p className="mb-4 mt-1 text-ink-soft">See commits, branches, issues and pull requests next to your tasks.</p>
          <ConnectForm base={base} current="" hasToken={false} onSaved={saved} />
        </div>
      </div>
    );
  else {
    const err = data?.error || !data?.repo ? explainGitError(data?.error, Boolean(data?.hasToken), Boolean(data?.globalToken)) : null;
    body = (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface px-3 py-2">
          <a href={data?.repo?.htmlUrl ?? `https://github.com/${repoName}`} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 font-semibold text-ink hover:underline">
            <GithubMark />
            <span className="truncate">{repoName}</span>
            <ExternalLink size={12} className="shrink-0 text-ink-muted" />
          </a>
          {data?.repo ? (
            <>
              <Lozenge appearance="inprogress" icon={<GitBranch size={10} />}>{data.repo.defaultBranch}</Lozenge>
              <Lozenge appearance="default">{data.repo.private ? "Private" : "Public"}</Lozenge>
              <span className="hidden items-center gap-1 text-body-sm text-ink-muted sm:inline-flex"><Star size={12} /> {data.repo.stars}</span>
              <span className="hidden items-center gap-1 text-body-sm text-ink-muted sm:inline-flex"><GitFork size={12} /> {data.repo.forks}</span>
              <span className="hidden text-body-sm text-ink-muted md:inline">pushed {relativeTime(data.repo.pushedAt)}</span>
            </>
          ) : null}
          <div className="ml-auto flex items-center gap-2">
            {fetchedAt ? <span className="hidden text-body-sm text-ink-muted sm:inline">Updated {relativeTime(fetchedAt)}</span> : null}
            <Button variant="secondary" size="md" loading={refreshing} icon={<RefreshCw size={16} />} onClick={refresh}>
              Refresh
            </Button>
            <Menu trigger={<IconButton title="Repository actions"><MoreHorizontal size={16} /></IconButton>} width="w-48">
              <MenuItem icon={<Pencil size={16} />} onClick={() => setChanging(true)}>
                Change repo
              </MenuItem>
              <MenuItem icon={<Unlink size={16} />} danger onClick={() => setDisconnecting(true)}>
                Disconnect
              </MenuItem>
            </Menu>
          </div>
        </div>
        {err ? (
          <SectionMessage
            appearance="error"
            title={err.title}
            actions={
              <>
                <Button variant="link" onClick={refresh}>Try again</Button>
                <Button variant="link" onClick={() => setChanging(true)}>Change repo or token</Button>
              </>
            }
          >
            {err.body}
          </SectionMessage>
        ) : (
          <>
            {data?.unavailable && Object.keys(data.unavailable).length ? (
              <p className="flex items-start gap-2 rounded-card border border-line bg-surface px-3 py-2 text-body-sm text-ink-soft">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" aria-hidden />
                <span>
                  Some sections couldn&apos;t be loaded from GitHub: {Object.keys(data.unavailable).join(", ")}.{" "}
                  {data.hasToken || data.globalToken ? "The token may lack permission for them." : "Adding an access token usually fixes this."}
                </span>
              </p>
            ) : null}
            <RepoTabs data={data as GitSnapshot} />
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Git repository"
        description="Everything about the connected GitHub repository: README, commits, branches, issues, pull requests, releases and workflow runs."
        color={MOD.color}
        icon={<GitBranch size={20} />}
      />
      {body}
      <Modal open={changing} onClose={() => setChanging(false)} title="Change repository" size="small" footer={null}>
        <ConnectForm
          base={base}
          current={project.git?.repo ?? repoName}
          hasToken={Boolean(data?.hasToken)}
          onSaved={saved}
          footer={
            <>
              <Button type="button" variant="subtle" onClick={() => setChanging(false)}>
                Cancel
              </Button>
              <Button type="submit" icon={<Link2 size={16} />}>
                Save
              </Button>
            </>
          }
        />
      </Modal>
      <ConfirmDialog
        open={disconnecting}
        onClose={() => setDisconnecting(false)}
        onConfirm={disconnect}
        title={`Disconnect ${repoName}?`}
        message="The saved access token is removed too. You can reconnect at any time."
        confirmLabel="Disconnect"
      />
    </div>
  );
}
