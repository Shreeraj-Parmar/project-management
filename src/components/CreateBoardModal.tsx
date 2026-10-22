"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { api } from "@/lib/client";
import { BOARD_COLORS } from "@/lib/constants";
import type { Project } from "@/lib/types";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Field, Input, Textarea } from "./ui/Field";
import { useToast } from "./ui/Toast";

export function CreateBoardModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (p: Project) => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(BOARD_COLORS[0].id);
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setName("");
    setDescription("");
    setColor(BOARD_COLORS[0].id);
    setTags("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const p = await api.post<Project>("/api/projects", {
        name,
        description,
        color,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast("Board created", "success");
      reset();
      onClose();
      onCreated?.(p);
      router.push(`/boards/${p._id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create", "error");
    } finally {
      setBusy(false);
    }
  }

  const bg = BOARD_COLORS.find((c) => c.id === color)?.css;

  return (
    <Modal open={open} onClose={onClose} title="Create board" width="max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex h-28 items-center justify-center rounded-lg shadow-inner" style={{ background: bg }}>
          <div className="w-11/12 rounded bg-white/20 p-2 backdrop-blur-sm">
            <div className="mb-1 h-2 w-1/3 rounded bg-white/70" />
            <div className="flex gap-1.5">
              <div className="h-10 flex-1 rounded bg-white/60" />
              <div className="h-7 flex-1 rounded bg-white/60" />
              <div className="h-12 flex-1 rounded bg-white/60" />
            </div>
          </div>
        </div>
        <div>
          <label className="t-label">Background</label>
          <div className="grid grid-cols-5 gap-2">
            {BOARD_COLORS.map((c) => (
              <button
                type="button"
                key={c.id}
                title={c.label}
                onClick={() => setColor(c.id)}
                className="relative h-9 rounded-md transition hover:opacity-90"
                style={{ background: c.css }}
              >
                {c.id === color ? <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow" /> : null}
              </button>
            ))}
          </div>
        </div>
        <Field label="Board title" hint="*">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SaaS Dashboard" />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" className="min-h-[64px]" />
        </Field>
        <Field label="Tags" hint="comma separated">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="nextjs, mongodb, side-project" />
        </Field>
        <Button type="submit" className="w-full" loading={busy} disabled={!name.trim()}>
          Create
        </Button>
      </form>
    </Modal>
  );
}
