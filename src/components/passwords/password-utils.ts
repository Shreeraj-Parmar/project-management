import { copyToClipboard } from "@/lib/client";

/* -------------------------------------------------------------------------------------------------
 * Pure helpers for the Passwords module: generator, strength estimate, URL classification, clipboard.
 * Nothing in here logs, stores or transmits a secret.
 * ------------------------------------------------------------------------------------------------- */

/** A revealed secret hides itself again after this long. */
export const REVEAL_MS = 30_000;

/* ---------- generator ---------- */

export type GeneratorOptions = { length: number; upper: boolean; lower: boolean; digits: boolean; symbols: boolean };

export const MIN_LENGTH = 8;
export const MAX_LENGTH = 64;
export const DEFAULT_GENERATOR: GeneratorOptions = { length: 20, upper: true, lower: true, digits: true, symbols: true };

// Ambiguous characters (I, O, l, 0, 1) are left out so a generated password can be read aloud or typed from a screen.
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*-_=+";

/** Uniform random integer in [0, max) without modulo bias. */
function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

export function clampLength(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_GENERATOR.length;
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(n)));
}

/** Cryptographically random password that contains at least one character of every enabled class. */
export function generatePassword(opts: GeneratorOptions = DEFAULT_GENERATOR): string {
  const pools = [opts.upper && UPPER, opts.lower && LOWER, opts.digits && DIGITS, opts.symbols && SYMBOLS].filter(Boolean) as string[];
  if (pools.length === 0) pools.push(LOWER);
  const len = clampLength(opts.length);
  const all = pools.join("");
  const chars = pools.map((p) => p[randomInt(p.length)]);
  while (chars.length < len) chars.push(all[randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, len).join("");
}

/* ---------- strength ---------- */

export type StrengthTone = "danger" | "warning" | "success";
export type Strength = {
  /** 0 to 100, drives the bar. */
  score: number;
  label: "Weak" | "Fair" | "Strong";
  tone: StrengthTone;
  /** Rough entropy estimate, bits. */
  bits: number;
};

const COMMON = /^(password|passw0rd|qwerty|letmein|admin|welcome|changeme|iloveyou|123456|abc123|111111)/i;

/**
 * Rough, dependency-free strength estimate (entropy from character classes, discounted for repeated
 * characters and common words). It guides the user; it never blocks saving, because API keys and
 * legacy passwords are stored as they are.
 */
export function estimateStrength(pw: string): Strength | null {
  if (!pw) return null;
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
  const len = pw.length;
  const uniq = new Set(pw).size;
  const effective = Math.min(len, uniq + (len - uniq) * 0.25);
  let bits = effective * Math.log2(Math.max(pool, 2));
  if (COMMON.test(pw)) bits = Math.min(bits, 28);
  if (/^(.)\1+$/.test(pw)) bits = Math.min(bits, 8);
  if (len < 8) bits = Math.min(bits, 30);
  const score = Math.max(6, Math.min(100, Math.round((bits / 90) * 100)));
  if (bits < 40) return { score, label: "Weak", tone: "danger", bits };
  if (bits < 64) return { score, label: "Fair", tone: "warning", bits };
  return { score, label: "Strong", tone: "success", bits };
}

/** Bar fill colours (ADS scale steps with enough contrast against the neutral track). */
export const STRENGTH_COLOR: Record<StrengthTone, string> = {
  danger: "var(--color-red-600)",
  warning: "var(--color-yellow-500)",
  success: "var(--color-green-700)",
};
export const STRENGTH_TEXT: Record<StrengthTone, string> = {
  danger: "text-danger-text",
  warning: "text-warning",
  success: "text-success-text",
};

/* ---------- URL / host ---------- */

export type LinkInfo =
  | { kind: "web"; href: string; label: string }
  /** Anything that is not a web address: an IP, "host:port" or "ssh user@host". Shown as a copyable chip. */
  | { kind: "host"; label: string };

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}(:\d{1,5})?([/?#]\S*)?$/;
const BARE_DOMAIN = /^(www\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d{1,5})?([/?#]\S*)?$/i;

function webLabel(u: URL): string {
  const path = u.pathname === "/" ? "" : u.pathname;
  return `${u.host}${path}${u.search}${u.hash}`;
}

/** Decide how to render the free-text "URL / host" field. Only http(s) addresses become links. */
export function classifyUrl(raw: string): LinkInfo | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\/\S+$/i.test(v)) {
    try {
      const u = new URL(v);
      if (u.protocol === "http:" || u.protocol === "https:") return { kind: "web", href: u.href, label: webLabel(u) };
    } catch {
      /* fall through to host */
    }
    return { kind: "host", label: v };
  }
  if (!IPV4.test(v) && BARE_DOMAIN.test(v)) {
    try {
      const u = new URL(`https://${v}`);
      return { kind: "web", href: u.href, label: webLabel(u) };
    } catch {
      /* fall through to host */
    }
  }
  return { kind: "host", label: v };
}

/** Soft hint for the URL field. Returns null when the value is fine (or empty). Never blocks saving. */
export function urlHint(raw: string): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) {
    try {
      const { hostname } = new URL(v);
      const hasDomain = hostname.includes(".") || hostname === "localhost";
      return hasDomain ? null : "That address has no domain. Check it, or save it as it is.";
    } catch {
      return "That doesn't look like a valid web address. Check it, or save it as it is.";
    }
  }
  if (/^h?t?tps?(:|\/)/i.test(v)) return "Web addresses start with http:// or https://. You can still save it as it is.";
  return null;
}

/* ---------- dates ---------- */

/** "Jun 14, 2026, 10:00 AM" for a time element's title. Empty string for an invalid date. */
export function fullDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/* ---------- clipboard ---------- */

/**
 * Copy text, or text that is still being fetched. Passing the promise straight to ClipboardItem keeps
 * the user gesture alive in Safari while the secret is being decrypted. Falls back to writeText.
 * Rejects only when `source` rejects; resolves false when the browser refuses clipboard access.
 */
export async function copyText(source: string | Promise<string>): Promise<boolean> {
  if (typeof source === "string") return copyToClipboard(source);
  const state: { failed: boolean; error: unknown } = { failed: false, error: undefined };
  const tracked = source.catch((error: unknown) => {
    state.failed = true;
    state.error = error;
    throw error;
  });
  tracked.catch(() => {});
  if (typeof ClipboardItem !== "undefined" && typeof navigator !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": tracked.then((t) => new Blob([t], { type: "text/plain" })) })]);
      return true;
    } catch {
      if (state.failed) throw state.error;
    }
  }
  return copyToClipboard(await tracked);
}
