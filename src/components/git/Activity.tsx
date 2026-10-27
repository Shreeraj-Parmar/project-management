"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, GitBranch, GitCommit, MessageSquare, Play, ShieldCheck, Tag, CheckCircle2, XCircle, Clock, MinusCircle, Loader2, Search } from "lucide-react";
import { Avatar, Lozenge, SearchInput } from "@/components/ui";
import { cn, formatDate, relativeTime } from "@/lib/client";
import type { GitSnapshot } from "@/lib/github";
import { dayLabel } from "./utils";
import { PanelEmpty, ShaChip, Unavailable } from "./shared";

export function Commits({ data }: { data: GitSnapshot }) {
  const { commits, repo } = data;
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? commits.filter((c) => c.message.toLowerCase().includes(s) || c.body.toLowerCase().includes(s) || c.author.toLowerCase().includes(s) || c.sha.startsWith(s)) : commits;
  }, [commits, q]);
  const groups = useMemo(() => {
    const m = new Map<string, typeof commits>();
    shown.forEach((c) => {
      const k = dayLabel(c.date);
      m.set(k, [...(m.get(k) ?? []), c]);
    });
    return [...m.entries()];
  }, [shown]);
  if (data.unavailable.commits) return <Unavailable what="commits" reason={data.unavailable.commits} url={`${repo.htmlUrl}/commits`} />;
  if (!commits.length) return <PanelEmpty icon={<GitCommit size={24} />} title="No commits yet" description="Commits will appear here once something is pushed to this repository." />;
  const toggle = (sha: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(sha)) n.delete(sha);
      else n.add(sha);
      return n;
    });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onValueChange={setQ} placeholder="Search commits" className="w-full sm:w-72" />
        <span className="text-body-sm text-ink-muted">
          Latest {commits.length} commits on <span className="font-mono">{repo.defaultBranch}</span>
        </span>
        <a href={`${repo.htmlUrl}/commits/${repo.defaultBranch}`} target="_blank" rel="noreferrer" className="link ml-auto text-body-sm font-medium">
          All commits on GitHub
        </a>
      </div>
      {groups.length === 0 ? <PanelEmpty icon={<Search size={24} />} title="No commits match" description="Try another word, author or SHA." /> : null}
      {groups.map(([day, rows]) => (
        <section key={day}>
          <h3 className="mb-1 text-body-sm font-semibold text-ink-soft">{day}</h3>
          <ul className="overflow-hidden rounded-card border border-line">
            {rows.map((c) => {
              const expanded = open.has(c.sha);
              return (
                <li key={c.sha} className="border-b border-line last:border-b-0">
                  <div className="flex items-start gap-3 px-3 py-2.5 hover:bg-fill-subtle">
                    {c.authorUrl ? (
                      <a href={c.authorUrl} target="_blank" rel="noreferrer" className="mt-0.5 shrink-0">
                        <Avatar name={c.author} src={c.authorAvatar} size="md" />
                      </a>
                    ) : (
                      <Avatar name={c.author} src={c.authorAvatar} size="md" className="mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-1">
                        <a href={c.url} target="_blank" rel="noreferrer" className="min-w-0 break-words font-semibold text-ink hover:underline">
                          {c.message}
                        </a>
                        {c.body ? (
                          <button
                            type="button"
                            onClick={() => toggle(c.sha)}
                            aria-expanded={expanded}
                            title={expanded ? "Hide description" : "Show description"}
                            className="inline-flex h-5 shrink-0 items-center rounded-control bg-fill px-1 text-ink-soft hover:bg-fill-hover"
                          >
                            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <span className="ml-0.5 text-[11px] font-semibold">…</span>
                          </button>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-body-sm text-ink-muted">
                        <span className="font-medium text-ink-soft">{c.author}</span>
                        <span title={formatDate(c.date, { hour: "2-digit", minute: "2-digit" })}>committed {relativeTime(c.date)}</span>
                        {c.verified ? (
                          <span className="inline-flex items-center gap-0.5 text-success-text">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        ) : null}
                        {c.commentCount ? (
                          <span className="inline-flex items-center gap-0.5">
                            <MessageSquare size={12} /> {c.commentCount}
                          </span>
                        ) : null}
                      </div>
                      {expanded && c.body ? <pre className="mt-2 whitespace-pre-wrap rounded-card bg-surface p-2.5 font-sans text-body-sm text-ink">{c.body}</pre> : null}
                    </div>
                    <ShaChip sha={c.sha} url={c.url} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function Branches({ data }: { data: GitSnapshot }) {
  const { branches, repo } = data;
  const [q, setQ] = useState("");
  const shaToBranch = useMemo(() => new Map(data.commits.map((c) => [c.sha, c])), [data.commits]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? branches.filter((b) => b.name.toLowerCase().includes(s)) : branches;
    return [...list].sort((a, b) => (a.name === repo.defaultBranch ? -1 : b.name === repo.defaultBranch ? 1 : a.name.localeCompare(b.name)));
  }, [branches, q, repo.defaultBranch]);
  if (data.unavailable.branches) return <Unavailable what="branches" reason={data.unavailable.branches} url={`${repo.htmlUrl}/branches`} />;
  if (!branches.length) return <PanelEmpty icon={<GitBranch size={24} />} title="No branches" description="This repository has no branches yet." />;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {branches.length > 8 ? <SearchInput value={q} onValueChange={setQ} placeholder="Find a branch" className="w-full sm:w-72" /> : null}
        <span className="text-body-sm text-ink-muted">
          {branches.length} branch{branches.length === 1 ? "" : "es"}
          {branches.length >= 100 ? " (first 100)" : ""}
        </span>
        <a href={`${repo.htmlUrl}/branches`} target="_blank" rel="noreferrer" className="link ml-auto text-body-sm font-medium">
          Branches on GitHub
        </a>
      </div>
      <ul className="overflow-hidden rounded-card border border-line">
        {shown.map((b) => {
          const tip = shaToBranch.get(b.sha);
          const isDefault = b.name === repo.defaultBranch;
          return (
            <li key={b.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-fill-subtle">
              <GitBranch size={16} className="shrink-0 text-ink-soft" />
              <a href={b.url} target="_blank" rel="noreferrer" className="min-w-0 truncate font-mono font-medium text-ink hover:underline">
                {b.name}
              </a>
              {isDefault ? <Lozenge appearance="inprogress">Default</Lozenge> : null}
              {b.protected ? <Lozenge appearance="default">Protected</Lozenge> : null}
              {tip ? (
                <span className="hidden min-w-0 truncate text-body-sm text-ink-muted md:inline">
                  {tip.message} · {relativeTime(tip.date)}
                </span>
              ) : null}
              <span className="ml-auto flex shrink-0 items-center gap-2">
                {!isDefault ? (
                  <a href={`${repo.htmlUrl}/compare/${encodeURIComponent(repo.defaultBranch)}...${encodeURIComponent(b.name)}`} target="_blank" rel="noreferrer" className="link text-body-sm font-medium">
                    Compare
                  </a>
                ) : null}
                <ShaChip sha={b.sha} url={`${repo.htmlUrl}/commit/${b.sha}`} />
              </span>
            </li>
          );
        })}
        {shown.length === 0 ? <li className="px-3 py-6 text-center text-body-sm text-ink-muted">No branch matches.</li> : null}
      </ul>
    </div>
  );
}

export function Releases({ data }: { data: GitSnapshot }) {
  const { releases, tags, repo } = data;
  const [open, setOpen] = useState<number | null>(releases[0]?.id ?? null);
  if (data.unavailable.releases && data.unavailable.tags) return <Unavailable what="releases" reason={data.unavailable.releases} url={`${repo.htmlUrl}/releases`} />;
  const releasedTags = new Set(releases.map((r) => r.tag));
  const bareTags = tags.filter((t) => !releasedTags.has(t.name));
  if (!releases.length && !tags.length) return <PanelEmpty icon={<Tag size={24} />} title="No releases or tags" description="Publish a release on GitHub and it will show up here with its notes and assets." />;
  return (
    <div className="space-y-5">
      {releases.length ? (
        <ul className="space-y-3">
          {releases.map((r, i) => {
            const expanded = open === r.id;
            return (
              <li key={r.id} className="t-card t-card--static p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag size={16} className="text-ink-soft" />
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-h-xs font-semibold text-ink hover:underline">
                    {r.name}
                  </a>
                  {r.name !== r.tag ? <span className="font-mono text-body-sm text-ink-muted">{r.tag}</span> : null}
                  {i === 0 && !r.draft && !r.prerelease ? <Lozenge appearance="success">Latest</Lozenge> : null}
                  {r.prerelease ? <Lozenge appearance="warning">Pre-release</Lozenge> : null}
                  {r.draft ? <Lozenge appearance="default">Draft</Lozenge> : null}
                  <span className="ml-auto text-body-sm text-ink-muted">
                    {r.author} · {r.publishedAt ? relativeTime(r.publishedAt) : "unpublished"}
                    {r.assets ? ` · ${r.assets} asset${r.assets === 1 ? "" : "s"}` : ""}
                  </span>
                </div>
                {r.body ? (
                  <>
                    <pre className={cn("mt-2 whitespace-pre-wrap font-sans text-body text-ink-soft", !expanded && "line-clamp-3")}>{r.body}</pre>
                    {r.body.length > 240 ? (
                      <button type="button" className="link mt-1 text-body-sm font-medium" onClick={() => setOpen(expanded ? null : r.id)}>
                        {expanded ? "Show less" : "Show notes"}
                      </button>
                    ) : null}
                  </>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-3 text-body-sm">
                  <a href={`${repo.htmlUrl}/archive/refs/tags/${encodeURIComponent(r.tag)}.zip`} className="link inline-flex items-center gap-1 font-medium">
                    <Download size={12} /> Source (zip)
                  </a>
                  <a href={`${repo.htmlUrl}/archive/refs/tags/${encodeURIComponent(r.tag)}.tar.gz`} className="link inline-flex items-center gap-1 font-medium">
                    <Download size={12} /> Source (tar.gz)
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {bareTags.length ? (
        <section>
          <h3 className="mb-1 text-body-sm font-semibold text-ink-soft">{releases.length ? "Other tags" : "Tags"}</h3>
          <ul className="overflow-hidden rounded-card border border-line">
            {bareTags.map((t) => (
              <li key={t.name} className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0 hover:bg-fill-subtle">
                <Tag size={14} className="text-ink-soft" />
                <a href={`${repo.htmlUrl}/releases/tag/${encodeURIComponent(t.name)}`} target="_blank" rel="noreferrer" className="font-mono font-medium text-ink hover:underline">
                  {t.name}
                </a>
                <span className="ml-auto flex items-center gap-2">
                  <a href={t.zipUrl} className="link text-body-sm font-medium">
                    zip
                  </a>
                  <ShaChip sha={t.sha} url={`${repo.htmlUrl}/commit/${t.sha}`} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function RunStatus({ status, conclusion }: { status: string; conclusion: string | null }) {
  if (status !== "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-body-sm font-medium text-warning">
        {status === "in_progress" ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
        {status === "in_progress" ? "Running" : "Queued"}
      </span>
    );
  }
  const map: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    success: { icon: <CheckCircle2 size={14} />, label: "Passed", cls: "text-success-text" },
    failure: { icon: <XCircle size={14} />, label: "Failed", cls: "text-danger-text" },
    cancelled: { icon: <MinusCircle size={14} />, label: "Cancelled", cls: "text-ink-muted" },
    skipped: { icon: <MinusCircle size={14} />, label: "Skipped", cls: "text-ink-muted" },
    timed_out: { icon: <XCircle size={14} />, label: "Timed out", cls: "text-danger-text" },
    action_required: { icon: <Clock size={14} />, label: "Needs action", cls: "text-warning" },
  };
  const s = map[conclusion ?? ""] ?? { icon: <MinusCircle size={14} />, label: conclusion ?? "Unknown", cls: "text-ink-muted" };
  return (
    <span className={cn("inline-flex items-center gap-1 text-body-sm font-medium", s.cls)}>
      {s.icon}
      {s.label}
    </span>
  );
}

export function Actions({ data }: { data: GitSnapshot }) {
  const { workflowRuns, repo } = data;
  if (data.unavailable.actions) return <Unavailable what="workflow runs" reason={data.unavailable.actions} url={`${repo.htmlUrl}/actions`} />;
  if (!workflowRuns.length) return <PanelEmpty icon={<Play size={24} />} title="No workflow runs" description="Add a GitHub Actions workflow and its runs will be listed here." />;
  const passed = workflowRuns.filter((r) => r.conclusion === "success").length;
  const failed = workflowRuns.filter((r) => r.conclusion === "failure").length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-body-sm text-ink-muted">
        <span>Last {workflowRuns.length} runs</span>
        <span className="text-success-text">{passed} passed</span>
        {failed ? <span className="text-danger-text">{failed} failed</span> : null}
        <a href={`${repo.htmlUrl}/actions`} target="_blank" rel="noreferrer" className="link ml-auto font-medium">
          Actions on GitHub
        </a>
      </div>
      <ul className="overflow-hidden rounded-card border border-line">
        {workflowRuns.map((r) => (
          <li key={r.id} className="border-b border-line last:border-b-0">
            <a href={r.url} target="_blank" rel="noreferrer" className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 hover:bg-fill-subtle">
              <RunStatus status={r.status} conclusion={r.conclusion} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink">{r.title}</span>
                <span className="block truncate text-body-sm text-ink-muted">
                  {r.name} #{r.runNumber} · {r.event} · <span className="font-mono">{r.branch}</span> · {r.actor}
                </span>
              </span>
              <span className="shrink-0 text-body-sm text-ink-muted" title={formatDate(r.createdAt, { hour: "2-digit", minute: "2-digit" })}>
                {relativeTime(r.createdAt)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
