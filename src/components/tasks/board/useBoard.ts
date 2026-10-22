"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { api, uid, useFetch } from "@/lib/client";
import { LABEL_COLORS } from "@/lib/constants";
import type { Column, Task } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { useToast } from "@/components/ui/Toast";
import { EMPTY_FILTER, isFilterActive, matchesFilter, readStoredFilter, writeStoredFilter, type TaskFilter } from "./filter";

export type SortBy = "priority" | "due" | "created" | "title";
export const SORT_LABEL: Record<SortBy, string> = {
  priority: "Priority (highest first)",
  due: "Due date (soonest first)",
  created: "Date created (newest first)",
  title: "Card name (A to Z)",
};
const PRIORITY_RANK: Record<Task["priority"], number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function sorter(by: SortBy): (a: Task, b: Task) => number {
  switch (by) {
    case "priority":
      return (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    case "due":
      return (a, b) => {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return ad === bd ? 0 : ad < bd ? -1 : 1;
      };
    case "created":
      return (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    case "title":
      return (a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" });
  }
}

const byOrder = (a: Task, b: Task) => a.order - b.order;
const msg = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

/**
 * All data and mutations of the Tasks board. Every request is the one the previous page made
 * (tasks GET / POST / PATCH / DELETE, tasks/reorder, columns PUT); only the UI around them changed.
 */
export function useBoard() {
  const { project, setProject, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const projectId = project._id;
  const columns = project.columns;
  const { data, loading, error, refetch, setData } = useFetch<Task[]>(`/api/projects/${projectId}/tasks`);

  // ---- filter (remembered per board for the session)
  const [filter, setFilterState] = useState<TaskFilter>(EMPTY_FILTER);
  const filterRef = useRef(filter);
  filterRef.current = filter;
  useEffect(() => {
    const stored = readStoredFilter(projectId);
    filterRef.current = stored;
    setFilterState(stored);
  }, [projectId]);
  const setFilter = useCallback(
    (u: TaskFilter | ((f: TaskFilter) => TaskFilter)) => {
      const next = typeof u === "function" ? u(filterRef.current) : u;
      filterRef.current = next;
      setFilterState(next);
      writeStoredFilter(projectId, next);
    },
    [projectId],
  );
  const clearFilter = useCallback(() => setFilter(EMPTY_FILTER), [setFilter]);
  const filtering = isFilterActive(filter);

  // ---- derived
  const tasks = useMemo(() => data ?? [], [data]);
  const { all, visible, visibleCount } = useMemo(() => {
    const all = new Map<string, Task[]>();
    const visible = new Map<string, Task[]>();
    for (const c of columns) {
      all.set(c.id, []);
      visible.set(c.id, []);
    }
    const now = Date.now();
    let visibleCount = 0;
    for (const t of tasks) {
      const a = all.get(t.columnId);
      if (!a) continue; // card of a list that no longer exists: not rendered (the server moves them on list delete)
      a.push(t);
      if (matchesFilter(t, filter, now)) {
        visible.get(t.columnId)!.push(t);
        visibleCount++;
      }
    }
    for (const arr of all.values()) arr.sort(byOrder);
    for (const arr of visible.values()) arr.sort(byOrder);
    return { all, visible, visibleCount };
  }, [tasks, columns, filter]);
  const doneCount = useMemo(() => tasks.filter((t) => t.completedAt).length, [tasks]);

  // ---- cards
  const updateTask = useCallback((t: Task) => setData((prev) => (prev ? prev.map((x) => (x._id === t._id ? t : x)) : prev)), [setData]);
  const removeTask = useCallback(
    (id: string) => {
      setData((prev) => (prev ? prev.filter((x) => x._id !== id) : prev));
      refetchProject(true);
    },
    [setData, refetchProject],
  );

  /** Optimistic PATCH of one card (quick edit, complete toggle). Reverts and toasts on failure. */
  const patchTask = useCallback(
    async (task: Task, update: Partial<Task>) => {
      setData((prev) => (prev ? prev.map((x) => (x._id === task._id ? ({ ...x, ...update } as Task) : x)) : prev));
      try {
        const saved = await api.patch<Task>(`/api/projects/${projectId}/tasks/${task._id}`, update);
        setData((prev) => (prev ? prev.map((x) => (x._id === saved._id ? saved : x)) : prev));
        if ("completedAt" in update) refetchProject(true);
      } catch (err) {
        setData((prev) => (prev ? prev.map((x) => (x._id === task._id ? task : x)) : prev));
        toast(msg(err, "Failed to save"), "error", { title: "Couldn't update the card" });
      }
    },
    [projectId, setData, refetchProject, toast],
  );

  /** "Move card" in quick edit: to the bottom of another list, with the same Done-list rule as dragging. */
  const moveTask = useCallback(
    async (task: Task, columnId: string) => {
      if (task.columnId === columnId) return;
      const dest = all.get(columnId) ?? [];
      const order = dest.length ? Math.max(...dest.map((t) => t.order)) + 1 : 0;
      const col = columns.find((c) => c.id === columnId);
      const isDoneCol = !!col && /done|complete|shipped/i.test(col.title);
      const update: Partial<Task> = { columnId, order };
      if (isDoneCol && !task.completedAt) update.completedAt = new Date().toISOString();
      else if (!isDoneCol && task.completedAt) update.completedAt = null;
      await patchTask(task, update);
      refetchProject(true);
    },
    [all, columns, patchTask, refetchProject],
  );

  const deleteTask = useCallback(
    async (task: Task) => {
      await api.del(`/api/projects/${projectId}/tasks/${task._id}`);
      removeTask(task._id);
    },
    [projectId, removeTask],
  );

  // Cards are created one after the other so the server hands out increasing `order` values.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const addTasks = useCallback(
    function addTasks(columnId: string, titles: string[]): Promise<Task[]> {
      const run = async () => {
        const created: Task[] = [];
        for (const title of titles) {
          try {
            const t = await api.post<Task>(`/api/projects/${projectId}/tasks`, { title, columnId });
            created.push(t);
            setData((prev) => [...(prev ?? []), t]);
          } catch (err) {
            const rest = titles.slice(created.length);
            toast(msg(err, "Failed to add"), "error", {
              title: created.length ? `Added ${created.length} of ${titles.length} cards` : "Couldn't add the card",
              action: { label: "Retry", onClick: () => void addTasks(columnId, rest) },
            });
            break;
          }
        }
        if (created.length) refetchProject(true);
        return created;
      };
      const p = queue.current.then(run, run);
      queue.current = p;
      return p;
    },
    [projectId, setData, refetchProject, toast],
  );

  /** Used by the Undo of a multi-card paste. */
  const deleteTasks = useCallback(
    async (list: Task[]) => {
      const ids = new Set<string>();
      for (const t of list) {
        try {
          await api.del(`/api/projects/${projectId}/tasks/${t._id}`);
          ids.add(t._id);
        } catch {
          /* leave the card in place if it could not be removed */
        }
      }
      setData((prev) => (prev ? prev.filter((x) => !ids.has(x._id)) : prev));
      refetchProject(true);
    },
    [projectId, setData, refetchProject],
  );

  // ---- lists
  const saveColumns = useCallback(
    async (next: Column[], { refetchTasks = false }: { refetchTasks?: boolean } = {}) => {
      const prev = project.columns;
      setProject((p) => ({ ...p, columns: next }));
      try {
        await api.put(`/api/projects/${projectId}/columns`, { columns: next });
        if (refetchTasks) refetch(true);
      } catch (err) {
        toast(msg(err, "Failed to update lists"), "error", { title: "Couldn't update the lists" });
        setProject((p) => ({ ...p, columns: prev }));
      }
    },
    [project.columns, projectId, setProject, refetch, toast],
  );

  const addList = useCallback(
    (title: string) => {
      const t = title.trim().slice(0, 60);
      if (!t) return;
      void saveColumns([...columns, { id: uid(), title: t, color: LABEL_COLORS[columns.length % LABEL_COLORS.length].id }]);
    },
    [columns, saveColumns],
  );
  const renameList = useCallback(
    (id: string, title: string) => void saveColumns(columns.map((c) => (c.id === id ? { ...c, title } : c))),
    [columns, saveColumns],
  );
  const recolorList = useCallback(
    (id: string, color: string) => void saveColumns(columns.map((c) => (c.id === id ? { ...c, color } : c))),
    [columns, saveColumns],
  );
  const deleteList = useCallback(
    (id: string) =>
      saveColumns(
        columns.filter((c) => c.id !== id),
        { refetchTasks: true },
      ),
    [columns, saveColumns],
  );
  const moveList = useCallback(
    (id: string, toIndex: number) => {
      const from = columns.findIndex((c) => c.id === id);
      if (from < 0 || from === toIndex) return;
      const next = [...columns];
      const [m] = next.splice(from, 1);
      next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, m);
      void saveColumns(next);
    },
    [columns, saveColumns],
  );

  /** One-off sort of a whole list, persisted through tasks/reorder, with Undo. */
  const sortList = useCallback(
    async (columnId: string, by: SortBy) => {
      const list = [...(all.get(columnId) ?? [])];
      if (list.length < 2) return;
      const before = list.map((t) => ({ taskId: t._id, columnId, order: t.order }));
      const sorted = [...list].sort(sorter(by));
      const moves = sorted.map((t, i) => ({ taskId: t._id, columnId, order: i }));
      const apply = async (m: typeof moves) => {
        const orderOf = new Map(m.map((x) => [x.taskId, x.order]));
        setData((prev) => (prev ? prev.map((t) => (orderOf.has(t._id) ? { ...t, order: orderOf.get(t._id)! } : t)) : prev));
        try {
          await api.post(`/api/projects/${projectId}/tasks/reorder`, { moves: m });
        } catch (err) {
          toast(msg(err, "Failed to sort"), "error", { title: "Couldn't sort the list" });
          refetch(true);
        }
      };
      await apply(moves);
      toast(`Sorted by ${SORT_LABEL[by].replace(/ \(.*\)$/, "").toLowerCase()}.`, "success", { action: { label: "Undo", onClick: () => void apply(before) } });
    },
    [all, projectId, setData, refetch, toast],
  );

  // ---- drag and drop
  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId, type } = result;
      if (!destination) return;

      if (type === "LIST") {
        if (source.index === destination.index) return;
        const next = [...columns];
        const [m] = next.splice(source.index, 1);
        next.splice(destination.index, 0, m);
        void saveColumns(next);
        return;
      }

      if (source.droppableId === destination.droppableId && source.index === destination.index) return;

      const next = tasks.map((t) => ({ ...t }));
      const moving = next.find((t) => t._id === draggableId);
      if (!moving) return;

      const srcList = next.filter((t) => t.columnId === source.droppableId && t._id !== draggableId).sort(byOrder);
      const dstList = source.droppableId === destination.droppableId ? srcList : next.filter((t) => t.columnId === destination.droppableId).sort(byOrder);

      // With a filter on, the drop index counts visible cards only: place the card next to its visible neighbour.
      let at = destination.index;
      if (isFilterActive(filter)) {
        const now = Date.now();
        const vis = dstList.filter((t) => matchesFilter(t, filter, now));
        const before = vis[destination.index];
        if (before) at = dstList.indexOf(before);
        else {
          const last = vis[vis.length - 1];
          at = last ? dstList.indexOf(last) + 1 : dstList.length;
        }
      }
      moving.columnId = destination.droppableId;
      dstList.splice(at, 0, moving);

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
        await api.post(`/api/projects/${projectId}/tasks/reorder`, { moves });
        if (source.droppableId !== destination.droppableId) {
          await api.patch(`/api/projects/${projectId}/tasks/${moving._id}`, { completedAt: moving.completedAt });
          refetchProject(true);
        }
      } catch (err) {
        toast(msg(err, "Failed to move"), "error", { title: "Couldn't move the card" });
        refetch(true);
      }
    },
    [columns, tasks, filter, projectId, setData, saveColumns, refetchProject, refetch, toast],
  );

  return {
    project,
    columns,
    tasks,
    ready: data !== null,
    loading,
    error,
    refetch,
    filter,
    setFilter,
    clearFilter,
    filtering,
    allByColumn: all,
    visibleByColumn: visible,
    visibleCount,
    doneCount,
    updateTask,
    removeTask,
    patchTask,
    moveTask,
    deleteTask,
    addTasks,
    deleteTasks,
    addList,
    renameList,
    recolorList,
    deleteList,
    moveList,
    sortList,
    onDragEnd,
  };
}

export type Board = ReturnType<typeof useBoard>;
