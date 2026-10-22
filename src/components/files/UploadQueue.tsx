"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, RotateCw, X } from "lucide-react";
import { formatBytes } from "@/lib/client";
import { IconButton, ProgressBar } from "@/components/ui";

export type UploadJob = {
  id: number;
  file: File;
  folder: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

/** Floating upload panel, bottom-right (full width on phones). */
export function UploadQueue({ jobs, onRetry, onDismiss, onClear }: { jobs: UploadJob[]; onRetry: (id: number) => void; onDismiss: (id: number) => void; onClear: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  if (jobs.length === 0) return null;
  const active = jobs.filter((j) => j.status === "uploading").length;
  const failed = jobs.filter((j) => j.status === "error").length;
  const title = active ? `Uploading ${active} file${active === 1 ? "" : "s"}` : failed ? `${failed} upload${failed === 1 ? "" : "s"} failed` : "Uploads complete";
  return (
    <section aria-label="Upload queue" className="fixed inset-x-3 bottom-3 z-[var(--z-flag)] overflow-hidden rounded-card border border-line bg-canvas shadow-overlay sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[360px]">
      <header className="flex items-center gap-1 border-b border-line bg-surface px-3 py-1.5">
        <h2 className="min-w-0 flex-1 truncate text-body font-semibold text-ink" role="status">
          {title}
        </h2>
        <IconButton size="sm" title={collapsed ? "Expand" : "Collapse"} onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </IconButton>
        <IconButton size="sm" title={active ? "Dismiss finished" : "Close"} onClick={onClear}>
          <X size={16} />
        </IconButton>
      </header>
      {collapsed ? null : (
        <ul className="max-h-64 divide-y divide-line overflow-y-auto">
          {jobs.map((j) => (
            <li key={j.id} className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-body text-ink">{j.file.name}</span>
                  <span className="shrink-0 text-body-sm text-ink-muted">{formatBytes(j.file.size)}</span>
                </div>
                {j.status === "uploading" ? (
                  <ProgressBar value={j.progress} label={`Uploading ${j.file.name}`} size="sm" className="mt-1.5" />
                ) : j.status === "done" ? (
                  <p className="mt-0.5 flex items-center gap-1 text-body-sm text-success-text">
                    <CheckCircle2 size={12} /> Uploaded
                  </p>
                ) : (
                  <p className="mt-0.5 flex items-start gap-1 text-body-sm text-danger-text" role="alert">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" /> <span className="min-w-0">{j.error ?? "Upload failed"}</span>
                  </p>
                )}
              </div>
              {j.status === "uploading" ? (
                <span className="w-9 shrink-0 text-right text-body-sm text-ink-muted">{j.progress}%</span>
              ) : j.status === "error" ? (
                <>
                  <IconButton size="sm" title="Retry upload" onClick={() => onRetry(j.id)}>
                    <RotateCw size={14} />
                  </IconButton>
                  <IconButton size="sm" title="Dismiss" onClick={() => onDismiss(j.id)}>
                    <X size={14} />
                  </IconButton>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
