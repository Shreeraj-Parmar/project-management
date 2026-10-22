"use client";

import { useMemo, useRef, useState } from "react";
import { FileUp, Upload } from "lucide-react";
import { cn } from "@/lib/client";
import { Button, Field, Lozenge, Modal, SectionMessage, Textarea, useToast } from "@/components/ui";
import { EnvChoiceFields, useEnvChoice } from "./EnvChoice";
import { errMessage, parseEnv, plural } from "./utils";

const MAX_FILE = 1024 * 1024;
const PREVIEW_ROWS = 200;

/**
 * Import .env: paste text or drop a file, see exactly what will be written (new keys, overwrites, ignored lines),
 * then import. The preview uses the same grammar as the server.
 */
export function ImportModal({
  environments,
  defaultEnv,
  initialText = "",
  keysIn,
  onImport,
  onClose,
}: {
  environments: string[];
  defaultEnv: string;
  initialText?: string;
  /** Keys that already exist in an environment. */
  keysIn: (env: string) => ReadonlySet<string>;
  /** `count` = distinct keys in the text (what will exist afterwards). */
  onImport: (raw: string, environment: string, count: number) => Promise<void>;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [raw, setRaw] = useState(initialText);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const env = useEnvChoice(defaultEnv);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const existing = useMemo(() => (env.resolved ? keysIn(env.resolved) : new Set<string>()), [env.resolved, keysIn]);
  const parsed = useMemo(() => parseEnv(raw, existing), [raw, existing]);
  const count = parsed.entries.length;
  const overwrites = parsed.entries.filter((e) => e.overwrite).length;
  const canImport = count > 0 && !!env.resolved && !busy;

  async function loadFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE) {
      toast(`${file.name} is larger than 1 MB. Paste the part you need instead.`, "error");
      return;
    }
    try {
      const text = await file.text();
      setRaw(text);
      setFileName(file.name);
      setError(null);
    } catch {
      toast(`Couldn't read ${file.name}.`, "error");
    }
  }

  async function submit() {
    if (!canImport) return;
    setBusy(true);
    setError(null);
    try {
      await onImport(raw, env.resolved, count);
    } catch (err) {
      setError(errMessage(err, "Couldn't import the variables. Try again."));
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Import .env"
      description="Paste a .env file or drop it here. Nothing is saved until you import."
      size="large"
      footer={
        <>
          <Button type="button" variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" icon={<Upload size={16} />} loading={busy} disabled={!canImport} onClick={submit}>
            {count > 0 ? `Import ${plural(count, "variable")}` : "Import"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? (
          <SectionMessage appearance="error" title="Couldn't import">
            {error}
          </SectionMessage>
        ) : null}
        <EnvChoiceFields environments={environments} state={env} label="Import into" className="sm:max-w-xs" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Field label="Paste .env contents" helper={fileName ? `Loaded from ${fileName}.` : "Or drop a .env file here, or choose one."}>
              {(p) => (
                <div
                  className="relative"
                  onDragEnter={(e) => {
                    if (!e.dataTransfer.types.includes("Files")) return;
                    dragDepth.current++;
                    setDragging(true);
                  }}
                  onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
                  onDragLeave={() => {
                    dragDepth.current = Math.max(0, dragDepth.current - 1);
                    if (dragDepth.current === 0) setDragging(false);
                  }}
                  onDrop={(e) => {
                    if (!e.dataTransfer.files.length) return;
                    e.preventDefault();
                    dragDepth.current = 0;
                    setDragging(false);
                    void loadFile(e.dataTransfer.files[0]);
                  }}
                >
                  <Textarea
                    {...p}
                    data-autofocus
                    className="min-h-[160px] resize-y font-mono text-[13px] leading-5 md:min-h-[264px]"
                    value={raw}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder={"# comments are ignored\nDATABASE_URL=postgres://localhost/app\nNEXT_PUBLIC_API=https://api.example.com"}
                    onChange={(e) => {
                      setRaw(e.target.value);
                      setFileName(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void submit();
                      }
                    }}
                  />
                  {dragging ? (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed border-brand bg-brand-soft/90 text-brand">
                      <FileUp size={24} aria-hidden />
                      <span className="text-body font-semibold">Drop to load the file</span>
                    </div>
                  ) : null}
                </div>
              )}
            </Field>
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              tabIndex={-1}
              aria-label="Choose a .env file"
              onChange={(e) => (void loadFile(e.target.files?.[0]), (e.target.value = ""))}
            />
            <Button type="button" variant="secondary" size="md" icon={<FileUp size={16} />} className="mt-2" onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
          </div>

          <div className="min-w-0">
            <div className="t-label">Preview</div>
            <div className="flex min-h-[132px] flex-col rounded-control border border-line bg-surface/60 md:min-h-[264px]" aria-live="polite">
              {raw.trim() === "" ? (
                <p className="m-auto max-w-[220px] px-4 text-center text-body text-ink-muted">
                  Variables you paste show up here, with what will happen to each one.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-3 py-2 text-body-sm text-ink-soft">
                    <span className="font-semibold text-ink">{plural(count, "variable")}</span>
                    {overwrites > 0 ? <span className="text-warning">{overwrites} will overwrite existing keys</span> : count > 0 ? <span>All new</span> : null}
                    {parsed.ignored.length > 0 ? <span>{plural(parsed.ignored.length, "line")} ignored</span> : null}
                  </div>
                  {count === 0 ? (
                    <p className="m-auto max-w-[240px] px-4 py-6 text-center text-body text-ink-muted">
                      No KEY=VALUE lines found. Lines look like DATABASE_URL=value.
                    </p>
                  ) : (
                    <ul className="max-h-[216px] flex-1 overflow-auto py-1">
                      {parsed.entries.slice(0, PREVIEW_ROWS).map((e) => (
                        <li key={e.key} className="flex items-center gap-2 px-3 py-1">
                          <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink">{e.key}</span>
                          {e.repeated ? <span className="shrink-0 text-body-sm text-ink-muted">repeated</span> : null}
                          <Lozenge appearance={e.overwrite ? "moved" : "success"} className="shrink-0">
                            {e.overwrite ? "Overwrite" : "New"}
                          </Lozenge>
                        </li>
                      ))}
                      {count > PREVIEW_ROWS ? <li className="px-3 py-1 text-body-sm text-ink-muted">and {count - PREVIEW_ROWS} more</li> : null}
                    </ul>
                  )}
                  {parsed.ignored.length > 0 ? (
                    <div className={cn("border-t border-line px-3 py-2 text-body-sm text-ink-muted")}>
                      <div className="mb-1 font-semibold text-ink-soft">Ignored</div>
                      <ul className="max-h-16 space-y-0.5 overflow-auto">
                        {parsed.ignored.slice(0, 20).map((l) => (
                          <li key={l.line} className="truncate">
                            Line {l.line}: <span className="font-mono">{l.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </div>
            <p className="mt-1 text-body-sm text-ink-muted">
              New variables are imported as secrets. Existing keys keep their note and visibility, only the value changes.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
