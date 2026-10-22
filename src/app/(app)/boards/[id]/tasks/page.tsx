"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import type { Column, Task } from "@/lib/types";
import { TaskModal } from "@/components/tasks/TaskModal";
import { Button, ConfirmDialog, SectionMessage, useToast } from "@/components/ui";
import { useBoard } from "@/components/tasks/board/useBoard";
import { useLabelsExpanded } from "@/components/tasks/board/useLabelsExpanded";
import { BoardToolbar } from "@/components/tasks/board/BoardToolbar";
import { BoardList, type ListActions } from "@/components/tasks/board/BoardList";
import { AddListComposer } from "@/components/tasks/board/AddListComposer";
import { BoardSkeleton, NoListsState } from "@/components/tasks/board/BoardStates";
import { DndMotionFix } from "@/components/tasks/board/DndMotionFix";

/** Keys like "f" and "x" must not fire while typing or while a dialog is open. */
function shortcutsBlocked(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return true;
  return !!document.querySelector('[aria-modal="true"], [role="dialog"], [role="menu"]');
}

export default function TasksPage() {
  const board = useBoard();
  const { columns, tasks, ready, error, loading } = board;
  const { toast } = useToast();
  const [labelsExpanded, toggleLabels] = useLabelsExpanded();

  const [openTask, setOpenTask] = useState<string | null>(null);
  const [composing, setComposing] = useState<string | null>(null);
  const [addingList, setAddingList] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<Task | null>(null);
  const [listToDelete, setListToDelete] = useState<Column | null>(null);
  const drafts = useRef<Record<string, string>>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  // f opens the filter, x clears it (Trello shortcuts)
  const { clearFilter } = board;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (shortcutsBlocked(e)) return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setFilterOpen(true);
      } else if (e.key === "x" || e.key === "X") {
        clearFilter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearFilter]);

  const { addTasks, deleteTasks } = board;
  const addCards = useCallback(
    async (columnId: string, titles: string[], pasted: boolean) => {
      const created = await addTasks(columnId, titles);
      // Pasting many lines is a bulk action worth an Undo; typed Enter adds stay quiet.
      if (pasted && created.length > 1) {
        toast(`Added ${created.length} cards`, "success", { duration: 5000, action: { label: "Undo", onClick: () => void deleteTasks(created) } });
      }
    },
    [addTasks, deleteTasks, toast],
  );

  const actions: ListActions = useMemo(
    () => ({
      openCard: setOpenTask,
      requestDeleteCard: setCardToDelete,
      requestDeleteList: (c) => {
        if (columns.length <= 1) {
          toast("You need at least one list", "error");
          return;
        }
        setListToDelete(c);
      },
      composing,
      setComposing,
      getDraft: (id) => drafts.current[id] ?? "",
      setDraft: (id, text) => {
        drafts.current[id] = text;
      },
      addCards,
      labelsExpanded,
      toggleLabels,
    }),
    [columns.length, composing, addCards, labelsExpanded, toggleLabels, toast],
  );

  const current = openTask ? tasks.find((t) => t._id === openTask) : null;

  if (!ready && loading && !error) return <BoardSkeleton />;
  if (!ready) {
    return (
      <div className="px-3 pt-3 sm:px-2">
        <SectionMessage
          appearance="error"
          className="max-w-xl"
          title="Couldn't load the board"
          actions={
            <Button variant="link" onClick={() => void board.refetch()}>
              Try again
            </Button>
          }
        >
          {error ?? "Something went wrong while loading the cards."}
        </SectionMessage>
      </div>
    );
  }

  const target = listToDelete ? columns.find((c) => c.id !== listToDelete.id) : null;
  const moved = listToDelete ? (board.allByColumn.get(listToDelete.id)?.length ?? 0) : 0;

  return (
    <div className="flex h-full min-h-[360px] flex-col">
      <DndMotionFix />
      <BoardToolbar board={board} filterOpen={filterOpen} onFilterOpenChange={setFilterOpen} />

      {error ? (
        <div className="shrink-0 px-3 pb-1 pt-1 sm:px-2">
          <SectionMessage
            appearance="error"
            className="max-w-xl"
            title="Couldn't refresh the board"
            actions={
              <Button variant="link" onClick={() => void board.refetch(true)}>
                Try again
              </Button>
            }
          >
            {error}
          </SectionMessage>
        </div>
      ) : null}

      {columns.length === 0 && !addingList ? (
        <NoListsState onAdd={() => setAddingList(true)} />
      ) : (
        <DragDropContext onDragEnd={board.onDragEnd}>
          <Droppable droppableId="board" type="LIST" direction="horizontal">
            {(provided) => (
              <div
                ref={(el) => {
                  provided.innerRef(el);
                  canvasRef.current = el;
                }}
                {...provided.droppableProps}
                className="board-canvas flex min-h-0 flex-1 items-start overflow-x-auto overflow-y-hidden px-3 pb-2 pt-1 [scrollbar-color:rgba(255,255,255,0.5)_rgba(0,0,0,0.16)] sm:px-2 [&>[data-rfd-placeholder-context-id]]:rounded-list [&>[data-rfd-placeholder-context-id]]:bg-black/20"
              >
                {columns.map((col, i) => (
                  <BoardList key={col.id} column={col} index={i} board={board} actions={actions} />
                ))}
                {provided.placeholder}
                <AddListComposer
                  first={columns.length === 0}
                  open={addingList}
                  onOpenChange={setAddingList}
                  onAdd={(title) => {
                    board.addList(title);
                    requestAnimationFrame(() => canvasRef.current?.scrollTo({ left: canvasRef.current.scrollWidth, behavior: "smooth" }));
                  }}
                />
                <div aria-hidden className="w-1 shrink-0 sm:w-0" />
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {current ? (
        <TaskModal
          task={current}
          columns={columns}
          projectId={board.project._id}
          onClose={() => setOpenTask(null)}
          onChange={board.updateTask}
          onDelete={board.removeTask}
        />
      ) : null}

      <ConfirmDialog
        open={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        title="Delete this card?"
        message={
          <>
            <strong className="font-semibold text-ink">{cardToDelete?.title}</strong> will be permanently deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete card"
        onConfirm={async () => {
          if (!cardToDelete) return;
          try {
            await board.deleteTask(cardToDelete);
          } catch (err) {
            toast(err instanceof Error ? err.message : "Failed to delete", "error", { title: "Couldn't delete the card" });
          }
        }}
      />

      <ConfirmDialog
        open={!!listToDelete}
        onClose={() => setListToDelete(null)}
        title={`Delete list ${listToDelete?.title ?? ""}?`}
        message={
          moved === 0
            ? "This list is empty. It will be removed from the board."
            : `The ${moved} ${moved === 1 ? "card" : "cards"} in this list will move to ${target ? `“${target.title}”` : "the first list"}. The list itself is removed.`
        }
        confirmLabel="Delete list"
        onConfirm={async () => {
          if (!listToDelete) return;
          await board.deleteList(listToDelete.id);
        }}
      />
    </div>
  );
}
