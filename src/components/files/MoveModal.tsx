"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Folder, FolderInput, Home } from "lucide-react";
import { cn } from "@/lib/client";
import { Button, Modal, SearchInput } from "@/components/ui";

export type MoveSubject = { kind: "file"; name: string; folder: string } | { kind: "folder"; name: string; path: string };

/** Pick a destination folder for a file or folder. `paths` = every folder path in the project. */
export function MoveModal({ subject, root, paths, onMove, onClose }: { subject: MoveSubject; root: string; paths: string[]; onMove: (target: string) => Promise<void>; onClose: () => void }) {
  const current = subject.kind === "file" ? subject.folder : subject.path.includes("/") ? subject.path.slice(0, subject.path.lastIndexOf("/")) : "";
  const [target, setTarget] = useState<string>(current);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ["", ...paths]
      .filter((p) => (subject.kind === "folder" ? p !== subject.path && !p.startsWith(subject.path + "/") : true))
      .filter((p) => !q || p.toLowerCase().includes(q))
      .sort((a, b) => a.localeCompare(b));
  }, [paths, query, subject]);

  const unchanged = target === current;

  async function submit() {
    if (unchanged) return onClose();
    setBusy(true);
    setError(null);
    try {
      await onMove(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't move. Try again.");
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Move ${subject.kind === "folder" ? "folder" : "file"}`}
      description={
        <>
          Choose where <strong className="font-semibold text-ink">{subject.name}</strong> should go.
        </>
      }
      size="small"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button icon={<FolderInput size={16} />} loading={busy} disabled={unchanged} onClick={submit}>
            Move here
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {paths.length > 6 ? <SearchInput value={query} onValueChange={setQuery} placeholder="Find a folder" /> : null}
        <ul role="listbox" aria-label="Destination folder" className="max-h-72 overflow-y-auto rounded-card border border-line">
          {options.map((p) => {
            const depth = p ? p.split("/").length : 0;
            const name = p ? p.split("/").pop()! : root;
            const selected = p === target;
            const isCurrent = p === current;
            return (
              <li key={p || "__root"} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => setTarget(p)}
                  onDoubleClick={() => !isCurrent && submit()}
                  className={cn(
                    "flex w-full items-center gap-2 border-b border-line px-3 py-2 text-left text-body last:border-0 transition-colors",
                    selected ? "bg-brand-soft text-brand-dark" : "hover:bg-fill-subtle",
                  )}
                  style={{ paddingLeft: 12 + (query ? 0 : depth) * 16 }}
                >
                  {query && depth > 0 ? <ChevronRight size={12} className="hidden" /> : null}
                  {p ? <Folder size={16} className="shrink-0 text-orange-700" /> : <Home size={16} className="shrink-0 text-ink-soft" />}
                  <span className="min-w-0 flex-1 truncate font-medium">{query ? p || root : name}</span>
                  {isCurrent ? <span className="shrink-0 text-body-sm text-ink-muted">Current</span> : null}
                </button>
              </li>
            );
          })}
          {options.length === 0 ? <li className="px-3 py-6 text-center text-body-sm text-ink-muted">No folder matches.</li> : null}
        </ul>
        {error ? (
          <p role="alert" className="text-body-sm text-danger-text">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
