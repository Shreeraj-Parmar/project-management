"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, X } from "lucide-react";
import { IconButton } from "@/components/ui";
import { isTopLayer, pushLayer } from "@/components/ui/layers";
import { AboutPanel } from "./menu/AboutPanel";
import { BackgroundPanel } from "./menu/BackgroundPanel";
import { PANEL_TITLES, type PanelId } from "./menu/panels";
import { RootPanel } from "./menu/RootPanel";
import { StatusPanel } from "./menu/StatusPanel";
import { TagsPanel } from "./menu/TagsPanel";

/**
 * Board menu drawer (Trello "Show menu"): 339px, slides in over the right side under the global header, full width on
 * phones. Root list plus sub-panels with a back arrow. Esc closes one layer at a time (a popover or dialog above it
 * closes first, and Esc inside an inline editor only cancels that editor). Focus moves to the heading on open and on
 * every panel change; the shell returns it to the "Show menu" button on close.
 */
export function BoardMenuDrawer({
  id,
  panel,
  onPanelChange,
  onClose,
  onDelete,
}: {
  id: string;
  panel: PanelId;
  onPanelChange: (panel: PanelId) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const asideRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = `${id}-title`;

  useEffect(() => {
    const layer = pushLayer({ el: () => asideRef.current, close: () => closeRef.current(), kind: "popover" });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented && isTopLayer(layer.id)) {
        e.preventDefault();
        closeRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      layer.remove();
    };
  }, []);

  useEffect(() => {
    const t = requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(t);
  }, [panel]);

  return (
    <aside
      id={id}
      ref={asideRef}
      role="dialog"
      aria-labelledby={titleId}
      className="anim-drawer fixed bottom-0 right-0 top-12 z-[var(--z-drawer)] flex w-full flex-col bg-canvas text-ink shadow-overlay md:w-[var(--w-drawer)]"
    >
      <div className="relative flex h-12 shrink-0 items-center justify-center px-12">
        {panel !== "root" ? (
          <IconButton title="Back to menu" tooltip={false} onClick={() => onPanelChange("root")} className="absolute left-2 top-2">
            <ChevronLeft size={16} aria-hidden />
          </IconButton>
        ) : null}
        <h2 id={titleId} ref={headingRef} tabIndex={-1} className="truncate text-h-xs font-semibold text-ink-soft outline-none">
          {PANEL_TITLES[panel]}
        </h2>
        <IconButton title="Close menu" tooltip={false} onClick={onClose} className="absolute right-2 top-2">
          <X size={16} aria-hidden />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-1">
        {panel === "root" ? <RootPanel onNavigate={onPanelChange} onDelete={onDelete} /> : null}
        {panel === "about" ? <AboutPanel /> : null}
        {panel === "background" ? <BackgroundPanel /> : null}
        {panel === "tags" ? <TagsPanel /> : null}
        {panel === "status" ? <StatusPanel /> : null}
      </div>
    </aside>
  );
}
