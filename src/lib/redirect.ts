/** Pages of this app that may be used as a post-login destination. */
const ALLOWED_PREFIXES = ["/boards"];

/**
 * Only allow same-origin paths that belong to this app. Anything else
 * (unknown routes like /gallery/media, absolute URLs, //host, backslashes)
 * falls back to /boards, so login never lands on a 404 or an external site.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/boards"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  const path = raw.split(/[?#]/)[0];
  const ok = ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
  return ok ? raw : fallback;
}
