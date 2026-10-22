"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { ChecklistItem, Column, Task } from "@/lib/types";
import { ConfirmDialog, Modal, Popover, useToast } from "@/components/ui";
import { ActivitySection } from "./modal/ActivitySection";
import { ChecklistSection } from "./modal/ChecklistSection";
import { DeleteChecklistConfirm, ChecklistQuickAdd } from "./modal/ChecklistPanels";
import { DatesPanel } from "./modal/DatesPanel";
import { DescriptionSection } from "./modal/DescriptionSection";
import { LabelsPanel } from "./modal/LabelsPanel";
import { AddMenu, MoveMenu, PriorityMenu } from "./modal/MenuPanels";
import { MetaRow } from "./modal/MetaRow";
import { QuickActions } from "./modal/QuickActions";
import { Sidebar } from "./modal/Sidebar";
import { TitleRow } from "./modal/TitleRow";
import type { PopApi, PopKind, PopSource } from "./modal/types";
import { useTaskPatch } from "./modal/useTaskPatch";
import { uid } from "@/lib/client";

type OpenPop = { kind: PopKind; anchor: HTMLElement; source: PopSource; hadLabels: boolean };

const POP_TITLE: Record<PopKind, string> = {
  add: "Add to card",
  labels: "Labels",
  dates: "Dates",
  checklist: "Add checklist item",
  priority: "Priority",
  move: "Move card",
  deleteChecklist: "Delete checklist?",
};
const MENU_KINDS: PopKind[] = ["add", "priority", "move"];

/**
 * Trello-style card back. Same props as before; the page that renders it needs no changes.
 * Desktop: 768px, main column + 168px sidebar. Phones: full-screen single column.
 */
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
  const { patch, status, taskRef } = useTaskPatch({ task, projectId, onChange });
  const rootRef = useRef<HTMLDivElement>(null);

  // ---- popovers: one at a time, anchored to whichever button opened them
  const [pop, setPop] = useState<OpenPop | null>(null);
  const popRef = useRef<OpenPop | null>(null);
  popRef.current = pop;

  const closePop = useCallback(() => {
    const a = popRef.current?.anchor;
    setPop(null);
    // Give focus back to the opener unless the user already moved it somewhere else.
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (a?.isConnected && (!active || active === document.body)) a.focus({ preventScroll: true });
    });
  }, []);

  const popApi = useMemo<PopApi>(
    () => ({
      open: (kind, anchor, source) =>
        setPop((p) => (p && p.kind === kind && p.source === source ? null : { kind, anchor, source, hadLabels: taskRef.current.labels.length > 0 })),
      isOpen: (kind, source) => !!pop && pop.kind === kind && pop.source === source,
    }),
    [pop, taskRef]
  );

  // ---- description draft (kept here so closing the card can save it)
  const [descEditing, setDescEditing] = useState(false);
  const [descDraft, setDescDraft] = useState<string | null>(null);
  const [descSaving, setDescSaving] = useState(false);
  const descDirty = descDraft !== null && descDraft !== task.description;
  const descRef = useRef({ draft: descDraft, saved: task.description });
  descRef.current = { draft: descDraft, saved: task.description };

  const [confirmDelete, setConfirmDelete] = useState(false);

  async function saveDescription() {
    const text = descRef.current.draft;
    if (text === null) {
      setDescEditing(false);
      return;
    }
    if (text === descRef.current.saved) {
      setDescEditing(false);
      setDescDraft(null);
      return;
    }
    setDescSaving(true);
    setDescEditing(false);
    setDescDraft(null);
    const ok = await patch({ description: text });
    setDescSaving(false);
    if (!ok) {
      // Never lose what the user typed: put it back in the editor.
      setDescDraft(text);
      setDescEditing(true);
    }
  }

  // Warn before the tab itself is closed with an unsaved description.
  useEffect(() => {
    if (!descDirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [descDirty]);

  // ---- closing: a click on the blanket that only dismissed a popover must not also close the card;
  // unsaved description text is saved instead of being lost.
  const lastPointer = useRef<{ onBlanket: boolean; popOpen: boolean; t: number } | null>(null);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const el = e.target as Element | null;
      const dialog = rootRef.current?.closest('[role="dialog"]');
      const onBlanket = !!el && !!dialog && !dialog.contains(el) && !el.closest(".popover-surface");
      lastPointer.current = { onBlanket, popOpen: popRef.current !== null, t: performance.now() };
    };
    const onKey = () => {
      lastPointer.current = null;
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  const handleClose = useCallback(() => {
    const last = lastPointer.current;
    if (last && last.onBlanket && last.popOpen && performance.now() - last.t < 600) {
      lastPointer.current = null;
      return;
    }
    const { draft, saved } = descRef.current;
    if (draft !== null && draft !== saved) {
      void patch({ description: draft }).then((ok) => {
        if (ok) toast("Description saved.", "success");
      });
    }
    onClose();
  }, [onClose, patch, toast]);

  // ---- actions
  const setComplete = useCallback((done: boolean) => void patch({ completedAt: done ? new Date().toISOString() : null }), [patch]);
  const toggleLabel = useCallback(
    (id: string) => {
      const cur = taskRef.current.labels;
      void patch({ labels: cur.includes(id) ? cur.filter((l) => l !== id) : [...cur, id] });
    },
    [patch, taskRef]
  );
  const setChecklist = useCallback((next: ChecklistItem[]) => void patch({ checklist: next }), [patch]);
  const addChecklistItems = useCallback(
    (texts: string[]) => void patch({ checklist: [...taskRef.current.checklist, ...texts.map((text) => ({ id: uid(), text, done: false }))] }),
    [patch, taskRef]
  );

  async function deleteCard() {
    try {
      await api.del(`/api/projects/${projectId}/tasks/${task._id}`);
    } catch (err) {
      toast(err instanceof Error && err.message ? `Couldn't delete the card. ${err.message}` : "Couldn't delete the card. Try again.", "error");
      return;
    }
    onDelete(task._id);
    onClose();
    toast("Card deleted.", "success");
  }

  const column = columns.find((c) => c.id === task.columnId);
  // Keep the Labels group mounted while its popover is open (it may be the anchor), but never create an empty one just for opening.
  const showLabels = task.labels.length > 0 || (pop?.kind === "labels" && pop.hadLabels);
  const isMenu = pop ? MENU_KINDS.includes(pop.kind) : false;

  return (
    <>
      <Modal
        open
        onClose={handleClose}
        title={`Card: ${task.title}`}
        hideHeader
        flush
        scrim="strong"
        width="max-w-[768px]"
        className="max-sm:-m-4 max-sm:h-dvh max-sm:max-h-none max-sm:w-[calc(100%+2rem)] max-sm:max-w-none max-sm:rounded-none"
      >
        <div ref={rootRef} data-autofocus tabIndex={-1} className="min-h-full bg-list text-ink outline-none">
          <TitleRow
            task={task}
            column={column}
            status={status}
            pop={popApi}
            onTitle={(title) => void patch({ title })}
            onComplete={setComplete}
          />

          <div className="md:flex md:items-start">
            <main className="min-w-0 flex-1 px-4 pb-6 md:pb-8 md:pr-2">
              <div className="pl-8 md:pl-10">
                <div className="mt-3">
                  <QuickActions pop={popApi} />
                </div>
                <MetaRow task={task} pop={popApi} showLabels={showLabels} onComplete={setComplete} />
              </div>

              <div className="pl-8 md:pl-10">
                <DescriptionSection
                  description={task.description}
                  editing={descEditing}
                  draft={descDraft}
                  saving={descSaving}
                  onStartEdit={() => {
                    setDescDraft((d) => d ?? task.description);
                    setDescEditing(true);
                  }}
                  onResume={() => setDescEditing(true)}
                  onDraftChange={setDescDraft}
                  onSave={() => void saveDescription()}
                  onCancel={() => {
                    setDescEditing(false);
                    setDescDraft(null);
                  }}
                  onEscape={() => {
                    // Clean text: just close the editor. Dirty text: keep it and show the unsaved bar.
                    setDescEditing(false);
                    if (descRef.current.draft === descRef.current.saved) setDescDraft(null);
                  }}
                />

                {task.checklist.length > 0 ? <ChecklistSection items={task.checklist} onChange={setChecklist} pop={popApi} /> : null}

                <ActivitySection task={task} />
              </div>
            </main>

            <Sidebar pop={popApi} completed={Boolean(task.completedAt)} onComplete={setComplete} onDelete={() => setConfirmDelete(true)} />
          </div>
        </div>
      </Modal>

      {pop ? (
        <Popover
          key={pop.kind}
          open
          anchor={pop.anchor}
          onOpenChange={(o) => {
            if (!o) closePop();
          }}
          title={POP_TITLE[pop.kind]}
          role={isMenu ? "menu" : "dialog"}
          padded={!isMenu}
          bodyClassName={isMenu ? "pb-2" : undefined}
          mobileSheet
          restoreFocus={false}
          className="!z-[600]"
        >
          {pop.kind === "add" ? <AddMenu onPick={(k) => setPop({ ...pop, kind: k })} /> : null}
          {pop.kind === "labels" ? <LabelsPanel selected={task.labels} onToggle={toggleLabel} /> : null}
          {pop.kind === "dates" ? (
            <DatesPanel
              dueDate={task.dueDate}
              onSave={(iso) => {
                void patch({ dueDate: iso });
                closePop();
              }}
              onRemove={() => {
                void patch({ dueDate: null });
                closePop();
              }}
            />
          ) : null}
          {pop.kind === "checklist" ? <ChecklistQuickAdd count={task.checklist.length} onAdd={addChecklistItems} /> : null}
          {pop.kind === "priority" ? (
            <PriorityMenu
              value={task.priority}
              onPick={(p) => {
                if (p !== task.priority) void patch({ priority: p });
              }}
            />
          ) : null}
          {pop.kind === "move" ? (
            <MoveMenu
              columns={columns}
              currentId={task.columnId}
              onPick={(id) => {
                if (id !== task.columnId) void patch({ columnId: id });
              }}
            />
          ) : null}
          {pop.kind === "deleteChecklist" ? (
            <DeleteChecklistConfirm
              onConfirm={() => {
                void patch({ checklist: [] });
                closePop();
              }}
            />
          ) : null}
        </Popover>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteCard}
        title={`Delete card "${task.title.length > 48 ? `${task.title.slice(0, 48)}...` : task.title}"?`}
        message="This permanently deletes the card with its description, labels and checklist. There is no undo."
        confirmLabel="Delete card"
      />
    </>
  );
}
