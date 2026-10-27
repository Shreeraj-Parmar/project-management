"use client";

import { useMemo, useState } from "react";
import { CircleDot, GitMerge, GitPullRequest, GitPullRequestDraft, MessageSquare, Milestone, Search } from "lucide-react";
import { Avatar, AvatarGroup, Lozenge, SearchInput, Tabs } from "@/components/ui";
import { formatDate, relativeTime } from "@/lib/client";
import type { GitIssue, GitPull, GitSnapshot } from "@/lib/github";
import { Labels, PanelEmpty, Unavailable } from "./shared";

const matches = (q: string, i: { title: string; number: number; author: string; labels: { name: string }[] }) =>
  !q || i.title.toLowerCase().includes(q) || String(i.number) === q.replace("#", "") || i.author.toLowerCase().includes(q) || i.labels.some((l) => l.name.toLowerCase().includes(q));

export function Issues({ data }: { data: GitSnapshot }) {
  const { issues, repo } = data;
  const [state, setState] = useState<"open" | "closed">("open");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const open = issues.filter((i) => i.state === "open");
  const closed = issues.filter((i) => i.state === "closed");
  const shown = useMemo(() => (state === "open" ? open : closed).filter((i) => matches(q, i)), [state, open, closed, q]);
  if (data.unavailable.issues) return <Unavailable what="issues" reason={data.unavailable.issues} url={`${repo.htmlUrl}/issues`} />;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tabs
          variant="segmented"
          value={state}
          onChange={(v) => setState(v as "open" | "closed")}
          tabs={[
            { id: "open", label: "Open", count: open.length },
            { id: "closed", label: "Closed", count: closed.length },
          ]}
        />
        <SearchInput value={query} onValueChange={setQuery} placeholder="Search issues" className="w-full sm:w-64" />
        <a href={`${repo.htmlUrl}/issues`} target="_blank" rel="noreferrer" className="link ml-auto text-body-sm font-medium">
          Issues on GitHub
        </a>
      </div>
      {shown.length === 0 ? (
        q ? (
          <PanelEmpty icon={<Search size={24} />} title="No issues match" description="Try a title word, a label, an author or #number." />
        ) : (
          <PanelEmpty icon={<CircleDot size={24} />} title={state === "open" ? "No open issues" : "No closed issues loaded"} description={state === "open" ? "When someone opens an issue, it will show up here." : "The most recently updated issues are loaded. Browse older ones on GitHub."} />
        )
      ) : (
        <ul className="overflow-hidden rounded-card border border-line">
          {shown.map((i) => (
            <IssueRow key={i.number} i={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

function IssueRow({ i }: { i: GitIssue }) {
  const openState = i.state === "open";
  return (
    <li className="border-b border-line last:border-b-0">
      <a href={i.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 px-3 py-2.5 hover:bg-fill-subtle">
        <CircleDot size={16} className={`mt-0.5 shrink-0 ${openState ? "text-success" : "text-discovery-text"}`} aria-label={openState ? "Open" : "Closed"} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-ink">{i.title}</span>
            <Labels labels={i.labels} />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 text-body-sm text-ink-muted">
            <span>#{i.number}</span>
            <span>
              {openState ? "opened" : "closed"} {relativeTime(openState ? i.createdAt : (i.closedAt ?? i.updatedAt))} by <span className="font-medium text-ink-soft">{i.author}</span>
            </span>
            {i.milestone ? (
              <span className="inline-flex items-center gap-0.5">
                <Milestone size={12} /> {i.milestone}
              </span>
            ) : null}
            <span className="hidden sm:inline" title={formatDate(i.updatedAt)}>
              updated {relativeTime(i.updatedAt)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-body-sm text-ink-muted">
          {i.assignees.length ? <AvatarGroup people={i.assignees.map((a) => ({ name: a.login, src: a.avatarUrl }))} size="xs" max={3} /> : null}
          {i.comments ? (
            <span className="inline-flex items-center gap-0.5">
              <MessageSquare size={12} /> {i.comments}
            </span>
          ) : null}
        </div>
      </a>
    </li>
  );
}

export function Pulls({ data }: { data: GitSnapshot }) {
  const { pulls, repo } = data;
  const [state, setState] = useState<"open" | "merged" | "closed">("open");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const by = (s: GitPull["state"]) => pulls.filter((p) => p.state === s);
  const open = by("open");
  const merged = by("merged");
  const closed = by("closed");
  const shown = useMemo(() => (state === "open" ? open : state === "merged" ? merged : closed).filter((p) => matches(q, p)), [state, open, merged, closed, q]);
  if (data.unavailable.pulls) return <Unavailable what="pull requests" reason={data.unavailable.pulls} url={`${repo.htmlUrl}/pulls`} />;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tabs
          variant="segmented"
          value={state}
          onChange={(v) => setState(v as typeof state)}
          tabs={[
            { id: "open", label: "Open", count: open.length },
            { id: "merged", label: "Merged", count: merged.length },
            { id: "closed", label: "Closed", count: closed.length },
          ]}
        />
        <SearchInput value={query} onValueChange={setQuery} placeholder="Search pull requests" className="w-full sm:w-64" />
        <a href={`${repo.htmlUrl}/pulls`} target="_blank" rel="noreferrer" className="link ml-auto text-body-sm font-medium">
          Pull requests on GitHub
        </a>
      </div>
      {shown.length === 0 ? (
        q ? (
          <PanelEmpty icon={<Search size={24} />} title="No pull requests match" description="Try a title word, a label, an author or #number." />
        ) : (
          <PanelEmpty
            icon={<GitPullRequest size={24} />}
            title={state === "open" ? "No open pull requests" : `No ${state} pull requests loaded`}
            description={state === "open" ? "When someone opens a pull request, it will show up here." : "The most recently updated pull requests are loaded. Browse older ones on GitHub."}
          />
        )
      ) : (
        <ul className="overflow-hidden rounded-card border border-line">
          {shown.map((p) => (
            <PullRow key={p.number} p={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PullRow({ p }: { p: GitPull }) {
  const Icon = p.state === "merged" ? GitMerge : p.draft ? GitPullRequestDraft : GitPullRequest;
  const color = p.state === "merged" ? "text-discovery-text" : p.state === "closed" ? "text-danger" : p.draft ? "text-ink-muted" : "text-success";
  const when = p.state === "merged" ? `merged ${relativeTime(p.mergedAt)}` : p.state === "closed" ? `closed ${relativeTime(p.closedAt ?? p.updatedAt)}` : `opened ${relativeTime(p.createdAt)}`;
  return (
    <li className="border-b border-line last:border-b-0">
      <a href={p.url} target="_blank" rel="noreferrer" className="flex items-start gap-3 px-3 py-2.5 hover:bg-fill-subtle">
        <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} aria-label={p.state} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-ink">{p.title}</span>
            {p.draft && p.state === "open" ? <Lozenge appearance="default">Draft</Lozenge> : null}
            <Labels labels={p.labels} />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 text-body-sm text-ink-muted">
            <span>#{p.number}</span>
            <span>
              {when} by <span className="font-medium text-ink-soft">{p.author}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-mono">
              <span className="rounded-label bg-brand-soft px-1 text-brand-dark">{p.head}</span>
              <span aria-hidden>→</span>
              <span className="rounded-label bg-fill px-1">{p.base}</span>
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {p.reviewers.length ? <AvatarGroup people={p.reviewers.map((a) => ({ name: a.login, src: a.avatarUrl }))} size="xs" max={3} /> : null}
          <Avatar name={p.author} src={p.authorAvatar} size="sm" />
        </div>
      </a>
    </li>
  );
}
