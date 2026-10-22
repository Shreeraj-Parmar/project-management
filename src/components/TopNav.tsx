"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/client";
import { Button, IconButton, Logo } from "@/components/ui";
import { CreateBoardModal } from "./CreateBoardModal";
import { recordBoardVisit } from "./home/recent";
import { AccountMenu } from "./nav/AccountMenu";
import { GlobalSearch } from "./nav/GlobalSearch";
import { HeaderNav, type Tone } from "./nav/HeaderMenus";
import { HelpPopover } from "./nav/HelpPopover";
import { NotificationsMenu } from "./nav/Notifications";
import { boardsResource, dashboardResource } from "./nav/store";

const isTyping = (t: EventTarget | null) => !!(t as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable=''], [contenteditable='true']");
const visible = (el: HTMLElement | null) => !!el && el.getClientRects().length > 0;

/**
 * Global header (48px). On the boards home it is a white bar with a hairline (Trello's current design); inside a board
 * `transparent` turns it into a translucent dark glass bar with white text.
 * Left: logo, Workspaces / Recent / Starred / Templates (More on tablets), blue Create. Right: live search, notifications,
 * help and the account menu. Phones: logo, Create (+), search icon, bell and avatar.
 */
export function TopNav({ transparent = false, onSearch }: { transparent?: boolean; onSearch?: (q: string) => void }) {
  const tone: Tone = transparent ? "glass" : "light";
  const pathname = usePathname();
  const createRef = useRef<HTMLButtonElement>(null);
  const createRefPhone = useRef<HTMLButtonElement>(null);
  const [createAnchor, setCreateAnchor] = useState<HTMLElement | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [template, setTemplate] = useState<string | undefined>();
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);

  // Opening a board (any /boards/<id>/... route) counts as a visit: feeds "Recent" here and on the home page.
  useEffect(() => {
    const m = /^\/boards\/([^/]+)/.exec(pathname ?? "");
    if (m) recordBoardVisit(decodeURIComponent(m[1]));
  }, [pathname]);

  // Warm the shared caches: the bell badge needs the dashboard, search and menus need the boards.
  useEffect(() => {
    boardsResource.ensure(15_000);
    dashboardResource.ensure(15_000);
  }, [pathname]);

  // Phone search closes when the viewport grows back to tablet width.
  useEffect(() => {
    if (!mobileSearch) return;
    const mq = window.matchMedia("(min-width: 640px)");
    const on = () => mq.matches && setMobileSearch(false);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [mobileSearch]);

  // "/" focuses search, "?" opens help (never while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "/") {
        const input = Array.from(document.querySelectorAll<HTMLInputElement>("input[data-global-search]")).find(visible);
        e.preventDefault();
        if (input) input.focus();
        else setMobileSearch(true);
      } else if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function openCreate(tpl?: string) {
    const el = [createRef.current, createRefPhone.current].find(visible) ?? null;
    setTemplate(tpl);
    setCreateAnchor(el);
    setCreateOpen(true);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-header)] flex h-12 shrink-0 items-center gap-1 px-3",
        transparent ? "glass-bar" : "border-b border-line bg-canvas text-ink"
      )}
    >
      {/* Phone: the search takes over the whole bar */}
      {mobileSearch ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:hidden">
          <GlobalSearch tone={tone} onSearch={onSearch} overlay onDone={() => setMobileSearch(false)} />
          <Button variant={transparent ? "transparent" : "subtle"} onClick={() => setMobileSearch(false)}>
            Cancel
          </Button>
        </div>
      ) : null}

      <div className={cn("flex min-w-0 flex-1 items-center gap-1", mobileSearch && "max-sm:hidden")}>
        <Link href="/boards" aria-label="DevBoard home" className={cn("mr-1 flex h-8 items-center rounded-control px-1.5", transparent ? "hover:bg-on-board-ghost-hover" : "hover:bg-fill")}>
          <span className="hidden sm:inline-flex">
            <Logo size={24} variant={transparent ? "white" : "color"} />
          </span>
          <span className="inline-flex sm:hidden">
            <Logo size={24} variant={transparent ? "white" : "color"} showWordmark={false} />
          </span>
        </Link>

        <HeaderNav tone={tone} onPickTemplate={(id) => openCreate(id)} />

        <Button ref={createRef} variant={transparent ? "glass" : "primary"} onClick={() => (createOpen ? setCreateOpen(false) : openCreate())} className="ml-1 hidden sm:inline-flex">
          Create
        </Button>
        <IconButton
          ref={createRefPhone}
          title="Create"
          variant={transparent ? "glass" : "primary"}
          onClick={() => (createOpen ? setCreateOpen(false) : openCreate())}
          className="ml-1 text-white sm:hidden"
        >
          <Plus size={16} aria-hidden />
        </IconButton>

        <div className="ml-auto flex items-center gap-1">
          <GlobalSearch tone={tone} onSearch={onSearch} />
          <IconButton title="Search" variant={transparent ? "transparent" : "subtle"} onClick={() => setMobileSearch(true)} className="sm:hidden">
            <Search size={16} aria-hidden />
          </IconButton>
          <NotificationsMenu tone={tone} />
          <HelpPopover tone={tone} open={helpOpen} onOpenChange={setHelpOpen} />
          <AccountMenu tone={tone} />
        </div>
      </div>

      <CreateBoardModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        anchor={createAnchor}
        initialTemplate={template}
        onCreated={() => void boardsResource.refetch(true)}
      />
    </header>
  );
}
