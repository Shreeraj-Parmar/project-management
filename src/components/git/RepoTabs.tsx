"use client";

import { useMemo, useState } from "react";
import { Check, CircleDot, Copy, GitBranch, GitCommit, GitPullRequest } from "lucide-react";
import { Avatar, Badge, EmptyState, Lozenge, Tabs } from "@/components/ui";
import { copyToClipboard, relativeTime } from "@/lib/client";
import type { GitIssue, GitSnapshot } from "@/lib/github";
import { dayLabel } from "./utils";

const COLOR = "#172b4d";

function ShaChip({ sha, url }: { sha: string; url: string }) {
  const [done, setDone] = useState(false);
  return (
    <span className="inline-flex h-6 shrink-0 items-center overflow-hidden rounded-label bg-fill text-body-sm text-ink-soft">
      <a href={url} target="_blank" rel="noreferrer" className="px-1.5 font-mono font-semibold hover:bg-fill-hover" title="View commit on GitHub">
        {sha.slice(0, 7)}
      </a>
      <button
        type="button"
        title={done ? "Copied" : "Copy full SHA"}
        aria-label="Copy full SHA"
        className="flex h-6 w-6 items-center justify-center hover:bg-fill-hover"
        onClick={async () => {
          if (await copyToClipboard(sha)) {
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }
        }}
      >
        {done ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      </button>
    </span>
  );
}

function Commits({ commits }: { commits: GitSnapshot["commits"] }) {
  const groups = useMemo(() => {
    const m = new Map<string, typeof commits>();
    commits.forEach((c) => {
      const k = dayLabel(c.date);
      m.set(k, [...(m.get(k) ?? []), c]);
    });
    return [...m.entries()];
  }, [commits]);
  if (!commits.length) return <PanelEmpty icon={<GitCommit size={24} />} title="No commits yet" description="Commits will appear here once something is pushed to this repository." />;
  return (
    <div className="space-y-5">
      {groups.map(([day, rows]) => (
        <section key={day}>
          <h3 className="mb-1 text-body-sm font-semibold text-ink-soft">{day}</h3>
          <ul className="overflow-hidden rounded-card border border-line">
            {rows.map((c) => (
              <li key={c.sha} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-fill-subtle">
                <Avatar name={c.author} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 break-words font-semibold text-ink sm:truncate">{c.message}</div>
                  <div className="truncate text-body-sm text-ink-muted">
                    <span className="font-medium text-ink-soft">{c.author}</span> committed {relativeTime(c.date)}
                  </div>
                </div>
                <ShaChip sha={c.sha} url={c.url} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Branches({ branches, defaultBranch }: { branches: GitSnapshot["branches"]; defaultBranch: string }) {
  if (!branches.length) return <PanelEmpty icon={<GitBranch size={24} />} title="No branches" description="This repository has no branches yet." />;
  return (
    <ul className="overflow-hidden rounded-card border border-line">
      {branches.map((b) => (
        <li key={b.name} className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-fill-subtle">
          <GitBranch size={16} className="shrink-0 text-ink-soft" />
          <span className="min-w-0 truncate font-mono font-medium text-ink">{b.name}</span>
          {b.name === defaultBranch ? <Lozenge appearance="inprogress">Default</Lozenge> : null}
          {b.protected ? (
            <Lozenge appearance="default">Protected</Lozenge>
          ) : null}
          <span className="ml-auto shrink-0 font-mono text-body-sm text-ink-muted">{b.sha?.slice(0, 7)}</span>
        </li>
      ))}
    </ul>
  );
}

function labelStyle(color: string) {
  const hex = color.replace("#", "");
  const n = parseInt(hex.length === 6 ? hex : "8590a2", 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return { background: `#${hex}`, color: lum > 0.6 ? "#172B4D" : "#FFFFFF" };
}

function Items({ items, kind, repoUrl }: { items: GitIssue[]; kind: "issue" | "pr"; repoUrl: string }) {
  const [state, setState] = useState<"open" | "closed">("open");
  const open = items.filter((i) => i.state === "open");
  const shown = state === "open" ? open : items.filter((i) => i.state !== "open");
  const noun = kind === "pr" ? "pull requests" : "issues";
  const Icon = kind === "pr" ? GitPullRequest : CircleDot;
  return (
    <div>
      <div className="mb-3">
        <Tabs
          variant="segmented"
          value={state}
          onChange={(v) => setState(v as "open" | "closed")}
          tabs={[
            { id: "open", label: "Open", count: open.length },
            { id: "closed", label: "Closed" },
          ]}
        />
      </div>
      {shown.length === 0 ? (
        state === "open" ? (
          <PanelEmpty icon={<Icon size={24} />} title={`No open ${noun}`} description={`When someone opens a ${kind === "pr" ? "pull request" : "issue"}, it will show up here.`} />
        ) : (
          <PanelEmpty
            icon={<Icon size={24} />}
            title={`Closed ${noun} aren't loaded`}
            description="Only open items are fetched. Browse closed ones on GitHub."
            action={
              <a className="link" href={`${repoUrl}/${kind === "pr" ? "pulls" : "issues"}?q=is%3Aclosed`} target="_blank" rel="noreferrer">
                Open on GitHub
              </a>
            }
          />
        )
      ) : (
        <ul className="overflow-hidden rounded-card border border-line">
          {shown.map((i) => (
            <li key={i.number} className="border-b border-line last:border-b-0">
              <a href={i.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 px-3 py-2.5 hover:bg-fill-subtle">
                <Icon size={16} className={`mt-0.5 shrink-0 ${state === "open" ? "text-success" : "text-discovery-text"}`} aria-label={state === "open" ? "Open" : "Closed"} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-ink">{i.title}</span>
                    {i.labels.map((l) => (
                      <Badge key={l.name} bg={labelStyle(l.color).background} fg={labelStyle(l.color).color}>
                        {l.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-body-sm text-ink-muted">
                    #{i.number} opened {relativeTime(i.createdAt)}
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PanelEmpty({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-border-bold/50 bg-surface/60">
      <EmptyState compact icon={icon} color={COLOR} title={title} description={description} action={action} />
    </div>
  );
}

export function RepoTabs({ data }: { data: GitSnapshot }) {
  const [tab, setTab] = useState("commits");
  const prs = data.issues.filter((i) => i.isPullRequest);
  const issues = data.issues.filter((i) => !i.isPullRequest);
  return (
    <div>
      <div className="mb-4 overflow-x-auto">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "commits", label: "Commits", icon: <GitCommit size={16} />, count: data.commits.length },
            { id: "branches", label: "Branches", icon: <GitBranch size={16} />, count: data.branches.length },
            { id: "issues", label: "Issues", icon: <CircleDot size={16} />, count: issues.length },
            { id: "prs", label: "Pull requests", icon: <GitPullRequest size={16} />, count: prs.length },
          ]}
        />
      </div>
      {tab === "commits" ? <Commits commits={data.commits} /> : null}
      {tab === "branches" ? <Branches branches={data.branches} defaultBranch={data.repo.defaultBranch} /> : null}
      {tab === "issues" ? <Items items={issues} kind="issue" repoUrl={data.repo.htmlUrl} /> : null}
      {tab === "prs" ? <Items items={prs} kind="pr" repoUrl={data.repo.htmlUrl} /> : null}
    </div>
  );
}
