export type GitRepoInfo = {
  fullName: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  private: boolean;
  pushedAt: string;
};

export type GitCommit = {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
};

export type GitBranch = { name: string; sha: string; protected: boolean };

export type GitIssue = {
  number: number;
  title: string;
  state: string;
  url: string;
  isPullRequest: boolean;
  labels: { name: string; color: string }[];
  createdAt: string;
};

export type GitSnapshot = {
  repo: GitRepoInfo;
  commits: GitCommit[];
  branches: GitBranch[];
  issues: GitIssue[];
};

async function gh<T>(path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "devboard",
  };
  const t = token || process.env.GITHUB_TOKEN;
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`https://api.github.com${path}`, { headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status} for ${path}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export function parseRepo(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/github\.com[/:]([^/]+)\/([^/.\s]+)(?:\.git)?/i);
  if (urlMatch) return `${urlMatch[1]}/${urlMatch[2]}`;
  if (/^[\w.-]+\/[\w.-]+$/.test(trimmed)) return trimmed.replace(/\.git$/, "");
  return null;
}

export async function fetchGitSnapshot(fullName: string, token?: string): Promise<GitSnapshot> {
  type RawRepo = {
    full_name: string;
    description: string | null;
    html_url: string;
    default_branch: string;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
    language: string | null;
    private: boolean;
    pushed_at: string;
  };
  type RawCommit = {
    sha: string;
    html_url: string;
    commit: { message: string; author: { name: string; date: string } | null };
    author: { login: string } | null;
  };
  type RawBranch = { name: string; commit: { sha: string }; protected: boolean };
  type RawIssue = {
    number: number;
    title: string;
    state: string;
    html_url: string;
    pull_request?: unknown;
    labels: { name: string; color: string }[];
    created_at: string;
  };

  const [repo, commits, branches, issues] = await Promise.all([
    gh<RawRepo>(`/repos/${fullName}`, token),
    gh<RawCommit[]>(`/repos/${fullName}/commits?per_page=15`, token),
    gh<RawBranch[]>(`/repos/${fullName}/branches?per_page=30`, token),
    gh<RawIssue[]>(`/repos/${fullName}/issues?state=open&per_page=20`, token),
  ]);

  return {
    repo: {
      fullName: repo.full_name,
      description: repo.description,
      htmlUrl: repo.html_url,
      defaultBranch: repo.default_branch,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      language: repo.language,
      private: repo.private,
      pushedAt: repo.pushed_at,
    },
    commits: commits.map((c) => ({
      sha: c.sha,
      message: c.commit.message.split("\n")[0],
      author: c.author?.login ?? c.commit.author?.name ?? "unknown",
      date: c.commit.author?.date ?? "",
      url: c.html_url,
    })),
    branches: branches.map((b) => ({ name: b.name, sha: b.commit.sha, protected: b.protected })),
    issues: issues.map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      url: i.html_url,
      isPullRequest: Boolean(i.pull_request),
      labels: i.labels.map((l) => ({ name: l.name, color: l.color })),
      createdAt: i.created_at,
    })),
  };
}
