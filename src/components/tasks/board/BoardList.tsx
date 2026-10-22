"use client";

import { useEffect, useRef, useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { cn } from "@/lib/client";
import { labelColor } from "@/lib/constants";
import type { Column, Task } from "@/lib/types";
import { Button, InlineEdit } from "@/components/ui";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CardComposer } from "./CardComposer";
import { ListMenu } from "./ListMenu";
import { QuickEdit } from "./QuickEdit";
import type { Board } from "./useBoard";

export type ListActions = {
  openCard: (id: string) => void;
  requestDeleteCard: (task: Task) => void;
  requestDeleteList: (column: Column) => void;
  composing: string | null;
  setComposing: (columnId: string | null) => void;
  getDraft: (columnId: string) => string;
  setDraft: (columnId: string, text: string) => void;
  addCards: (columnId: string, titles: string[], pasted: boolean) => Promise<void>;
  labelsExpanded: boolean;
  toggleLabels: () => void;
};

/** One Trello list: draggable by its header, title that renames in place, scrolling cards, add-card footer. */
export function BoardList({ column, index, board, actions }: { column: Column; index: number; board: Board; actions: ListActions }) {
  const cards = board.visibleByColumn.get(column.id) ?? [];
  const total = board.allByColumn.get(column.id)?.length ?? 0;
  const [renaming, setRenaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composing = actions.composing === column.id;
  const accent = labelColor(column.color);

  // keep the newest card (and the composer under it) in view while adding several cards in a row
  const prevTotal = useRef(total);
  useEffect(() => {
    if (composing && total > prevTotal.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
    prevTotal.current = total;
  }, [total, composing]);

  return (
    <Draggable draggableId={`list:${column.id}`} index={index} isDragDisabled={renaming}>
      {(p, s) => (
        <div
          ref={p.innerRef}
          {...p.draggableProps}
          className={cn("mr-2 flex max-h-full w-[var(--w-list)] shrink-0 flex-col", s.isDragging && "rotate-3 opacity-95 motion-reduce:rotate-0")}
        >
          <section
            role="group"
            aria-label={`List ${column.title}`}
            data-list-id={column.id}
            className={cn(
              "t-list flex min-h-0 flex-col overflow-hidden",
              "has-[[data-over=true]]:ring-2 has-[[data-over=true]]:ring-brand-soft-pressed",
              s.isDragging && "shadow-overlay",
            )}
          >
            <div aria-hidden className="h-1 shrink-0" style={{ background: accent.bg }} />

            {/* Header = drag handle. Title is an InlineEdit, so it only drags from the free space beside it. */}
            <div
              {...(p.dragHandleProps ?? {})}
              role={undefined}
              tabIndex={-1}
              aria-describedby={undefined}
              className="flex shrink-0 cursor-grab items-start gap-1 pb-1 pl-5 pr-2 pt-2 active:cursor-grabbing"
            >
              <InlineEdit
                as="h3"
                label="List title"
                value={column.title}
                maxLength={60}
                editing={renaming}
                onEditingChange={setRenaming}
                onSave={(t) => board.renameList(column.id, t)}
                className={renaming ? "flex-1" : "flex-initial"}
                textClassName="text-h-xs font-semibold leading-6"
              />
              <span
                className="ml-auto flex h-8 shrink-0 items-center pl-1 text-body-sm tabular-nums text-ink-muted"
                aria-label={board.filtering ? `${cards.length} of ${total} cards` : `${total} ${total === 1 ? "card" : "cards"}`}
              >
                {board.filtering && cards.length !== total ? `${cards.length} of ${total}` : total}
              </span>
              <ListMenu
                column={column}
                columns={board.columns}
                cardCount={total}
                onAddCard={() => actions.setComposing(column.id)}
                onRename={() => setRenaming(true)}
                onColor={(c) => board.recolorList(column.id, c)}
                onSort={(by) => void board.sortList(column.id, by)}
                onMove={(i) => board.moveList(column.id, i)}
                onDelete={() => actions.requestDeleteList(column)}
              />
            </div>

            {/* Cards scroll inside the list */}
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <Droppable droppableId={column.id}>
                {(dp, ds) => (
                  <div
                    ref={dp.innerRef}
                    {...dp.droppableProps}
                    data-over={ds.isDraggingOver}
                    className={cn(
                      "relative px-2 pt-1",
                      total === 0 || cards.length === 0 ? "min-h-16" : "min-h-2",
                      "[&>[data-rfd-placeholder-context-id]]:rounded-card [&>[data-rfd-placeholder-context-id]]:bg-fill-hover",
                    )}
                  >
                    {cards.map((t, i) => (
                      <BoardCard key={t._id} task={t} index={i} board={board} actions={actions} />
                    ))}
                    {dp.placeholder}
                    {cards.length === 0 ? (
                      <p
                        className={cn(
                          "pointer-events-none absolute inset-x-2 top-3 text-center text-body-sm text-ink-muted transition-opacity",
                          (ds.isDraggingOver || !!ds.draggingFromThisWith) && "opacity-0",
                        )}
                      >
                        {total === 0 ? "Drag cards here or add one" : "No matching cards."}
                      </p>
                    ) : null}
                  </div>
                )}
              </Droppable>
              {composing ? (
                <CardComposer
                  initialText={actions.getDraft(column.id)}
                  onDraft={(text) => actions.setDraft(column.id, text)}
                  onClose={() => actions.setComposing(null)}
                  onSubmit={async (titles, { pasted }) => {
                    await actions.addCards(column.id, titles, pasted);
                  }}
                />
              ) : null}
            </div>

            {composing ? null : (
              <div className="shrink-0 p-2 pt-1">
                <Button
                  variant="subtle"
                  fullWidth
                  alignStart
                  icon={<Plus size={16} />}
                  className="text-ink-soft"
                  onClick={() => actions.setComposing(column.id)}
                >
                  Add a card
                </Button>
              </div>
            )}
          </section>
        </div>
      )}
    </Draggable>
  );
}

function BoardCard({ task, index, board, actions }: { task: Task; index: number; board: Board; actions: ListActions }) {
  const [quick, setQuick] = useState(false);
  return (
    <Draggable draggableId={task._id} index={index} isDragDisabled={quick}>
      {(p, s) => (
        <TaskCard
          task={task}
          className="mb-2"
          wrapperRef={p.innerRef}
          wrapperProps={p.draggableProps}
          handleProps={p.dragHandleProps}
          dragging={s.isDragging}
          labelsExpanded={actions.labelsExpanded}
          onToggleLabels={actions.toggleLabels}
          onOpen={() => actions.openCard(task._id)}
          onToggleComplete={() => void board.patchTask(task, { completedAt: task.completedAt ? null : new Date().toISOString() })}
          onQuickEdit={() => setQuick(true)}
          actions={
            <QuickEdit
              task={task}
              columns={board.columns}
              open={quick}
              onOpenChange={setQuick}
              onPatch={(u) => void board.patchTask(task, u)}
              onMove={(columnId) => void board.moveTask(task, columnId)}
              onOpenCard={() => actions.openCard(task._id)}
              onDelete={() => actions.requestDeleteCard(task)}
            />
          }
        />
      )}
    </Draggable>
  );
}
