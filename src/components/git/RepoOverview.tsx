"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Archive, BookOpen, Calendar, CircleDot, Eye, GitBranch, GitFork, GitPullRequest, Globe, HardDrive, Lock, Scale, Star, Tag, Users } from "lucide-react";
import { Avatar, Lozenge } from "@/components/ui";
import { formatBytes, formatDate, relativeTime } from "@/lib/client";
import type { GitSnapshot } from "@/lib/github";
import { compact, languageColor, PanelEmpty } from "./shared";

function Stat({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: React.ReactNode; href?: string }) {
  const inner = (
    <>
      <span className="flex size-8 items-center justify-center rounded-card bg-fill text-ink-soft">{icon}</span>
      <span className="min-w-0">
        <span className="block text-h-s font-semibold leading-tight text-ink">{value}</span>
        <span className="block truncate text-body-sm text-ink-muted">{label}</span>
      </span>
    </>
  );
  const cls = "flex items-center gap-3 rounded-card border border-line bg-canvas px-3 py-2.5";
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={`${cls} hover:bg-fill-subtle`}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5 text-body">
      <span className="mt-0.5 shrink-0 text-ink-muted">{icon}</span>
      <span className="w-28 shrink-0 text-ink-soft">{label}</span>
      <span className="min-w-0 flex-1 break-words font-medium text-ink">{children}</span>
    </div>
  );
}

function Languages({ languages }: { languages: Record<string, number> }) {
  const rows = useMemo(() => {
    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    return Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .map(([name, bytes]) => ({ name, bytes, pct: total ? (bytes / total) * 100 : 0 }));
  }, [languages]);
  if (!rows.length) return <p className="text-body-sm text-ink-muted">No language data.</p>;
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-fill" role="img" aria-label={rows.map((r) => `${r.name} ${r.pct.toFixed(1)}%`).join(", ")}>
        {rows.map((r) => (
          <span key={r.name} style={{ width: `${r.pct}%`, background: languageColor(r.name) }} title={`${r.name} ${r.pct.toFixed(1)}%`} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {rows.slice(0, 8).map((r) => (
          <li key={r.name} className="flex items-center gap-1.5 text-body-sm">
            <span className="size-2.5 rounded-full" style={{ background: languageColor(r.name) }} aria-hidden />
            <span className="font-medium text-ink">{r.name}</span>
            <span className="text-ink-muted">{r.pct < 0.1 ? "<0.1" : r.pct.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Readme({ data }: { data: GitSnapshot }) {
  const [expanded, setExpanded] = useState(false);
  const { repo, readme } = data;
  if (readme === null) {
    return <PanelEmpty icon={<BookOpen size={22} />} title="No README" description={data.unavailable.readme ? "GitHub didn't return a README for this repository." : "Add a README.md to the repository to see it here."} />;
  }
  const rawBase = `${repo.htmlUrl}/raw/${repo.defaultBranch}/`;
  const blobBase = `${repo.htmlUrl}/blob/${repo.defaultBranch}/`;
  const transform = (url: string, key: string) => {
    if (/^(https?:|mailto:|#|data:)/i.test(url)) return url;
    const clean = url.replace(/^\.?\//, "");
    return (key === "src" ? rawBase : blobBase) + clean;
  };
  const long = readme.length > 3000;
  return (
    <div>
      <div className={`prose-note relative overflow-hidden ${long && !expanded ? "max-h-[520px]" : ""}`}>
        <ReactMarkdown urlTransform={transform} components={{ a: (p) => <a {...p} target="_blank" rel="noreferrer" /> }}>
          {readme}
        </ReactMarkdown>
        {long && !expanded ? <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canvas to-transparent" /> : null}
      </div>
      {long ? (
        <button type="button" className="link mt-2 text-body-sm font-medium" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show less" : "Read the whole README"}
        </button>
      ) : null}
    </div>
  );
}

export function RepoOverview({ data }: { data: GitSnapshot }) {
  const { repo } = data;
  const openPrs = data.pulls.filter((p) => p.state === "open").length;
  const openIssues = data.issues.filter((i) => i.state === "open").length;
  const latest = data.releases.find((r) => !r.draft);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <section className="t-card t-card--static p-4">
          <div className="flex items-start gap-3">
            <a href={repo.owner.url} target="_blank" rel="noreferrer" className="shrink-0">
              <Avatar name={repo.owner.login} src={repo.owner.avatarUrl} size="lg" />
            </a>
            <div className="min-w-0 flex-1">
              <h2 className="flex flex-wrap items-center gap-2 text-h-m font-semibold text-ink">
                <a href={repo.htmlUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  <span className="font-normal text-ink-soft">{repo.owner.login} / </span>
                  {repo.name}
                </a>
                <Lozenge appearance="default" icon={repo.private ? <Lock size={10} /> : <Globe size={10} />}>
                  {repo.private ? "Private" : "Public"}
                </Lozenge>
                {repo.archived ? (
                  <Lozenge appearance="warning" icon={<Archive size={10} />}>
                    Archived
                  </Lozenge>
                ) : null}
                {repo.isFork ? <Lozenge appearance="default">Fork</Lozenge> : null}
              </h2>
              <p className="mt-1 text-body text-ink-soft">{repo.description || "No description."}</p>
              {repo.topics.length ? (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {repo.topics.map((t) => (
                    <li key={t}>
                      <a href={`https://github.com/topics/${t}`} target="_blank" rel="noreferrer" className="inline-flex h-6 items-center rounded-full bg-brand-soft px-2.5 text-body-sm font-medium text-brand-dark hover:bg-brand-soft-hover">
                        {t}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            <Stat icon={<Star size={16} />} label="Stars" value={compact(repo.stars)} href={`${repo.htmlUrl}/stargazers`} />
            <Stat icon={<GitFork size={16} />} label="Forks" value={compact(repo.forks)} href={`${repo.htmlUrl}/forks`} />
            <Stat icon={<Eye size={16} />} label="Watching" value={compact(repo.watchers)} href={`${repo.htmlUrl}/watchers`} />
            <Stat icon={<CircleDot size={16} />} label="Open issues" value={data.unavailable.issues ? compact(repo.openIssues) : openIssues} href={`${repo.htmlUrl}/issues`} />
            <Stat icon={<GitPullRequest size={16} />} label="Open PRs" value={openPrs} href={`${repo.htmlUrl}/pulls`} />
            <Stat icon={<GitBranch size={16} />} label="Branches" value={data.branches.length} href={`${repo.htmlUrl}/branches`} />
          </div>
        </section>

        <section className="t-card t-card--static p-4">
          <h3 className="mb-2 flex items-center gap-2 text-h-xs font-semibold text-ink">
            <BookOpen size={16} className="text-ink-soft" /> README
          </h3>
          <Readme data={data} />
        </section>
      </div>

      <aside className="min-w-0 space-y-4">
        <section className="t-card t-card--static p-4">
          <h3 className="mb-1 text-h-xs font-semibold text-ink">About</h3>
          <div className="divide-y divide-line">
            <Row icon={<GitBranch size={14} />} label="Default branch">
              <span className="font-mono">{repo.defaultBranch}</span>
            </Row>
            {repo.homepage ? (
              <Row icon={<Globe size={14} />} label="Website">
                <a href={repo.homepage} target="_blank" rel="noreferrer" className="link break-all">
                  {repo.homepage.replace(/^https?:\/\//, "")}
                </a>
              </Row>
            ) : null}
            <Row icon={<Scale size={14} />} label="License">{repo.license ?? "None"}</Row>
            <Row icon={<HardDrive size={14} />} label="Size">{formatBytes(repo.sizeKb * 1024)}</Row>
            <Row icon={<Tag size={14} />} label="Latest release">
              {latest ? (
                <a href={latest.url} target="_blank" rel="noreferrer" className="link">
                  {latest.tag}
                </a>
              ) : (
                `None${data.tags.length ? ` (${data.tags.length} tag${data.tags.length === 1 ? "" : "s"})` : ""}`
              )}
            </Row>
            <Row icon={<Calendar size={14} />} label="Last push">
              <span title={formatDate(repo.pushedAt)}>{relativeTime(repo.pushedAt)}</span>
            </Row>
            <Row icon={<Calendar size={14} />} label="Updated">
              <span title={formatDate(repo.updatedAt)}>{relativeTime(repo.updatedAt)}</span>
            </Row>
            <Row icon={<Calendar size={14} />} label="Created">{formatDate(repo.createdAt)}</Row>
          </div>
        </section>

        <section className="t-card t-card--static p-4">
          <h3 className="mb-2 text-h-xs font-semibold text-ink">Languages</h3>
          <Languages languages={data.languages} />
        </section>

        <section className="t-card t-card--static p-4">
          <h3 className="mb-2 flex items-center justify-between text-h-xs font-semibold text-ink">
            <span className="flex items-center gap-2">
              <Users size={16} className="text-ink-soft" /> Contributors
            </span>
            <span className="text-body-sm font-normal text-ink-muted">{data.contributors.length}{data.contributors.length >= 30 ? "+" : ""}</span>
          </h3>
          {data.contributors.length ? (
            <ul className="space-y-1.5">
              {data.contributors.slice(0, 8).map((c) => (
                <li key={c.login}>
                  <a href={c.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-control px-1 py-0.5 hover:bg-fill-subtle">
                    <Avatar name={c.login} src={c.avatarUrl} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-body font-medium text-ink">{c.login}</span>
                    <span className="text-body-sm text-ink-muted">{compact(c.contributions)} commits</span>
                  </a>
                </li>
              ))}
              {data.contributors.length > 8 ? (
                <li>
                  <a href={`${repo.htmlUrl}/graphs/contributors`} target="_blank" rel="noreferrer" className="link block px-1 pt-1 text-body-sm font-medium">
                    All contributors
                  </a>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="text-body-sm text-ink-muted">{data.unavailable.contributors ? "Couldn't load contributors." : "No contributors yet."}</p>
          )}
        </section>
      </aside>
    </div>
  );
}
