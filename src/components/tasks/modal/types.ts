export type PopKind = "add" | "labels" | "dates" | "checklist" | "priority" | "move" | "deleteChecklist";
/** Which button opened the popover (the same kind can be opened from the quick row, the sidebar or the meta row). */
export type PopSource = "quick" | "side" | "meta" | "title" | "checklist";

export type PopApi = {
  open: (kind: PopKind, anchor: HTMLElement, source: PopSource) => void;
  isOpen: (kind: PopKind, source: PopSource) => boolean;
};

/** Spread onto the button that opens a popover: click handler plus aria-haspopup / aria-expanded. */
export function triggerProps(pop: PopApi, kind: PopKind, source: PopSource, menu = false) {
  return {
    onClick: (e: React.MouseEvent<HTMLElement>) => pop.open(kind, e.currentTarget, source),
    "aria-haspopup": menu ? ("menu" as const) : ("dialog" as const),
    "aria-expanded": pop.isOpen(kind, source),
  };
}
