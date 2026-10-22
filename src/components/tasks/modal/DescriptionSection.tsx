"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AlignLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/client";
import { Button, Kbd, SectionMessage } from "@/components/ui";
import { Section } from "./Section";

const COLLAPSED_MAX = 320;

/** Rendered markdown. Links open in a new tab, images stay inside the column, long text collapses with "Show more". */
function DescriptionView({ text, onEdit }: { text: string; onEdit: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setOverflows(el.scrollHeight > COLLAPSED_MAX + 32);
  }, [text]);

  const clipped = overflows && !expanded;
  return (
    <div>
      <div
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest("a, button, summary")) return;
          if (window.getSelection()?.toString()) return;
          onEdit();
        }}
        className="relative -mx-2 cursor-text rounded-control px-2 py-1 hover:bg-fill-subtle"
      >
        <div
          ref={ref}
          className={cn("prose-note break-words text-ink [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_img]:max-w-full", clipped && "overflow-hidden")}
          style={clipped ? { maxHeight: COLLAPSED_MAX } : undefined}
        >
          <ReactMarkdown
            components={{
              a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
        {clipped ? <div aria-hidden className="pointer-events-none absolute inset-x-2 bottom-1 h-16" style={{ background: "linear-gradient(to top, var(--color-list), transparent)" }} /> : null}
      </div>
      {overflows ? (
        <Button variant="link" className="mt-1" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? "Show less" : "Show more"}
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Description: grey "Add a more detailed description..." button when empty, rendered markdown when set (click or Edit to
 * change), a textarea with Save / Cancel while editing. Esc with unsaved text keeps the draft and shows the unsaved bar.
 */
export function DescriptionSection({
  description,
  editing,
  draft,
  saving,
  onStartEdit,
  onDraftChange,
  onSave,
  onCancel,
  onEscape,
  onResume,
}: {
  description: string;
  editing: boolean;
  /** Unsaved text, or null when there is no pending edit. */
  draft: string | null;
  saving: boolean;
  onStartEdit: () => void;
  onDraftChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEscape: () => void;
  onResume: () => void;
}) {
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const dirty = draft !== null && draft !== description;
  const value = draft ?? description;

  // Auto-grow between 108px and 60vh, then scroll.
  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!editing || !el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight + 2, 108), Math.round(window.innerHeight * 0.6))}px`;
  }, [editing, value]);

  useLayoutEffect(() => {
    if (editing) {
      const el = areaRef.current;
      el?.focus({ preventScroll: true });
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);

  return (
    <Section
      icon={<AlignLeft size={20} />}
      title="Description"
      actions={
        description && !editing ? (
          <Button variant="secondary" size="sm" onClick={onStartEdit}>
            Edit
          </Button>
        ) : null
      }
    >
      {!editing && dirty ? (
        <SectionMessage
          appearance="warning"
          className="mb-3"
          actions={
            <>
              <Button variant="link" onClick={onResume}>
                View edits
              </Button>
              <Button variant="link" onClick={onSave}>
                Save
              </Button>
              <Button variant="link" onClick={onCancel}>
                Discard
              </Button>
            </>
          }
        >
          You have unsaved edits on this field.
        </SectionMessage>
      ) : null}

      {editing ? (
        <div>
          <textarea
            ref={areaRef}
            value={value}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onEscape();
              } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSave();
              }
            }}
            aria-label="Description"
            placeholder="Add a more detailed description..."
            className="t-input resize-none"
            style={{ minHeight: 108 }}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button onClick={onSave} loading={saving}>
              Save
            </Button>
            <Button variant="subtle" onClick={onCancel}>
              Cancel
            </Button>
            <p className="ml-auto text-body-sm text-ink-soft">
              Markdown supported
              <span className="hidden sm:inline">
                {" "}
                &middot; <Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd> to save
              </span>
            </p>
          </div>
        </div>
      ) : description ? (
        <DescriptionView text={description} onEdit={onStartEdit} />
      ) : (
        <button
          type="button"
          onClick={onStartEdit}
          className="flex min-h-14 w-full items-start rounded-control bg-fill px-3 py-2 text-left text-body text-ink hover:bg-fill-hover active:bg-fill-pressed"
        >
          Add a more detailed description...
        </button>
      )}
    </Section>
  );
}
