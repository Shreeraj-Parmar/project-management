"use client";

import { useEffect, useState } from "react";
import { AlignLeft, CheckSquare, Tag, Clock, Flag, Columns3, Trash2, Plus, X, CheckCircle2, Circle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api, cn, toDateInput, uid } from "@/lib/client";
import { LABEL_COLORS, labelColor, PRIORITY_STYLE, TASK_PRIORITIES } from "@/lib/constants";
import type { Column, Task } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export function TaskModal({
  task,
  columns,
  projectId,
  onClose,
  onChange,
  onDelete,
}: {
  task: Task;
  columns: Column[];
  projectId: string;
  onClose: () => void;
  onChange: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description);
  const [editingDesc, setEditingDesc] = useState(!task.description);
  const [newItem, setNewItem] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setDesc(task.description);
  }, [task._id, task.title, task.description]);

  async function patch(update: Partial<Task>) {
    const optimistic = { ...task, ...update } as Task;
    onChange(optimistic);
    try {
      const saved = await api.patch<Task>(`/api/projects/${projectId}/tasks/${task._id}`, update);
      onChange(saved);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
      onChange(task);
    }
  }

  function toggleLabel(id: string) {
    const labels = task.labels.includes(id) ? task.labels.filter((l) => l !== id) : [...task.labels, id];
    patch({ labels });
  }

  const checked = task.checklist.filter((c) => c.done).length;
  const pct = task.checklist.length ? Math.round((checked / task.checklist.length) * 100) : 0;
  const column = columns.find((c) => c.id === task.columnId);

  return (
    <Modal open onClose={onClose} title={<span className="text-ink-muted">in list <b className="text-ink">{column?.title}</b></span>} width="max-w-3xl" accent="#1f845a">
      <div className="grid gap-6 md:grid-cols-[1fr_200px]">
        <div className="min-w-0 space-y-5">
          {/* Title */}
          <div className="flex items-start gap-2">
            <button
              onClick={() => patch({ completedAt: task.completedAt ? null : new Date().toISOString() })}
              className={cn("mt-1 shrink-0", task.completedAt ? "text-success" : "text-ink-muted hover:text-ink")}
              title={task.completedAt ? "Mark incomplete" : "Mark complete"}
            >
              {task.completedAt ? <CheckCircle2 size={22} /> : <Circle size={22} />}
            </button>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => title.trim() && title !== task.title && patch({ title: title.trim() })}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className={cn("w-full rounded px-2 py-1 text-lg font-semibold text-ink outline-none hover:bg-[#091e420f] focus:bg-white focus:ring-2 focus:ring-brand", task.completedAt && "line-through text-ink-muted")}
            />
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-4 pl-8 text-xs">
            {task.labels.length > 0 ? (
              <div>
                <div className="mb-1 font-semibold text-ink-muted">Labels</div>
                <div className="flex flex-wrap gap-1">
                  {task.labels.map((l) => {
                    const c = labelColor(l);
                    return (
                      <span key={l} className="rounded px-2 py-0.5 text-[11px] font-semibold" style={{ background: c.bg, color: c.fg }}>
                        {c.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div>
              <div className="mb-1 font-semibold text-ink-muted">Priority</div>
              <span className="rounded px-2 py-0.5 text-[11px] font-semibold capitalize" style={{ background: PRIORITY_STYLE[task.priority].bg, color: PRIORITY_STYLE[task.priority].fg }}>
                {task.priority}
              </span>
            </div>
            {task.dueDate ? (
              <div>
                <div className="mb-1 font-semibold text-ink-muted">Due date</div>
                <span className="rounded bg-[#f1f2f4] px-2 py-0.5 text-[11px] font-semibold text-ink">{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            ) : null}
          </div>

          {/* Description */}
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <AlignLeft size={16} /> Description
            </h4>
            {editingDesc ? (
              <div className="pl-6">
                <Textarea autoFocus value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Add a more detailed description… (markdown supported)" className="min-h-[120px]" />
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    color="#1f845a"
                    onClick={async () => {
                      await patch({ description: desc });
                      setEditingDesc(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDesc(task.description);
                      setEditingDesc(Boolean(!task.description));
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div onClick={() => setEditingDesc(true)} className="prose-note cursor-text rounded-md bg-[#091e420f] p-3 pl-3 hover:bg-[#091e4224]">
                <ReactMarkdown>{task.description}</ReactMarkdown>
              </div>
            )}
          </section>

          {/* Checklist */}
          <section>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <CheckSquare size={16} /> Checklist
            </h4>
            <div className="pl-6">
              {task.checklist.length > 0 ? (
                <div className="mb-2 flex items-center gap-2 text-xs text-ink-muted">
                  <span className="w-8">{pct}%</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded bg-[#091e4224]">
                    <div className="h-full rounded transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "#1f845a" : "#579dff" }} />
                  </div>
                </div>
              ) : null}
              <ul className="space-y-1">
                {task.checklist.map((item) => (
                  <li key={item.id} className="group flex items-center gap-2 rounded px-1 py-0.5 hover:bg-[#091e420f]">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => patch({ checklist: task.checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c)) })}
                      className="h-4 w-4 accent-[#1f845a]"
                    />
                    <span className={cn("flex-1 text-sm", item.done && "line-through text-ink-muted")}>{item.text}</span>
                    <button onClick={() => patch({ checklist: task.checklist.filter((c) => c.id !== item.id) })} className="opacity-0 group-hover:opacity-100">
                      <X size={14} className="text-ink-muted hover:text-danger" />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newItem.trim()) return;
                  patch({ checklist: [...task.checklist, { id: uid(), text: newItem.trim(), done: false }] });
                  setNewItem("");
                }}
                className="mt-2 flex gap-2"
              >
                <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add an item" className="h-8 py-1" />
                <Button type="submit" size="sm" variant="secondary" icon={<Plus size={14} />} disabled={!newItem.trim()}>
                  Add
                </Button>
              </form>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 text-xs">
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-bold text-ink-muted">
              <Columns3 size={13} /> List
            </div>
            <Select value={task.columnId} onChange={(e) => patch({ columnId: e.target.value })} className="h-8 py-1 text-[13px]">
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-bold text-ink-muted">
              <Flag size={13} /> Priority
            </div>
            <div className="grid grid-cols-2 gap-1">
              {TASK_PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => patch({ priority: p })}
                  className={cn("rounded px-2 py-1 text-[12px] font-semibold capitalize ring-brand", task.priority === p && "ring-2")}
                  style={{ background: PRIORITY_STYLE[p].bg, color: PRIORITY_STYLE[p].fg }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-bold text-ink-muted">
              <Tag size={13} /> Labels
            </div>
            <div className="grid grid-cols-5 gap-1">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c.id}
                  title={c.label}
                  onClick={() => toggleLabel(c.id)}
                  className={cn("h-7 rounded ring-ink ring-offset-1", task.labels.includes(c.id) && "ring-2")}
                  style={{ background: c.bg }}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-bold text-ink-muted">
              <Clock size={13} /> Due date
            </div>
            <Input type="date" value={toDateInput(task.dueDate)} onChange={(e) => patch({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })} className="h-8 py-1 text-[13px]" />
          </div>
          <div className="border-t border-line pt-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-danger hover:bg-[#ffeceb]"
              icon={<Trash2 size={14} />}
              loading={busy}
              onClick={async () => {
                if (!confirm("Delete this task?")) return;
                setBusy(true);
                try {
                  await api.del(`/api/projects/${projectId}/tasks/${task._id}`);
                  onDelete(task._id);
                  onClose();
                } catch (err) {
                  toast(err instanceof Error ? err.message : "Failed", "error");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete task
            </Button>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
