import { ENVIRONMENTS } from "@/lib/constants";
import { copyToClipboard } from "@/lib/client";
import { LINE_RE, unquote } from "@/lib/dotenv";
import type { EnvVar } from "@/lib/types";

/** Fixed-length mask. Never reveals the real length of a secret. */
export const MASK = "••••••••••••";

/** Values revealed in the table hide again after this long. */
export const REVEAL_MS = 30_000;

export function normalizeKey(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, "_");
}

/** Returns an error message, or null when the key is acceptable. An empty key is not an error here. */
export function validateKey(key: string): string | null {
  if (!key) return null;
  if (/^[0-9]/.test(key)) return "A key can't start with a number.";
  if (/[^A-Z0-9_]/.test(key)) return "Use only letters, numbers and underscores.";
  if (key.length > 128) return "A key can be at most 128 characters.";
  return null;
}

export function normalizeEnvName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

export function validateEnvName(name: string, existing: readonly string[]): string | null {
  if (!name) return "Enter a name, for example preview.";
  if (existing.includes(name)) return `${name} already exists.`;
  return null;
}

/** development, staging, production, test first (in that order), custom environments after, A to Z. */
export function sortEnvironments(envs: Iterable<string>): string[] {
  const known: string[] = ENVIRONMENTS as unknown as string[];
  const all = [...new Set(envs)];
  const first = known.filter((e) => all.includes(e));
  const rest = all.filter((e) => !known.includes(e)).sort((a, b) => a.localeCompare(b));
  return [...first, ...rest];
}

export type ParsedEntry = { key: string; value: string; line: number; overwrite: boolean; repeated: boolean };
export type ParsedEnv = {
  entries: ParsedEntry[];
  /** Lines that are neither blank, nor a comment, nor KEY=VALUE. */
  ignored: { line: number; text: string }[];
  comments: number;
};

/** Mirrors the server import so the preview shows exactly what will be written. Later duplicates win. */
export function parseEnv(raw: string, existing: ReadonlySet<string>): ParsedEnv {
  const entries = new Map<string, ParsedEntry>();
  const ignored: ParsedEnv["ignored"] = [];
  let comments = 0;
  raw.split(/\r?\n/).forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("#")) {
      comments++;
      return;
    }
    const m = trimmed.match(LINE_RE);
    if (!m) {
      ignored.push({ line: i + 1, text: trimmed });
      return;
    }
    const value = unquote(m[2]);
    const prev = entries.get(m[1]);
    entries.set(m[1], { key: m[1], value, line: i + 1, overwrite: existing.has(m[1]), repeated: !!prev });
  });
  return { entries: [...entries.values()], ignored, comments };
}

/** Splits a single pasted `KEY=value` line, or returns null. */
export function parseSingleLine(text: string): { key: string; value: string } | null {
  const t = text.trim();
  if (!t || /\r?\n/.test(t)) return null;
  const m = t.match(LINE_RE);
  if (!m) return null;
  return { key: normalizeKey(m[1]), value: unquote(m[2]) };
}

/** One `KEY=value` line, quoting (JSON style) when the value has spaces, quotes, # or newlines. */
export function envLine(key: string, value: string): string {
  return `${key}=${/[\s#"']/.test(value) ? JSON.stringify(value) : value}`;
}

/** `.env` text for the given variables (values must be revealed). Notes become comments above the key. */
export function serializeEnv(vars: Pick<EnvVar, "key" | "value" | "note">[]): string {
  if (vars.length === 0) return "";
  const body = vars
    .map((v) => `${v.note ? `# ${v.note.replace(/\r?\n/g, " ")}\n` : ""}${envLine(v.key, v.value)}`)
    .join("\n");
  return body + "\n";
}

/** Clipboard with a legacy fallback for non-secure origins. */
export async function copyText(text: string): Promise<boolean> {
  if (await copyToClipboard(text)) return true;
  const active = document.activeElement as HTMLElement | null;
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  } finally {
    active?.focus?.({ preventScroll: true });
  }
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** development -> Development (the stored name is untouched). */
export function envLabel(env: string): string {
  return env.charAt(0).toUpperCase() + env.slice(1);
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

export function errMessage(err: unknown, fallback = "Something went wrong. Try again."): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
