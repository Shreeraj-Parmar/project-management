export type Format = "bold" | "italic" | "heading" | "list" | "code" | "link" | "checklist";

export type EditResult = { text: string; start: number; end: number };

function wrap(text: string, s: number, e: number, left: string, right: string, placeholder: string): EditResult {
  const sel = text.slice(s, e) || placeholder;
  const out = text.slice(0, s) + left + sel + right + text.slice(e);
  return { text: out, start: s + left.length, end: s + left.length + sel.length };
}

function prefixLines(text: string, s: number, e: number, prefix: (i: number) => string, placeholder: string): EditResult {
  const lineStart = text.lastIndexOf("\n", s - 1) + 1;
  let lineEnd = text.indexOf("\n", e);
  if (lineEnd === -1) lineEnd = text.length;
  const block = text.slice(lineStart, lineEnd) || placeholder;
  const next = block
    .split("\n")
    .map((l, i) => prefix(i) + l)
    .join("\n");
  return { text: text.slice(0, lineStart) + next + text.slice(lineEnd), start: lineStart, end: lineStart + next.length };
}

/** Insert markdown syntax at the selection (or current lines for block formats). */
export function applyFormat(kind: Format, text: string, s: number, e: number): EditResult {
  switch (kind) {
    case "bold":
      return wrap(text, s, e, "**", "**", "bold text");
    case "italic":
      return wrap(text, s, e, "_", "_", "italic text");
    case "code": {
      const multi = text.slice(s, e).includes("\n");
      return multi ? wrap(text, s, e, "```\n", "\n```", "code") : wrap(text, s, e, "`", "`", "code");
    }
    case "link": {
      const r = wrap(text, s, e, "[", "](https://)", "link text");
      // select the url placeholder so it can be typed over
      const urlStart = r.end + 2;
      return { text: r.text, start: urlStart, end: urlStart + "https://".length };
    }
    case "heading":
      return prefixLines(text, s, e, () => "## ", "Heading");
    case "list":
      return prefixLines(text, s, e, () => "- ", "List item");
    case "checklist":
      return prefixLines(text, s, e, () => "- [ ] ", "Task");
  }
}

/** react-markdown has no GFM plugin here, so render task items with ballot glyphs. */
export function previewSource(md: string): string {
  return md.replace(/^(\s*)[-*] \[( |x|X)\] /gm, (_m, ws: string, c: string) => `${ws}- ${c === " " ? "☐" : "☑"} `);
}

export function snippet(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^(\s*)[-*] \[( |x|X)\] /gm, (_m, _w, c: string) => (c === " " ? "☐ " : "☑ "))
    .replace(/^\s*[-*>]\s+/gm, "")
    .replace(/[*_`]|\[([^\]]*)\]\([^)]*\)/g, (m, t) => t ?? "")
    .replace(/\s+/g, " ")
    .trim();
}
