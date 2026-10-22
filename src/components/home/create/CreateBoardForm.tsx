"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { api, cn } from "@/lib/client";
import { BOARD_COLORS, BOARD_TEMPLATES } from "@/lib/constants";
import type { Project } from "@/lib/types";
import { Button, Field, Input, SectionMessage, TagInput, Textarea, useToast } from "@/components/ui";
import { recordBoardVisit } from "../recent";
import { boardHref, templateSummary } from "../board-utils";
import { BoardPreview } from "./BoardPreview";

const TITLE_MAX = 120;

/** Roving-tabindex radio group helper: arrow keys move the selection, one tab stop for the whole group. */
function useRadioKeys(count: number, index: number, select: (i: number) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % count;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + count) % count;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = count - 1;
    if (next < 0) return;
    e.preventDefault();
    select(next);
    refs.current[next]?.focus();
  };
  return { refs, onKeyDown };
}

/**
 * The body of Trello's "Create board" popover: preview, background, title, lists template and an optional
 * description and tags. Used inside a 304px Popover (desktop), a bottom sheet (phone) or a small Modal.
 * POST is exactly /api/projects { name, description, color, tags, template }.
 */
export function CreateBoardForm({
  onClose,
  onCreated,
  initialTemplate,
  initialColor,
}: {
  onClose: () => void;
  onCreated?: (p: Project) => void;
  initialTemplate?: string;
  initialColor?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const uid = useId();
  const titleRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [color, setColor] = useState(BOARD_COLORS.some((c) => c.id === initialColor) ? (initialColor as string) : BOARD_COLORS[0].id);
  const [template, setTemplate] = useState(BOARD_TEMPLATES.some((t) => t.id === initialTemplate) ? (initialTemplate as string) : BOARD_TEMPLATES[0].id);
  const [more, setMore] = useState(false);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const trimmed = name.trim();
  const titleError = !trimmed ? "Board title is required" : trimmed.length > TITLE_MAX ? `Keep the title under ${TITLE_MAX} characters` : null;
  const invalid = !!titleError;
  const tpl = BOARD_TEMPLATES.find((t) => t.id === template) ?? BOARD_TEMPLATES[0];

  const colorIndex = Math.max(0, BOARD_COLORS.findIndex((c) => c.id === color));
  const tplIndex = Math.max(0, BOARD_TEMPLATES.findIndex((t) => t.id === template));
  const colorKeys = useRadioKeys(BOARD_COLORS.length, colorIndex, (i) => setColor(BOARD_COLORS[i].id));
  const tplKeys = useRadioKeys(BOARD_TEMPLATES.length, tplIndex, (i) => setTemplate(BOARD_TEMPLATES[i].id));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setTouched(true);
    if (titleError) {
      titleRef.current?.focus();
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      const p = await api.post<Project>("/api/projects", { name: trimmed, description, color, tags, template });
      toast(`Board “${p.name}” created`, "success");
      recordBoardVisit(p._id);
      onClose();
      onCreated?.(p);
      router.push(boardHref(p._id));
    } catch (err) {
      setFailure(err instanceof Error && err.message ? err.message : "Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const bgLabelId = `${uid}-bg`;
  const tplLabelId = `${uid}-tpl`;

  return (
    <form onSubmit={submit} noValidate className="space-y-3">
      <BoardPreview color={color} title={name} columns={tpl.columns} />

      <div>
        <div id={bgLabelId} className="t-label">
          Background
        </div>
        <div role="radiogroup" aria-labelledby={bgLabelId} onKeyDown={colorKeys.onKeyDown} className="grid grid-cols-5 gap-2 p-1">
          {BOARD_COLORS.map((c, i) => {
            const on = c.id === color;
            return (
              <button
                key={c.id}
                ref={(el) => {
                  colorKeys.refs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={c.label}
                title={c.label}
                tabIndex={on ? 0 : -1}
                onClick={() => setColor(c.id)}
                className={cn("relative flex h-8 items-center justify-center rounded-control text-white transition-[filter] hover:brightness-90", on && "ring-2 ring-brand ring-offset-2")}
                style={{ background: c.css }}
              >
                {on ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/45">
                    <Check size={12} strokeWidth={3} aria-hidden />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Board title" required error={touched ? titleError : null}>
        <Input
          ref={titleRef}
          size="sm"
          value={name}
          maxLength={TITLE_MAX}
          autoComplete="off"
          enterKeyHint="done"
          placeholder="Portfolio site"
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name && setTouched(true)}
          data-autofocus
        />
        {name.length >= 100 ? <span className="mt-1 block text-right text-micro text-ink-muted">{name.length}/{TITLE_MAX}</span> : null}
      </Field>

      <div>
        <div id={tplLabelId} className="t-label">
          Start with lists
        </div>
        <div role="radiogroup" aria-labelledby={tplLabelId} onKeyDown={tplKeys.onKeyDown} className="grid grid-cols-2 gap-2">
          {BOARD_TEMPLATES.map((t, i) => {
            const on = t.id === template;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tplKeys.refs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setTemplate(t.id)}
                className={cn(
                  "flex h-8 items-center justify-center rounded-control border px-2 text-body font-medium transition-colors",
                  on ? "border-brand bg-brand-soft text-brand" : "border-border-input bg-canvas text-ink hover:bg-surface"
                )}
              >
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-body-sm text-ink-muted" aria-live="polite">
          Lists: {templateSummary(tpl.columns)}
        </p>
      </div>

      <div>
        <Button
          type="button"
          variant="link"
          aria-expanded={more}
          aria-controls={`${uid}-more`}
          icon={more ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          onClick={() => setMore((v) => !v)}
        >
          Add description and tags
        </Button>
        {more ? (
          <div id={`${uid}-more`} className="mt-3 space-y-3">
            <Field label="Description" hint="(optional)">
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this project about?" className="!min-h-[64px]" />
            </Field>
            <Field label="Tags" hint="(optional)">
              <TagInput value={tags} onChange={setTags} placeholder="nextjs, mongodb" />
            </Field>
          </div>
        ) : null}
      </div>

      {failure ? (
        <SectionMessage appearance="error" title="Couldn't create the board" className="!p-3">
          {failure}
        </SectionMessage>
      ) : null}

      <Button
        type="submit"
        fullWidth
        loading={busy}
        aria-disabled={invalid || undefined}
        className={invalid ? "cursor-not-allowed bg-fill-subtle text-ink-disabled hover:bg-fill-subtle active:bg-fill-subtle" : undefined}
      >
        Create
      </Button>
    </form>
  );
}
