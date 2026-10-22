/** Turn the server's GitHub error text into specific, actionable copy. */
export function explainGitError(raw: string | undefined, hasToken: boolean, globalToken: boolean): { title: string; body: string } {
  const text = raw ?? "";
  const status = Number(text.match(/GitHub API (\d{3})/)?.[1] ?? 0);
  const lower = text.toLowerCase();
  if (status === 404) return { title: "Repository not found", body: "Check the owner and name. If the repository is private, add an access token that can read it." };
  if (status === 429 || (status === 403 && lower.includes("rate limit"))) {
    return {
      title: "GitHub rate limit reached",
      body: hasToken || globalToken ? "Too many requests for now. Wait a few minutes and refresh." : "Unauthenticated requests are limited. Add an access token to raise the limit, or wait a few minutes.",
    };
  }
  if (status === 401 || status === 403) return { title: "GitHub refused the access token", body: "The token is missing, expired or lacks permission. Update it with a token that has read access to this repository." };
  if (!status && /fetch failed|network|ENOTFOUND|ECONN/i.test(text)) return { title: "Couldn't reach GitHub", body: "The server couldn't connect to GitHub. Check the network and try again." };
  return { title: "Couldn't load repository data", body: text || "Something went wrong while contacting GitHub." };
}

export function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export const REPO_RE = /^(?:(?:https?:\/\/)?(?:www\.)?github\.com[/:])?[\w.-]+\/[\w.-]+?(?:\.git)?\/?$/i;
