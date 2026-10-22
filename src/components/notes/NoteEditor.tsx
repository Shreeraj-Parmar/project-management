"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, Bold, Check, Code, Heading2, Italic, Link2, List, ListChecks, Palette, Pin, PinOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/client";
import { NOTE_COLORS } from "@/lib/constants";
import type { Note } from "@/lib/types";
import { Button, IconButton, InlineEdit, Popover, Tabs } from "@/components/ui";
import { applyFormat, previewSource, type Format } from "./markdown";

type Mode = "edit" | "split" | "preview";
const TOOLS: { kind: Format; title: string; icon: React.ReactNode }[] = [
  { kind: "bold", title: "Bold", icon: <Bold size={16} /> },
  { kind: "italic", title: "Italic", icon: <Italic size={16} /> },
  { kind: "heading", title: "Heading", icon: <Heading2 size={16} /> },
  { kind: "list", title: "Bulleted list", icon: <List size={16} /> },
  { kind: "checklist", title: "Checklist", icon: <ListChecks size={16} /> },
  { kind: "code", title: "Code", icon: <Code size={16} /> },
  { kind: "link", title: "Link", icon: <Link2 size={16} /> },
];
const AUTOSAVE_MS = 600;

export function NoteEditor({ note, onChange, onDelete, onBack }: { note: Note; onChange: (p: Partial<Note>) => void; onDelete: () => void; onBack: () => void }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [mode, setMode] = useState<Mode>(() => (note.content && typeof window !== "undefined" && window.innerWidth >= 1024 ? "split" : note.content ? "preview" : "edit"));
  const [saving, setSaving] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ title: note.title, content: note.content });
  const savedRef = useRef({ title: note.title, content: note.content });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const { title: t, content: c } = latest.current;
    if (t === savedRef.current.title && c === savedRef.current.content) return;
    savedRef.current = { title: t, content: c };
    onChangeRef.current({ title: t.trim() || "Untitled note", content: c });
    setSaving(false);
  }, []);

  const schedule = useCallback(
    (t: string, c: string) => {
      latest.current = { title: t, content: c };
      if (t === savedRef.current.title && c === savedRef.current.content) {
        if (timer.current) clearTimeout(timer.current);
        setSaving(false);
        return;
      }
      setSaving(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_MS);
    },
    [flush]
  );

  // never lose edits: save on unmount (switching notes) and when the tab is hidden or closed
  useEffect(() => {
    const hide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  const setC = (c: string) => {
    setContent(c);
    schedule(latest.current.title, c);
  };
  const setT = (t: string) => {
    setTitle(t);
    schedule(t, latest.current.content);
  };

  function format(kind: Format) {
    const el = area.current;
    if (!el) return;
    const r = applyFormat(kind, el.value, el.selectionStart, el.selectionEnd);
    setC(r.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.start, r.end);
    });
  }

  const showEditor = mode !== "preview";
  const showPreview = mode !== "edit";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas max-lg:fixed max-lg:inset-0 max-lg:z-[var(--z-drawer)] lg:rounded-card lg:border lg:border-line">
      <div aria-hidden className="h-1 shrink-0" style={{ background: note.color }} />
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-line px-3 py-1.5">
        <Button variant="subtle" size="sm" icon={<ArrowLeft size={16} />} onClick={onBack} className="lg:hidden">
          Notes
        </Button>
        <span className="flex items-center gap-1 text-body-sm text-ink-muted" role="status">
          {saving ? "Saving..." : (<><Check size={12} /> Saved</>)}
        </span>
        <div className="ml-auto flex items-center gap-0.5">
          <Popover
            title="Note colour"
            width={216}
            trigger={
              <IconButton title="Note colour">
                <Palette size={16} />
              </IconButton>
            }
          >
            <div className="grid grid-cols-4 gap-2 p-1">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={`Colour ${c}`}
                  aria-pressed={note.color === c}
                  onClick={() => onChange({ color: c })}
                  className={cn("flex h-8 items-center justify-center rounded-control border border-black/15", note.color === c && "ring-2 ring-brand ring-offset-1")}
                  style={{ background: c }}
                >
                  {note.color === c ? <Check size={14} className="text-ink" /> : null}
                </button>
              ))}
            </div>
          </Popover>
          <IconButton title={note.pinned ? "Unpin note" : "Pin note"} active={note.pinned} onClick={() => onChange({ pinned: !note.pinned })}>
            {note.pinned ? <PinOff size={16} /> : <Pin size={16} />}
          </IconButton>
          <IconButton title="Delete note" onClick={onDelete}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      <div className="shrink-0 px-5 pt-4 sm:px-6">
        <InlineEdit value={title} onSave={setT} label="Note title" placeholder="Note title" textClassName="text-h-xl font-semibold text-ink" as="h2" truncate />
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 px-5 pb-2 pt-3 sm:px-6">
        <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5">
          {TOOLS.map((t) => (
            <IconButton key={t.kind} size="sm" title={t.title} disabled={!showEditor} onMouseDown={(e) => e.preventDefault()} onClick={() => format(t.kind)}>
              {t.icon}
            </IconButton>
          ))}
        </div>
        <Tabs
          variant="segmented"
          ariaLabel="Editor mode"
          value={mode}
          onChange={(v) => setMode(v as Mode)}
          className="ml-auto"
          tabs={[
            { id: "edit", label: "Edit" },
            { id: "split", label: "Split" },
            { id: "preview", label: "Preview" },
          ]}
        />
      </div>

      <div className={cn("grid min-h-0 flex-1 border-t border-line", mode === "split" ? "grid-rows-2 lg:grid-cols-2 lg:grid-rows-1" : "grid-cols-1")}>
        {showEditor ? (
          <textarea
            ref={area}
            value={content}
            onChange={(e) => setC(e.target.value)}
            placeholder="Write in markdown..."
            aria-label="Note content"
            className={cn("mono min-h-0 resize-none bg-transparent px-5 py-3 text-body leading-6 text-ink outline-none placeholder:text-ink-muted sm:px-6", mode === "split" && "border-b border-line lg:border-b-0 lg:border-r")}
          />
        ) : null}
        {showPreview ? (
          <div className="prose-note min-h-0 overflow-y-auto px-5 py-3 sm:px-6">
            {content.trim() ? <ReactMarkdown>{previewSource(content)}</ReactMarkdown> : <p className="text-ink-muted">Nothing to preview yet.</p>}
          </div>
        ) : null}
      </div>
    </div>
  );
}
