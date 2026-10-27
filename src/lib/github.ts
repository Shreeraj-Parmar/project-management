export type GitRepoInfo = {
  fullName: string;
  name: string;
  owner: { login: string; avatarUrl: string; url: string };
  description: string | null;
  htmlUrl: string;
  homepage: string | null;
  defaultBranch: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  language: string | null;
  license: string | null;
  topics: string[];
  private: boolean;
  archived: boolean;
  isFork: boolean;
  /** Repository size in KB, as GitHub reports it. */
  sizeKb: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
};

export type GitCommit = {
  sha: string;
  /** First line. */
  message: string;
  /** Everything after the first line, trimmed. */
  body: string;
  author: string;
  authorAvatar: string | null;
  authorUrl: string | null;
  date: string;
  url: string;
  verified: boolean;
  commentCount: number;
};

export type GitBranch = { name: string; sha: string; protected: boolean; url: string };

export type GitIssue = {
  number: number;
  title: string;
  state: "open" | "closed";
  url: string;
  isPullRequest: boolean;
  labels: { name: string; color: string }[];
  author: string;
  authorAvatar: string | null;
  assignees: { login: string; avatarUrl: string }[];
  comments: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  milestone: string | null;
};

export type GitPull = {
  number: number;
  title: string;
  state: "open" | "merged" | "closed";
  draft: boolean;
  url: string;
  author: string;
  authorAvatar: string | null;
  head: string;
  base: string;
  labels: { name: string; color: string }[];
  reviewers: { login: string; avatarUrl: string }[];
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
};

export type GitRelease = {
  id: number;
  tag: string;
  name: string;
  url: string;
  draft: boolean;
  prerelease: boolean;
  author: string;
  publishedAt: string | null;
  body: string;
  assets: number;
};

export type GitTag = { name: string; sha: string; zipUrl: string };

export type GitContributor = { login: string; avatarUrl: string; url: string; contributions: number };

export type GitWorkflowRun = {
  id: number;
  name: string;
  title: string;
  status: string; // queued | in_progress | completed
  conclusion: string | null; // success | failure | cancelled | skipped | ...
  branch: string;
  event: string;
  actor: string;
  runNumber: number;
  url: string;
  createdAt: string;
  updatedAt: string;
};

export type GitSnapshot = {
  repo: GitRepoInfo;
  commits: GitCommit[];
  branches: GitBranch[];
  issues: GitIssue[];
  pulls: GitPull[];
  releases: GitRelease[];
  tags: GitTag[];
  contributors: GitContributor[];
  /** Bytes per language. */
  languages: Record<string, number>;
  readme: string | null;
  workflowRuns: GitWorkflowRun[];
  /** Sections that could not be loaded (name -> reason). The rest of the page still works. */
  unavailable: Record<string, string>;
  fetchedAt: string;
};

function headers(token?: string, accept = "application/vnd.github+json") {
  const h: Record<string, string> = { Accept: accept, "User-Agent": "devboard", "X-GitHub-Api-Version": "2022-11-28" };
  const t = token || process.env.GITHUB_TOKEN;
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

async function gh<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, { headers: headers(token), cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status} for ${path}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

async function ghText(path: string, token?: string): Promise<string> {
  const res = await fetch(`https://api.github.com${path}`, { headers: headers(token, "application/vnd.github.raw+json"), cache: "no-store" });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${path}`);
  return res.text();
}

export function parseRepo(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/github\.com[/:]([^/]+)\/([^/.\s]+)(?:\.git)?/i);
  if (urlMatch) return `${urlMatch[1]}/${urlMatch[2]}`;
  if (/^[\w.-]+\/[\w.-]+$/.test(trimmed)) return trimmed.replace(/\.git$/, "");
  return null;
}

type RawUser = { login: string; avatar_url: string; html_url: string } | null;
type RawLabel = { name: string; color: string };


/**
 * Everything we show for a repository. The repo itself must load; every other section is fetched in parallel
 * and, if it fails (permissions, rate limit, Actions disabled), is reported in `unavailable` instead of failing the page.
 */
export async function fetchGitSnapshot(fullName: string, token?: string): Promise<GitSnapshot> {
  type RawRepo = {
    full_name: string;
    name: string;
    owner: NonNullable<RawUser>;
    description: string | null;
    html_url: string;
    homepage: string | null;
    default_branch: string;
    stargazers_count: number;
    forks_count: number;
    subscribers_count: number;
    open_issues_count: number;
    language: string | null;
    license: { spdx_id: string; name: string } | null;
    topics?: string[];
    private: boolean;
    archived: boolean;
    fork: boolean;
    size: number;
    created_at: string;
    updated_at: string;
    pushed_at: string;
  };
  type RawCommit = {
    sha: string;
    html_url: string;
    commit: { message: string; author: { name: string; date: string } | null; comment_count: number; verification?: { verified: boolean } };
    author: RawUser;
  };
  type RawBranch = { name: string; commit: { sha: string }; protected: boolean };
  type RawIssue = {
    number: number;
    title: string;
    state: string;
    html_url: string;
    pull_request?: unknown;
    labels: RawLabel[];
    user: RawUser;
    assignees: NonNullable<RawUser>[];
    comments: number;
    created_at: string;
    updated_at: string;
    closed_at: string | null;
    milestone: { title: string } | null;
  };
  type RawPull = {
    number: number;
    title: string;
    state: string;
    draft: boolean;
    html_url: string;
    user: RawUser;
    head: { ref: string };
    base: { ref: string };
    labels: RawLabel[];
    requested_reviewers: NonNullable<RawUser>[];
    created_at: string;
    updated_at: string;
    merged_at: string | null;
    closed_at: string | null;
  };
  type RawRelease = {
    id: number;
    tag_name: string;
    name: string | null;
    html_url: string;
    draft: boolean;
    prerelease: boolean;
    author: RawUser;
    published_at: string | null;
    body: string | null;
    assets: unknown[];
  };
  type RawTag = { name: string; commit: { sha: string }; zipball_url: string };
  type RawContributor = { login: string; avatar_url: string; html_url: string; contributions: number };
  type RawRun = {
    id: number;
    name: string;
    display_title: string;
    status: string;
    conclusion: string | null;
    head_branch: string;
    event: string;
    actor: RawUser;
    run_number: number;
    html_url: string;
    created_at: string;
    updated_at: string;
  };

  const repo = await gh<RawRepo>(`/repos/${fullName}`, token);

  const settle = async <T,>(name: string, p: Promise<T>, fallback: T, unavailable: Record<string, string>): Promise<T> => {
    try {
      return await p;
    } catch (err) {
      unavailable[name] = err instanceof Error ? err.message : "Unavailable";
      return fallback;
    }
  };

  const unavailable: Record<string, string> = {};
  const [commits, branches, issues, pulls, releases, tags, contributors, languages, readme, runs] = await Promise.all([
    settle("commits", gh<RawCommit[]>(`/repos/${fullName}/commits?per_page=40`, token), [] as RawCommit[], unavailable),
    settle("branches", gh<RawBranch[]>(`/repos/${fullName}/branches?per_page=100`, token), [] as RawBranch[], unavailable),
    settle("issues", gh<RawIssue[]>(`/repos/${fullName}/issues?state=all&per_page=60&sort=updated`, token), [] as RawIssue[], unavailable),
    settle("pulls", gh<RawPull[]>(`/repos/${fullName}/pulls?state=all&per_page=40&sort=updated&direction=desc`, token), [] as RawPull[], unavailable),
    settle("releases", gh<RawRelease[]>(`/repos/${fullName}/releases?per_page=15`, token), [] as RawRelease[], unavailable),
    settle("tags", gh<RawTag[]>(`/repos/${fullName}/tags?per_page=30`, token), [] as RawTag[], unavailable),
    settle("contributors", gh<RawContributor[]>(`/repos/${fullName}/contributors?per_page=30`, token), [] as RawContributor[], unavailable),
    settle("languages", gh<Record<string, number>>(`/repos/${fullName}/languages`, token), {} as Record<string, number>, unavailable),
    settle("readme", ghText(`/repos/${fullName}/readme`, token), null as string | null, unavailable),
    settle("actions", gh<{ workflow_runs: RawRun[] }>(`/repos/${fullName}/actions/runs?per_page=20`, token), { workflow_runs: [] as RawRun[] }, unavailable),
  ]);

  return {
    repo: {
      fullName: repo.full_name,
      name: repo.name,
      owner: { login: repo.owner.login, avatarUrl: repo.owner.avatar_url, url: repo.owner.html_url },
      description: repo.description,
      htmlUrl: repo.html_url,
      homepage: repo.homepage || null,
      defaultBranch: repo.default_branch,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.subscribers_count,
      openIssues: repo.open_issues_count,
      language: repo.language,
      license: repo.license ? (repo.license.spdx_id && repo.license.spdx_id !== "NOASSERTION" ? repo.license.spdx_id : repo.license.name) : null,
      topics: repo.topics ?? [],
      private: repo.private,
      archived: repo.archived,
      isFork: repo.fork,
      sizeKb: repo.size,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
    },
    commits: commits.map((c) => {
      const [first, ...rest] = c.commit.message.split("\n");
      return {
        sha: c.sha,
        message: first,
        body: rest.join("\n").trim(),
        author: c.author?.login ?? c.commit.author?.name ?? "unknown",
        authorAvatar: c.author?.avatar_url ?? null,
        authorUrl: c.author?.html_url ?? null,
        date: c.commit.author?.date ?? "",
        url: c.html_url,
        verified: Boolean(c.commit.verification?.verified),
        commentCount: c.commit.comment_count ?? 0,
      };
    }),
    branches: branches.map((b) => ({ name: b.name, sha: b.commit.sha, protected: b.protected, url: `${repo.html_url}/tree/${encodeURIComponent(b.name)}` })),
    issues: issues
      .filter((i) => !i.pull_request)
      .map((i) => ({
        number: i.number,
        title: i.title,
        state: i.state === "open" ? "open" : "closed",
        url: i.html_url,
        isPullRequest: false,
        labels: i.labels.map((l) => ({ name: l.name, color: l.color })),
        author: i.user?.login ?? "unknown",
        authorAvatar: i.user?.avatar_url ?? null,
        assignees: (i.assignees ?? []).map((a) => ({ login: a.login, avatarUrl: a.avatar_url })),
        comments: i.comments,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        closedAt: i.closed_at,
        milestone: i.milestone?.title ?? null,
      })),
    pulls: pulls.map((p) => ({
      number: p.number,
      title: p.title,
      state: p.merged_at ? "merged" : p.state === "open" ? "open" : "closed",
      draft: Boolean(p.draft),
      url: p.html_url,
      author: p.user?.login ?? "unknown",
      authorAvatar: p.user?.avatar_url ?? null,
      head: p.head.ref,
      base: p.base.ref,
      labels: p.labels.map((l) => ({ name: l.name, color: l.color })),
      reviewers: (p.requested_reviewers ?? []).map((r) => ({ login: r.login, avatarUrl: r.avatar_url })),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      mergedAt: p.merged_at,
      closedAt: p.closed_at,
    })),
    releases: releases.map((r) => ({
      id: r.id,
      tag: r.tag_name,
      name: r.name || r.tag_name,
      url: r.html_url,
      draft: r.draft,
      prerelease: r.prerelease,
      author: r.author?.login ?? "unknown",
      publishedAt: r.published_at,
      body: (r.body ?? "").slice(0, 2000),
      assets: r.assets?.length ?? 0,
    })),
    tags: tags.map((t) => ({ name: t.name, sha: t.commit.sha, zipUrl: t.zipball_url })),
    contributors: contributors.map((c) => ({ login: c.login, avatarUrl: c.avatar_url, url: c.html_url, contributions: c.contributions })),
    languages,
    readme,
    workflowRuns: runs.workflow_runs.map((r) => ({
      id: r.id,
      name: r.name,
      title: r.display_title,
      status: r.status,
      conclusion: r.conclusion,
      branch: r.head_branch,
      event: r.event,
      actor: r.actor?.login ?? "unknown",
      runNumber: r.run_number,
      url: r.html_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
    unavailable,
    fetchedAt: new Date().toISOString(),
  };
}
