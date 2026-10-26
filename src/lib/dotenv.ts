/** The .env line grammar shared by the server routes and the env page (paste, import, raw editor). */
export const LINE_RE = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/;

/** Strips surrounding quotes. Double-quoted values get JSON escapes (\n, \", \\) undone, the way our export writes them. */
export function unquote(raw: string): string {
  const v = raw.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    try {
      const parsed = JSON.parse(v);
      if (typeof parsed === "string") return parsed;
    } catch {
      /* not valid JSON (e.g. "C:\path"), fall back to dropping the quotes */
    }
    return v.slice(1, -1);
  }
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
  return v;
}

/** `KEY=value` -> { key, value }, or null for blank lines, comments and anything else. */
export function parseLine(line: string): { key: string; value: string } | null {
  const t = line.trim();
  if (!t || t.startsWith("#")) return null;
  const m = t.match(LINE_RE);
  return m ? { key: m[1], value: unquote(m[2]) } : null;
}

/** Every KEY=value pair in a block of text, later duplicates win. */
export function parseEnvText(raw: string): { key: string; value: string }[] {
  const out = new Map<string, string>();
  for (const line of raw.split(/\r?\n/)) {
    const p = parseLine(line);
    if (p) out.set(p.key, p.value);
  }
  return [...out].map(([key, value]) => ({ key, value }));
}

/** Tags as stored: trimmed, lowercase, unique, at most 10 of 32 characters. */
export function cleanTags(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const t of input) {
    if (typeof t !== "string") continue;
    const s = t.trim().toLowerCase().slice(0, 32);
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= 10) break;
  }
  return out;
}
