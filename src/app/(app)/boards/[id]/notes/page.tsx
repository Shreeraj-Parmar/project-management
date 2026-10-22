"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import { api, useFetch } from "@/lib/client";
import { MODULES, NOTE_COLORS } from "@/lib/constants";
import type { Note } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { Button, ConfirmDialog, ErrorBox, PageHeader, SearchInput, useToast } from "@/components/ui";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoSelection, NoteList, NotesEmpty, NotesSkeleton, sortNotes } from "@/components/notes/NoteList";

const MOD = MODULES.find((m) => m.id === "notes")!;

export default function NotesPage() {
  const { project, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/notes`;
  const { data, loading, error, refetch, setData } = useFetch<Note[]>(base);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<Note | null>(null);
  const deleted = useRef(new Set<string>());
  const seq = useRef(new Map<string, number>());

  const notes = useMemo(() => data ?? [], [data]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortNotes(notes.filter((n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)));
  }, [notes, query]);
  const current = notes.find((n) => n._id === selected) ?? null;

  async function create() {
    try {
      const n = await api.post<Note>(base, { title: "Untitled note", content: "", color: NOTE_COLORS[notes.length % NOTE_COLORS.length] });
      setData((prev) => [n, ...(prev ?? [])]);
      setQuery("");
      setSelected(n._id);
      refetchProject(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create note", "error");
    }
  }

  async function update(id: string, patch: Partial<Note>) {
    if (deleted.current.has(id)) return;
    const mine = (seq.current.get(id) ?? 0) + 1;
    seq.current.set(id, mine);
    setData((prev) => (prev ? prev.map((n) => (n._id === id ? { ...n, ...patch } : n)) : prev));
    try {
      const saved = await api.patch<Note>(`${base}/${id}`, patch);
      // ignore responses that were overtaken by a newer save
      if (seq.current.get(id) === mine) setData((prev) => (prev ? prev.map((n) => (n._id === id ? saved : n)) : prev));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    }
  }

  async function remove(n: Note) {
    deleted.current.add(n._id);
    try {
      await api.del(`${base}/${n._id}`);
    } catch (err) {
      deleted.current.delete(n._id);
      toast(err instanceof Error ? err.message : "Failed to delete note", "error");
      return;
    }
    setData((prev) => (prev ? prev.filter((x) => x._id !== n._id) : prev));
    if (selected === n._id) setSelected(null);
    refetchProject(true);
    toast(`Deleted ${n.title || "note"}.`, "success");
  }

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Markdown notes, ideas, meeting logs and snippets. Autosaves as you type."
        color={MOD.color}
        icon={<StickyNote size={20} />}
        actions={
          <Button icon={<Plus size={16} />} onClick={create}>
            New note
          </Button>
        }
      />

      {loading && !data ? (
        <NotesSkeleton />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => refetch()} />
      ) : notes.length === 0 ? (
        <NotesEmpty onCreate={create} />
      ) : (
        <div className="grid gap-4 lg:h-[calc(100dvh-240px)] lg:min-h-[520px] grid-cols-[minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="flex min-h-0 flex-col gap-3">
            <SearchInput value={query} onValueChange={setQuery} placeholder="Search notes" />
            <div className="min-h-0 flex-1 overflow-y-auto pb-1 pr-0.5">
              <NoteList notes={list} selected={selected} onSelect={setSelected} query={query.trim()} />
            </div>
          </div>
          {current ? (
            <NoteEditor key={current._id} note={current} onChange={(p) => update(current._id, p)} onDelete={() => setDeleting(current)} onBack={() => setSelected(null)} />
          ) : (
            <NoSelection />
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
        title={`Delete ${deleting?.title || "note"}?`}
        message="This note will be permanently removed."
        confirmLabel="Delete note"
      />
    </div>
  );
}
