"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightLeft, Check, ChevronRight, Circle, CircleCheck, Clock, ExternalLink, Pencil, Tag, Trash2 } from "lucide-react";
import { toDateInput } from "@/lib/client";
import { LABEL_COLORS } from "@/lib/constants";
import type { Column, Task } from "@/lib/types";
import { Button, Field, IconButton, Input, LabelChip, Popover, PopoverDivider, PopoverItem, PopoverSection, Textarea } from "@/components/ui";

type View = "root" | "labels" | "due" | "move";

/**
 * Trello quick edit: a pencil that fades in on card hover and opens a small popover with the
 * title, Open card, labels, due date, complete toggle and delete. Every change is an optimistic PATCH.
 * The pencil is a sibling of the card face, so no interactive element is nested inside the drag handle.
 */
export function QuickEdit({
  task,
  columns,
  open,
  onOpenChange,
  onPatch,
  onMove,
  onOpenCard,
  onDelete,
}: {
  task: Task;
  columns: Column[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatch: (update: Partial<Task>) => void;
  onMove: (columnId: string) => void;
  onOpenCard: () => void;
  onDelete: () => void;
}) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState<View>("root");
  const done = Boolean(task.completedAt);

  useEffect(() => {
    if (!open) setView("root");
  }, [open]);

  const close = () => onOpenChange(false);
  const title = view === "labels" ? "Labels" : view === "due" ? "Due date" : view === "move" ? "Move card" : "Edit card";

  return (
    <>
      <IconButton
        ref={anchorRef}
        title="Edit card"
        aria-label={`Edit card: ${task.title}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        tooltip={false}
        onClick={(e) => {
          e.stopPropagation();
          onOpenChange(!open);
        }}
        className="absolute right-1 top-1 z-[1] h-7 w-7 bg-list text-ink-soft opacity-0 hover:bg-fill-hover focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 aria-expanded:opacity-100 pointer-coarse:hidden"
      >
        <Pencil size={14} />
      </IconButton>
      <Popover
        open={open}
        onOpenChange={onOpenChange}
        anchorRef={anchorRef}
        title={title}
        onBack={view === "root" ? undefined : () => setView("root")}
        placement="bottom-end"
        width={304}
      >
        {view === "root" ? (
          <RootView task={task} columns={columns} done={done} onPatch={onPatch} onOpenCard={onOpenCard} onDelete={onDelete} setView={setView} close={close} />
        ) : null}
        {view === "move" ? (
          <div className="-mx-3 flex flex-col">
            {columns.map((c) => {
              const current = c.id === task.columnId;
              return (
                <PopoverItem
                  key={c.id}
                  disabled={current}
                  trailing={current ? <Check size={16} className="text-ink-muted" /> : undefined}
                  description={current ? "Current list" : undefined}
                  closeOnClick
                  onClick={() => onMove(c.id)}
                >
                  {c.title}
                </PopoverItem>
              );
            })}
            <p className="px-3 pt-2 text-body-sm text-ink-muted">The card goes to the bottom of the list.</p>
          </div>
        ) : null}
        {view === "labels" ? (
          <div className="grid grid-cols-2 gap-1">
            {LABEL_COLORS.map((c) => {
              const on = task.labels.includes(c.id);
              return (
                <div key={c.id} className="min-w-0">
                  <LabelChip
                    color={c.id}
                    name={c.label}
                    variant="large"
                    selected={on}
                    onClick={() => onPatch({ labels: on ? task.labels.filter((l) => l !== c.id) : [...task.labels, c.id] })}
                  />
                </div>
              );
            })}
          </div>
        ) : null}
        {view === "due" ? (
          <div>
            <Field label="Due date" htmlFor="quick-due">
              <Input
                id="quick-due"
                type="date"
                size="sm"
                value={toDateInput(task.dueDate)}
                onChange={(e) => onPatch({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </Field>
            <div className="mt-3 flex gap-2">
              <Button size="md" onClick={() => setView("root")}>
                Done
              </Button>
              {task.dueDate ? (
                <Button size="md" variant="secondary" onClick={() => onPatch({ dueDate: null })}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Popover>
    </>
  );
}

function RootView({
  task,
  columns,
  done,
  onPatch,
  onOpenCard,
  onDelete,
  setView,
  close,
}: {
  task: Task;
  columns: Column[];
  done: boolean;
  onPatch: (update: Partial<Task>) => void;
  onOpenCard: () => void;
  onDelete: () => void;
  setView: (v: View) => void;
  close: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    ref.current?.select();
  }, []);

  function save() {
    const next = title.replace(/\s*\n\s*/g, " ").trim();
    if (next && next !== task.title) onPatch({ title: next });
    close();
  }

  return (
    <div>
      <Textarea
        ref={ref}
        aria-label="Card title"
        value={title}
        rows={3}
        maxLength={512}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            save();
          }
        }}
        className="min-h-0 resize-none"
      />
      <div className="mt-2">
        <Button size="md" onClick={save} disabled={!title.trim()}>
          Save
        </Button>
      </div>
      <PopoverDivider className="mt-3" />
      <PopoverSection first>
        <div className="-mx-3 flex flex-col">
          <PopoverItem
            icon={<ExternalLink size={16} />}
            onClick={() => {
              close();
              onOpenCard();
            }}
          >
            Open card
          </PopoverItem>
          <PopoverItem icon={<Tag size={16} />} trailing={<ChevronRight size={16} className="text-ink-muted" />} onClick={() => setView("labels")}>
            Edit labels
          </PopoverItem>
          <PopoverItem icon={<Clock size={16} />} trailing={<ChevronRight size={16} className="text-ink-muted" />} onClick={() => setView("due")}>
            Edit due date
          </PopoverItem>
          <PopoverItem
            icon={<ArrowRightLeft size={16} />}
            trailing={<ChevronRight size={16} className="text-ink-muted" />}
            disabled={columns.length < 2}
            onClick={() => setView("move")}
          >
            Move card
          </PopoverItem>
          <PopoverItem
            icon={done ? <Circle size={16} /> : <CircleCheck size={16} />}
            onClick={() => {
              onPatch({ completedAt: done ? null : new Date().toISOString() });
              close();
            }}
          >
            {done ? "Mark incomplete" : "Mark complete"}
          </PopoverItem>
          <PopoverItem
            icon={<Trash2 size={16} />}
            danger
            onClick={() => {
              close();
              onDelete();
            }}
          >
            Delete card
          </PopoverItem>
        </div>
      </PopoverSection>
    </div>
  );
}
