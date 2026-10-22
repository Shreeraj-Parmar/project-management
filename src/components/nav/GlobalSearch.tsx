"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/client";
import { Kbd, Popover, SearchInput, Skeleton } from "@/components/ui";
import { boardHref, searchBoards, STATUS_META } from "../home/board-utils";
import { recordBoardVisit, useRecentBoards } from "../home/recent";
import { BoardThumb } from "./BoardThumb";
import { boardsResource, useBoards } from "./store";
import type { Tone } from "./HeaderMenus";

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-bold text-ink">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  );
}

/** One quiet line under the board name: the matching tag, else the description, else the status. */
function subline(p: Project, q: string): string {
  const s = q.toLowerCase();
  const tag = s ? (p.tags ?? []).find((t) => t.toLowerCase().includes(s)) : undefined;
  if (tag && !p.name.toLowerCase().includes(s)) return `#${tag}`;
  if (p.description) return p.description;
  if (p.tags?.length) return p.tags.map((t) => `#${t}`).join(" ");
  return STATUS_META[p.status].label;
}

/**
 * Header search: a combobox that expands on focus and lists matching boards (name, description, tags) live.
 * Up/Down move through the rows, Enter opens, Esc closes the panel (and clears the text), Esc again leaves the field.
 * `overlay` = the full-width phone variant that replaces the header content.
 */
export function GlobalSearch({
  tone,
  onSearch,
  overlay,
  onDone,
}: {
  tone: Tone;
  onSearch?: (q: string) => void;
  overlay?: boolean;
  /** Called after a board was chosen (phone overlay closes itself). */
  onDone?: () => void;
}) {
  const router = useRouter();
  const boards = useBoards();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const q = query.trim();
  const recent = useRecentBoards(boards.data, { limit: 5 });
  const results = useMemo(() => (q ? searchBoards(boards.data ?? [], q).slice(0, 8) : []), [boards.data, q]);
  const rows: Project[] = q ? results : recent.map((r) => r.project);
  const activeIndex = rows.length === 0 ? -1 : q ? Math.min(Math.max(active, 0), rows.length - 1) : active;
  const optId = (i: number) => `${listId}-opt-${i}`;

  useEffect(() => {
    if (open && activeIndex >= 0) document.getElementById(optId(activeIndex))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, open]);

  function choose(p: Project) {
    recordBoardVisit(p._id);
    setOpen(false);
    setQuery("");
    setActive(-1);
    onSearch?.("");
    inputRef.current?.blur();
    router.push(boardHref(p._id));
    onDone?.();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!rows.length) return;
      e.preventDefault();
      setOpen(true);
      const dir = e.key === "ArrowDown" ? 1 : -1;
      setActive(activeIndex < 0 ? (dir > 0 ? 0 : rows.length - 1) : (activeIndex + dir + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      if (open && activeIndex >= 0 && rows[activeIndex]) {
        e.preventDefault();
        choose(rows[activeIndex]);
      }
    } else if (e.key === "Escape") {
      if (open) setOpen(false);
      else {
        inputRef.current?.blur();
        onDone?.();
      }
    }
  }

  return (
    <>
      <div ref={setAnchor} className={cn("group/gs relative", overlay ? "min-w-0 flex-1" : "hidden w-full sm:block sm:w-auto")}>
        <SearchInput
          ref={inputRef}
          data-global-search=""
          placeholder="Search"
          aria-label="Search boards"
          role="combobox"
          aria-expanded={open}
          aria-controls={open && rows.length > 0 && !boards.loading ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && activeIndex >= 0 ? optId(activeIndex) : undefined}
          autoComplete="off"
          enterKeyHint="search"
          autoFocus={overlay}
          size={overlay ? "md" : "sm"}
          onBoard={tone === "glass"}
          expandOnFocus={!overlay}
          value={query}
          onValueChange={(v) => {
            setQuery(v);
            setActive(-1);
            onSearch?.(v);
            if (v) setOpen(true);
          }}
          onClear={() => inputRef.current?.focus()}
          onFocus={() => {
            setOpen(true);
            boardsResource.ensure(5000);
          }}
          onBlur={(e) => {
            if (!anchor?.contains(e.relatedTarget as Node | null)) setOpen(false);
          }}
          onKeyDown={onKeyDown}
        />
        {!overlay && !query ? (
          <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 lg:block group-focus-within/gs:!hidden" aria-hidden>
            <Kbd className={tone === "glass" ? "!bg-white/25 !text-white" : undefined}>/</Kbd>
          </span>
        ) : null}
      </div>

      <Popover
        open={open}
        onOpenChange={(o) => !o && setOpen(false)}
        anchor={anchor}
        ariaLabel="Board search results"
        width={overlay ? "calc(100vw - 16px)" : 400}
        placement={overlay ? "bottom-start" : "bottom-end"}
        padded={false}
        initialFocus="none"
        restoreFocus={false}
        mobileSheet={false}
      >
        <div className="py-1">
          <h3 className="px-3 pb-1 pt-2 text-h-xxs font-semibold text-ink-soft">{q ? "Boards" : "Recent boards"}</h3>
          {boards.loading ? (
            <div className="space-y-1 px-3 py-1" role="status" aria-label="Loading boards">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 py-1">
                  <Skeleton width={40} height={32} className="!rounded-control" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton height={12} width="60%" />
                    <Skeleton height={10} width="35%" />
                  </div>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-3 pb-4 pt-2 text-center" role="status">
              <div className="text-body font-semibold text-ink">{q ? `No boards match “${q}”` : "No boards yet"}</div>
              <div className="mt-0.5 text-body text-ink-soft">{q ? "Try a different keyword, or search by tag." : "Create a board and it will show up here."}</div>
            </div>
          ) : (
            <ul id={listId} role="listbox" aria-label={q ? "Matching boards" : "Recent boards"} onMouseDown={(e) => e.preventDefault()}>
              {rows.map((p, i) => (
                <li key={p._id} role="presentation">
                  <Link
                    id={optId(i)}
                    href={boardHref(p._id)}
                    role="option"
                    aria-selected={i === activeIndex}
                    data-selected={i === activeIndex ? "true" : undefined}
                    tabIndex={-1}
                    onMouseMove={() => i !== activeIndex && setActive(i)}
                    onClick={() => {
                      recordBoardVisit(p._id);
                      setOpen(false);
                      setQuery("");
                      onSearch?.("");
                      onDone?.();
                    }}
                    className="menu-item !gap-3 !py-1.5"
                  >
                    <BoardThumb color={p.color} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        <Highlight text={p.name} q={q} />
                      </span>
                      <span className="block truncate text-body-sm text-ink-muted">
                        {p.status === "archived" ? "Archived · " : ""}
                        {subline(p, q)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Popover>
    </>
  );
}
