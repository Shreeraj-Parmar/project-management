"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { StickyNote, Plus, Pin, PinOff, Trash2, Search, Eye, Pencil, Check } from "lucide-react";
import { api, cn, relativeTime, useFetch } from "@/lib/client";
import { MODULES, NOTE_COLORS } from "@/lib/constants";
import type { Note } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { ModuleHeader, Spinner, ErrorBox, EmptyState } from "@/components/ui/Misc";
import { Button, IconButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Confirm";
import { useToast } from "@/components/ui/Toast";

const MOD = MODULES.find((m) => m.id === "notes")!;

export default function NotesPage() {
  const { project, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/notes`;
  const { data, loading, error, refetch, setData } = useFetch<Note[]>(base);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<Note | null>(null);

  const notes = data ?? [];
  const list = useMemo(() => {
    const q = query.toLowerCase();
    return notes.filter((n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [notes, query]);
  const current = notes.find((n) => n._id === selected) ?? null;

  async function create() {
    try {
      const n = await api.post<Note>(base, { title: "Untitled note", content: "", color: NOTE_COLORS[notes.length % NOTE_COLORS.length] });
      setData((prev) => [n, ...(prev ?? [])]);
      setSelected(n._id);
      refetchProject(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function update(id: string, patch: Partial<Note>) {
    setData((prev) => (prev ? prev.map((n) => (n._id === id ? { ...n, ...patch } : n)) : prev));
    try {
      const saved = await api.patch<Note>(`${base}/${id}`, patch);
      setData((prev) => (prev ? prev.map((n) => (n._id === id ? saved : n)) : prev));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    }
  }

  async function remove(n: Note) {
    await api.del(`${base}/${n._id}`);
    setData((prev) => (prev ? prev.filter((x) => x._id !== n._id) : prev));
    if (selected === n._id) setSelected(null);
    refetchProject(true);
    toast("Note deleted", "success");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <ModuleHeader
        title="Notes"
        description="Markdown notes, ideas, meeting logs and snippets. Autosaves as you type."
        color={MOD.color}
        icon={<StickyNote size={20} />}
        actions={
          <Button color={MOD.color} icon={<Plus size={15} />} onClick={create}>
            New note
          </Button>
        }
      />

      {loading && !data ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => refetch()} />
      ) : notes.length === 0 ? (
        <EmptyState icon={<StickyNote size={22} />} color={MOD.color} title="No notes yet" description="Write down architecture decisions, TODO ideas, commands you always forget…" action={<Button color={MOD.color} onClick={create}>Create first note</Button>} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          {/* List */}
          <div className={cn("space-y-2", current && "hidden lg:block")}>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes…" className="h-9 pl-8" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {list.map((n) => (
                <button
                  key={n._id}
                  onClick={() => setSelected(n._id)}
                  className={cn("relative rounded-lg p-3 text-left shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-raised)]", selected === n._id && "ring-2 ring-ink/60")}
                  style={{ background: n.color }}
                >
                  {n.pinned ? <Pin size={12} className="absolute right-2 top-2 text-ink-soft" fill="currentColor" /> : null}
                  <div className="truncate pr-4 text-sm font-semibold text-ink">{n.title || "Untitled"}</div>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{n.content || "Empty note"}</p>
                  <div className="mt-2 text-[11px] text-ink-muted">{relativeTime(n.updatedAt)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          {current ? (
            <NoteEditor key={current._id} note={current} onChange={(p) => update(current._id, p)} onDelete={() => setDeleting(current)} onBack={() => setSelected(null)} />
          ) : (
            <div className="hidden items-center justify-center rounded-xl border-2 border-dashed border-line text-sm text-ink-muted lg:flex">Select a note to view or edit</div>
          )}
        </div>
      )}

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} title={`Delete "${deleting?.title}"?`} />
    </div>
  );
}

function NoteEditor({ note, onChange, onDelete, onBack }: { note: Note; onChange: (p: Partial<Note>) => void; onDelete: () => void; onBack: () => void }) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [preview, setPreview] = useState(Boolean(note.content));
  const [saved, setSaved] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // debounce autosave
  useEffect(() => {
    if (title === note.title && content === note.content) return;
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onChange({ title: title.trim() || "Untitled note", content });
      setSaved(true);
    }, 600);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  return (
    <div className="t-card flex min-h-[520px] flex-col overflow-hidden" style={{ background: note.color }}>
      <div className="flex items-center gap-1 border-b border-black/5 px-3 py-2">
        <button onClick={onBack} className="rounded px-2 py-1 text-xs font-semibold text-ink-soft hover:bg-black/5 lg:hidden">
          ← Back
        </button>
        <div className="flex items-center gap-1">
          {NOTE_COLORS.map((c) => (
            <button key={c} onClick={() => onChange({ color: c })} className={cn("h-5 w-5 rounded-full border border-black/10", note.color === c && "ring-2 ring-ink/60")} style={{ background: c }} title="Color" />
          ))}
        </div>
        <span className="ml-3 flex items-center gap-1 text-[11px] text-ink-muted">{saved ? <><Check size={12} /> Saved</> : "Saving…"}</span>
        <div className="ml-auto flex items-center gap-0.5">
          <IconButton title={preview ? "Edit" : "Preview"} onClick={() => setPreview((p) => !p)}>
            {preview ? <Pencil size={15} /> : <Eye size={15} />}
          </IconButton>
          <IconButton title={note.pinned ? "Unpin" : "Pin"} onClick={() => onChange({ pinned: !note.pinned })}>
            {note.pinned ? <PinOff size={15} /> : <Pin size={15} />}
          </IconButton>
          <IconButton title="Delete" onClick={onDelete} className="hover:!text-danger">
            <Trash2 size={15} />
          </IconButton>
        </div>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
        className="bg-transparent px-5 pt-4 text-xl font-bold text-ink outline-none placeholder:text-ink-muted"
      />
      {preview ? (
        <div onClick={() => setPreview(false)} className="prose-note flex-1 cursor-text px-5 py-3">
          {content ? <ReactMarkdown>{content}</ReactMarkdown> : <p className="text-ink-muted">Click to start writing…</p>}
        </div>
      ) : (
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write in markdown…"
          className="mono flex-1 resize-none bg-transparent px-5 py-3 text-[13px] leading-6 text-ink outline-none placeholder:text-ink-muted"
        />
      )}
    </div>
  );
}
