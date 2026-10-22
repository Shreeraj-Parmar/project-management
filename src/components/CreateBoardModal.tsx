"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Info } from "lucide-react";
import { api, cn } from "@/lib/client";
import { BOARD_COLORS, BOARD_TEMPLATES } from "@/lib/constants";
import type { Project } from "@/lib/types";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input, Textarea } from "./ui/Field";
import { TagInput } from "./ui/TagInput";
import { useToast } from "./ui/Toast";

const TITLE_MAX = 120;

/**
 * Trello-style "Create board" dialog: live preview, background picker,
 * title with inline validation, list template, optional description & tags.
 */
export function CreateBoardModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (p: Project) => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const titleId = useId();
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(BOARD_COLORS[0].id);
  const [template, setTemplate] = useState(BOARD_TEMPLATES[0].id);
  const [tags, setTags] = useState<string[]>([]);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);

  // Fresh form every time the dialog is opened.
  useEffect(() => {
    if (!open) return;
    setName("");
    setTouched(false);
    setDescription("");
    setColor(BOARD_COLORS[0].id);
    setTemplate(BOARD_TEMPLATES[0].id);
    setTags([]);
    setMore(false);
  }, [open]);

  const trimmed = name.trim();
  const titleError = !trimmed ? "Board title is required" : trimmed.length > TITLE_MAX ? `Keep the title under ${TITLE_MAX} characters` : null;
  const showError = touched && titleError;
  const bg = BOARD_COLORS.find((c) => c.id === color)?.css;
  const tpl = BOARD_TEMPLATES.find((t) => t.id === template) ?? BOARD_TEMPLATES[0];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (titleError) return;
    setBusy(true);
    try {
      const p = await api.post<Project>("/api/projects", { name: trimmed, description, color, tags, template });
      toast(`Board "${p.name}" created`, "success");
      onClose();
      onCreated?.(p);
      router.push(`/boards/${p._id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create board", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create board" description="A board is one project. It holds that project's tasks, env vars, passwords, files, notes, spending and git repo." width="max-w-md">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {/* Live preview */}
        <div className="flex h-[120px] items-center justify-center rounded-lg transition-all" style={{ background: bg }}>
          <div className="w-[200px] rounded-md bg-white/20 p-2 shadow-sm backdrop-blur-[2px]">
            <div className="mb-1.5 h-2 w-16 rounded bg-white/90" />
            <div className="flex gap-1.5">
              {tpl.columns.slice(0, 4).map((c, i) => (
                <div key={c.id} className="flex-1 rounded bg-white/40 p-1">
                  <div className="mb-1 h-1 w-2/3 rounded bg-white/90" />
                  {Array.from({ length: (i % 3) + 1 }).map((_, j) => (
                    <div key={j} className="mb-1 h-2.5 rounded-sm bg-white/90" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Background */}
        <div>
          <label className="t-label">Background</label>
          <div className="grid grid-cols-5 gap-2">
            {BOARD_COLORS.map((c) => (
              <button
                type="button"
                key={c.id}
                title={c.label}
                aria-label={c.label}
                aria-pressed={c.id === color}
                onClick={() => setColor(c.id)}
                className={cn("relative h-9 rounded-md transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2", c.id === color && "ring-2 ring-brand ring-offset-2")}
                style={{ background: c.css }}
              >
                {c.id === color ? <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow" /> : null}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor={titleId} className="t-label">
            Board title <span className="text-danger">*</span>
          </label>
          <Input
            id={titleId}
            autoFocus
            value={name}
            maxLength={TITLE_MAX + 20}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. SaaS dashboard, Portfolio site, Client API"
            aria-invalid={showError ? "true" : undefined}
            aria-describedby={showError ? `${titleId}-err` : undefined}
          />
          {showError ? (
            <p id={`${titleId}-err`} className="mt-1.5 text-[13px] text-ink-soft">
              👋 {titleError}
            </p>
          ) : null}
        </div>

        {/* Lists template */}
        <div>
          <label className="t-label">Start with lists</label>
          <div className="grid grid-cols-2 gap-2">
            {BOARD_TEMPLATES.map((t) => {
              const active = t.id === template;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left transition",
                    active ? "border-brand bg-brand-soft" : "border-line bg-white hover:bg-surface"
                  )}
                >
                  <div className={cn("text-[13px] font-semibold", active ? "text-brand-dark" : "text-ink")}>{t.label}</div>
                  <div className="truncate text-[11px] text-ink-muted">{t.description}</div>
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-muted">
            <Info size={11} /> You can rename, add or remove lists later on the Tasks page.
          </p>
        </div>

        {/* Optional details */}
        {more ? (
          <div className="space-y-3">
            <div>
              <label className="t-label">
                Description <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" className="min-h-[64px]" />
            </div>
            <div>
              <label className="t-label">
                Tags <span className="font-normal text-ink-muted">(optional — press Enter to add)</span>
              </label>
              <TagInput value={tags} onChange={setTags} placeholder="nextjs, mongodb, side-project" />
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setMore(true)} className="text-[13px] font-semibold text-brand hover:underline">
            + Add description and tags
          </button>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button type="submit" className="w-full" loading={busy} disabled={!trimmed}>
            Create board
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
