"use client";

import { useEffect, useState } from "react";
import { File, FileArchive, FileCode, FileImage, FileText } from "lucide-react";
import { api } from "@/lib/client";
import type { FileItem } from "@/lib/types";

export type FileKind = "image" | "archive" | "code" | "doc" | "other";

export function kindOf(f: Pick<FileItem, "name" | "contentType">): FileKind {
  const t = f.contentType || "";
  const n = f.name.toLowerCase();
  if (t.startsWith("image/")) return "image";
  if (/zip|tar|gzip|rar|7z/.test(t) || /\.(zip|tar|gz|rar|7z)$/.test(n)) return "archive";
  if (/json|javascript|typescript|xml|yaml|html|css/.test(t) || /\.(js|ts|tsx|jsx|json|yml|yaml|env|sh|py|go|rs|sql)$/.test(n)) return "code";
  if (/pdf|text|document|sheet|presentation/.test(t) || /\.(pdf|md|txt|docx?|xlsx?|csv)$/.test(n)) return "doc";
  return "other";
}

const TILE: Record<FileKind, { bg: string; fg: string; Icon: typeof File }> = {
  image: { bg: "var(--color-magenta-100)", fg: "var(--color-magenta-800)", Icon: FileImage },
  archive: { bg: "var(--color-yellow-100)", fg: "var(--color-yellow-900)", Icon: FileArchive },
  code: { bg: "var(--color-green-100)", fg: "var(--color-green-800)", Icon: FileCode },
  doc: { bg: "var(--color-blue-100)", fg: "var(--color-blue-800)", Icon: FileText },
  other: { bg: "var(--color-neutral-200)", fg: "var(--color-neutral-800)", Icon: File },
};

/** Rounded file-type icon tile. */
export function FileTile({ file, size = 32 }: { file: Pick<FileItem, "name" | "contentType">; size?: number }) {
  const t = TILE[kindOf(file)];
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-card" style={{ width: size, height: size, background: t.bg, color: t.fg }}>
      <t.Icon size={Math.round(size * 0.55)} />
    </span>
  );
}

const urlCache = new Map<string, { url: string; at: number }>();

/** Presigned download url for a file, cached for a few minutes. `enabled=false` skips the request. */
export function useFileUrl(base: string, id: string, enabled: boolean) {
  const key = `${base}/${id}`;
  const [url, setUrl] = useState<string | null>(() => {
    const hit = urlCache.get(key);
    return hit && Date.now() - hit.at < 4 * 60_000 ? hit.url : null;
  });
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled || url) return;
    let cancelled = false;
    api
      .get<{ url: string }>(key)
      .then((r) => {
        urlCache.set(key, { url: r.url, at: Date.now() });
        if (!cancelled) setUrl(r.url);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [enabled, key, url]);
  return { url, failed };
}
