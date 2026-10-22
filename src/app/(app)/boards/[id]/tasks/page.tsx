"use client";

import { useCallback, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Plus, X, MoreHorizontal, Pencil, Trash2, Filter, Check } from "lucide-react";
import { api, cn, uid, useFetch } from "@/lib/client";
import { LABEL_COLORS, labelColor } from "@/lib/constants";
import type { Column, Task } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Spinner, ErrorBox } from "@/components/ui/Misc";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export default function TasksPage() {
  const { project, setProject, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const { data, loading, error, refetch, setData } = useFetch<Task[]>(`/api/projects/${project._id}/tasks`);
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [addingList, setAddingList] = useState(false);
  const [newList, setNewList] = useState("");
  const [renaming, setRenaming] = useState<Column | null>(null);
  const [filter, setFilter] = useState<{ text: string; labels: string[]; hideDone: boolean }>({ text: "", labels: [], hideDone: false });

  const tasks = data ?? [];
  const columns = project.columns;

  const byColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const c of columns) map.set(c.id, []);
    const q = filter.text.toLowerCase();
    for (const t of tasks) {
      if (filter.hideDone && t.completedAt) continue;
      if (q && !t.title.toLowerCase().includes(q)) continue;
      if (filter.labels.length && !filter.labels.some((l) => t.labels.includes(l))) continue;
      if (!map.has(t.columnId)) map.set(t.columnId, []);
      map.get(t.columnId)!.push(t);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.order - b.order);
    return map;
  }, [tasks, columns, filter]);

  const updateTask = useCallback((t: Task) => setData((prev) => (prev ? prev.map((x) => (x._id === t._id ? t : x)) : prev)), [setData]);
  const removeTask = useCallback((id: string) => {
    setData((prev) => (prev ? prev.filter((x) => x._id !== id) : prev));
    refetchProject(true);
  }, [setData, refetchProject]);

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const next = tasks.map((t) => ({ ...t }));
    const moving = next.find((t) => t._id === draggableId);
    if (!moving) return;

    const srcList = next.filter((t) => t.columnId === source.droppableId && t._id !== draggableId).sort((a, b) => a.order - b.order);
    const dstList = source.droppableId === destination.droppableId ? srcList : next.filter((t) => t.columnId === destination.droppableId).sort((a, b) => a.order - b.order);
    moving.columnId = destination.droppableId;
    dstList.splice(destination.index, 0, moving);

    const moves: { taskId: string; columnId: string; order: number }[] = [];
    srcList.forEach((t, i) => {
      t.order = i;
      moves.push({ taskId: t._id, columnId: t.columnId, order: i });
    });
    if (source.droppableId !== destination.droppableId) {
      dstList.forEach((t, i) => {
        t.order = i;
        moves.push({ taskId: t._id, columnId: t.columnId, order: i });
      });
    }
    // Moving to a "Done"-like column marks complete, moving out un-completes
    const dstCol = columns.find((c) => c.id === destination.droppableId);
    const isDoneCol = dstCol && /done|complete|shipped/i.test(dstCol.title);
    if (isDoneCol && !moving.completedAt) moving.completedAt = new Date().toISOString();
    if (!isDoneCol && moving.completedAt && source.droppableId !== destination.droppableId) moving.completedAt = null;

    setData(next);
    try {
      await api.post(`/api/projects/${project._id}/tasks/reorder`, { moves });
      if (source.droppableId !== destination.droppableId) {
        await api.patch(`/api/projects/${project._id}/tasks/${moving._id}`, { completedAt: moving.completedAt });
        refetchProject(true);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to move", "error");
      refetch(true);
    }
  }

  async function addTask(columnId: string) {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    try {
      const t = await api.post<Task>(`/api/projects/${project._id}/tasks`, { title, columnId });
      setData((prev) => [...(prev ?? []), t]);
      refetchProject(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add", "error");
    }
  }

  async function saveColumns(next: Column[]) {
    const prev = columns;
    setProject((p) => ({ ...p, columns: next }));
    try {
      await api.put(`/api/projects/${project._id}/columns`, { columns: next });
      refetch(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update lists", "error");
      setProject((p) => ({ ...p, columns: prev }));
    }
  }

  function addList() {
    const title = newList.trim();
    if (!title) return;
    setNewList("");
    setAddingList(false);
    saveColumns([...columns, { id: uid(), title, color: LABEL_COLORS[columns.length % LABEL_COLORS.length].id }]);
  }

  const current = openTask ? tasks.find((t) => t._id === openTask) : null;
  const filterActive = filter.text || filter.labels.length || filter.hideDone;

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={() => refetch()} />;

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col md:h-[calc(100vh-8.5rem)]">
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-md bg-[#0000003d] px-2 py-1 text-white">
          <Filter size={14} />
          <input
            value={filter.text}
            onChange={(e) => setFilter((f) => ({ ...f, text: e.target.value }))}
            placeholder="Filter cards…"
            className="w-36 bg-transparent text-sm placeholder-white/70 outline-none"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md bg-[#0000003d] px-1.5 py-1">
          {LABEL_COLORS.map((c) => (
            <button
              key={c.id}
              title={c.label}
              onClick={() => setFilter((f) => ({ ...f, labels: f.labels.includes(c.id) ? f.labels.filter((x) => x !== c.id) : [...f.labels, c.id] }))}
              className={cn("h-5 w-5 rounded-full ring-white", filter.labels.includes(c.id) && "ring-2")}
              style={{ background: c.bg }}
            />
          ))}
        </div>
        <button
          onClick={() => setFilter((f) => ({ ...f, hideDone: !f.hideDone }))}
          className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-white", filter.hideDone ? "bg-white/90 !text-ink" : "bg-[#0000003d] hover:bg-[#00000052]")}
        >
          {filter.hideDone ? <Check size={14} /> : null} Hide done
        </button>
        {filterActive ? (
          <button onClick={() => setFilter({ text: "", labels: [], hideDone: false })} className="flex items-center gap-1 rounded-md bg-[#0000003d] px-2.5 py-1.5 text-sm text-white hover:bg-[#00000052]">
            <X size={14} /> Clear
          </button>
        ) : null}
        <span className="ml-auto rounded-md bg-[#0000003d] px-2.5 py-1.5 text-xs font-semibold text-white">
          {tasks.filter((t) => !t.completedAt).length} open · {tasks.filter((t) => t.completedAt).length} done
        </span>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden pb-3">
          {columns.map((col) => {
            const list = byColumn.get(col.id) ?? [];
            const lc = labelColor(col.color);
            return (
              <div key={col.id} className="t-list flex max-h-full w-[272px] shrink-0 flex-col">
                <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: lc.bg }} />
                  <h3 className="flex-1 truncate text-sm font-bold text-ink">{col.title}</h3>
                  <span className="text-xs font-semibold text-ink-muted">{list.length}</span>
                  <Menu
                    width="w-48"
                    trigger={
                      <button className="rounded p-1 text-ink-soft hover:bg-[#091e4224]">
                        <MoreHorizontal size={16} />
                      </button>
                    }
                  >
                    <MenuItem icon={<Pencil size={14} />} onClick={() => setRenaming(col)}>
                      Edit list
                    </MenuItem>
                    <MenuItem icon={<Plus size={14} />} onClick={() => setAdding(col.id)}>
                      Add card
                    </MenuItem>
                    <MenuItem
                      icon={<Trash2 size={14} />}
                      danger
                      onClick={() => {
                        if (columns.length === 1) return toast("You need at least one list", "error");
                        if (confirm(`Delete list "${col.title}"? Cards will move to the first list.`)) saveColumns(columns.filter((c) => c.id !== col.id));
                      }}
                    >
                      Delete list
                    </MenuItem>
                  </Menu>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn("flex min-h-[8px] flex-col gap-2 overflow-y-auto px-2 py-1 transition", snapshot.isDraggingOver && "bg-[#091e420f]")}
                    >
                      {list.map((t, i) => (
                        <Draggable key={t._id} draggableId={t._id} index={i}>
                          {(p, s) => (
                            <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className={cn(s.isDragging && "rotate-2 opacity-90")}>
                              <TaskCard task={t} onClick={() => setOpenTask(t._id)} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                <div className="p-2">
                  {adding === col.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addTask(col.id);
                      }}
                    >
                      <textarea
                        autoFocus
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            addTask(col.id);
                          }
                          if (e.key === "Escape") setAdding(null);
                        }}
                        placeholder="Enter a title for this card…"
                        className="t-card w-full resize-none p-2 text-sm outline-none focus:ring-2 focus:ring-brand"
                        rows={2}
                      />
                      <div className="mt-1.5 flex items-center gap-1">
                        <Button type="submit" size="sm" color="#1f845a" disabled={!newTitle.trim()}>
                          Add card
                        </Button>
                        <button type="button" onClick={() => setAdding(null)} className="rounded p-1.5 text-ink-soft hover:bg-[#091e4224]">
                          <X size={16} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setAdding(col.id);
                        setNewTitle("");
                      }}
                      className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink-soft hover:bg-[#091e4224] hover:text-ink"
                    >
                      <Plus size={16} /> Add a card
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add list */}
          <div className="w-[272px] shrink-0">
            {addingList ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addList();
                }}
                className="t-list p-2"
              >
                <Input autoFocus value={newList} onChange={(e) => setNewList(e.target.value)} placeholder="Enter list title…" onKeyDown={(e) => e.key === "Escape" && setAddingList(false)} />
                <div className="mt-1.5 flex items-center gap-1">
                  <Button type="submit" size="sm" disabled={!newList.trim()}>
                    Add list
                  </Button>
                  <button type="button" onClick={() => setAddingList(false)} className="rounded p-1.5 text-ink-soft hover:bg-[#091e4224]">
                    <X size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <button onClick={() => setAddingList(true)} className="flex w-full items-center gap-2 rounded-xl bg-white/25 px-3 py-2.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/35">
                <Plus size={16} /> Add another list
              </button>
            )}
          </div>
        </div>
      </DragDropContext>

      {current ? <TaskModal task={current} columns={columns} projectId={project._id} onClose={() => setOpenTask(null)} onChange={updateTask} onDelete={removeTask} /> : null}

      {renaming ? (
        <EditListModal
          column={renaming}
          onClose={() => setRenaming(null)}
          onSave={(c) => {
            saveColumns(columns.map((x) => (x.id === c.id ? c : x)));
            setRenaming(null);
          }}
        />
      ) : null}
    </div>
  );
}

function EditListModal({ column, onClose, onSave }: { column: Column; onClose: () => void; onSave: (c: Column) => void }) {
  const [title, setTitle] = useState(column.title);
  const [color, setColor] = useState(column.color);
  return (
    <Modal
      open
      onClose={onClose}
      title="Edit list"
      width="max-w-sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => title.trim() && onSave({ ...column, title: title.trim(), color })} disabled={!title.trim()}>
            Save
          </Button>
        </>
      }
    >
      <label className="t-label">Title</label>
      <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
      <label className="t-label mt-4">Color</label>
      <div className="grid grid-cols-5 gap-1.5">
        {LABEL_COLORS.map((c) => (
          <button key={c.id} title={c.label} onClick={() => setColor(c.id)} className={cn("h-8 rounded ring-ink ring-offset-1", color === c.id && "ring-2")} style={{ background: c.bg }} />
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-muted">Tip: cards dropped into a list named “Done” are marked complete automatically.</p>
    </Modal>
  );
}
