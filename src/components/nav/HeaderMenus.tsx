"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button, Popover } from "@/components/ui";
import { RecentPanel, StarredPanel, TemplatesPanel, WorkspacesPanel } from "./Panels";
import { boardsResource } from "./store";

export type Tone = "light" | "glass";

/** Open-state look for a header trigger (Trello: blue-tinted on white, brighter glass on a board). */
export const triggerOpenClass = (tone: Tone) => (tone === "glass" ? "aria-expanded:bg-white/25" : "aria-expanded:bg-brand-soft aria-expanded:text-brand");

function NavDropdown({ label, tone, triggerClassName, children }: { label: string; tone: Tone; triggerClassName?: string; children: (close: () => void) => React.ReactNode }) {
  return (
    <Popover
      trigger={
        <Button variant={tone === "glass" ? "transparent" : "subtle"} iconRight={<ChevronDown size={16} aria-hidden />} className={triggerOpenClass(tone)}>
          {label}
        </Button>
      }
      triggerClassName={triggerClassName}
      ariaLabel={label}
      width={304}
      padded={false}
      mobileSheet={false}
      onOpenChange={(o) => o && boardsResource.ensure(5000)}
    >
      {(api) => children(api.close)}
    </Popover>
  );
}

type PanelId = "root" | "workspaces" | "recent" | "starred" | "templates";
const PANELS: { id: Exclude<PanelId, "root">; label: string }[] = [
  { id: "workspaces", label: "Workspaces" },
  { id: "recent", label: "Recent" },
  { id: "starred", label: "Starred" },
  { id: "templates", label: "Templates" },
];

/** Narrow widths: the four dropdowns collapse into one "More" popover that drills down with a back arrow. */
function MoreMenu({ tone, onPickTemplate }: { tone: Tone; onPickTemplate: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<PanelId>("root");
  const bodyRef = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    setPanel("root");
  };

  // Keep keyboard focus inside the popover after the clicked row unmounts.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (open) requestAnimationFrame(() => bodyRef.current?.querySelector<HTMLElement>("[data-nav-item]")?.focus());
  }, [panel, open]);

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) boardsResource.ensure(5000);
        else setPanel("root");
      }}
      trigger={
        <Button variant={tone === "glass" ? "transparent" : "subtle"} iconRight={<ChevronDown size={16} aria-hidden />} className={triggerOpenClass(tone)}>
          More
        </Button>
      }
      triggerClassName="max-sm:hidden! lg:hidden!"
      title={panel === "root" ? "More" : PANELS.find((p) => p.id === panel)?.label}
      onBack={panel === "root" ? undefined : () => setPanel("root")}
      width={304}
      padded={false}
      mobileSheet={false}
    >
      <div ref={bodyRef}>
        {panel === "root" ? (
          <div className="py-1">
            {PANELS.map((p) => (
              <button key={p.id} type="button" data-nav-item onClick={() => setPanel(p.id)} className="menu-item">
                <span className="flex-1">{p.label}</span>
                <ChevronRight size={16} aria-hidden />
              </button>
            ))}
          </div>
        ) : panel === "workspaces" ? (
          <WorkspacesPanel onNavigate={close} />
        ) : panel === "recent" ? (
          <RecentPanel onNavigate={close} />
        ) : panel === "starred" ? (
          <StarredPanel onNavigate={close} />
        ) : (
          <TemplatesPanel
            onPick={(id) => {
              close();
              onPickTemplate(id);
            }}
          />
        )}
      </div>
    </Popover>
  );
}

/** Workspaces, Recent, Starred, Templates (desktop) or one "More" (tablet). Hidden on phones. */
export function HeaderNav({ tone, onPickTemplate }: { tone: Tone; onPickTemplate: (templateId: string) => void }) {
  return (
    <nav aria-label="Global" className="flex items-center gap-1">
      <div className="hidden items-center gap-1 lg:flex">
        <NavDropdown label="Workspaces" tone={tone}>
          {(close) => <WorkspacesPanel onNavigate={close} />}
        </NavDropdown>
        <NavDropdown label="Recent" tone={tone}>
          {(close) => <RecentPanel onNavigate={close} />}
        </NavDropdown>
        <NavDropdown label="Starred" tone={tone}>
          {(close) => <StarredPanel onNavigate={close} />}
        </NavDropdown>
        <NavDropdown label="Templates" tone={tone}>
          {(close) => (
            <TemplatesPanel
              onPick={(id) => {
                close();
                onPickTemplate(id);
              }}
            />
          )}
        </NavDropdown>
      </div>
      <MoreMenu tone={tone} onPickTemplate={onPickTemplate} />
    </nav>
  );
}
