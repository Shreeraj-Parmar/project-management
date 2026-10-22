/** Helpers for quick links (label + url pairs stored on the board). */

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

/** Trimmed URL with a scheme added when none is given. Returns null when it is not a usable web address. */
export function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v || /\s/.test(v)) return null;
  const local = /^(localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?([/?#].*)?$/i.test(v);
  const hadScheme = !local && /^[a-z][a-z0-9+.-]*:/i.test(v);
  const withScheme = hadScheme ? v : `${local ? "http" : "https"}://${v}`;
  try {
    const u = new URL(withScheme);
    if (!SAFE_PROTOCOLS.has(u.protocol)) return null;
    // Without an explicit scheme a bare word ("foo") is almost certainly a typo, so require a dot.
    if (!hadScheme && !local && !u.hostname.includes(".")) return null;
    return withScheme;
  } catch {
    return null;
  }
}

/** href that is safe to render, or null (old data may hold anything the previous edit dialog accepted). */
export function safeHref(url: string): string | null {
  try {
    const u = new URL(url);
    return SAFE_PROTOCOLS.has(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Short display form: hostname plus path without the scheme. */
export function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol === "mailto:" || u.protocol === "tel:") return u.pathname;
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.hostname.replace(/^www\./, "")}${path}${u.search}`;
  } catch {
    return url;
  }
}

export function hostLabel(url: string): string {
  try {
    const u = new URL(url);
    return u.protocol === "mailto:" || u.protocol === "tel:" ? u.pathname : u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
