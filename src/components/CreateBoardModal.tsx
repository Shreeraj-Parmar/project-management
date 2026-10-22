"use client";

import type { RefObject } from "react";
import type { Project } from "@/lib/types";
import { Modal, Popover, type PopoverPlacement } from "@/components/ui";
import { CreateBoardForm } from "./home/create/CreateBoardForm";

export type CreateBoardModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (p: Project) => void;
  /** Anchor the 304px popover to this element (header Create button, the "Create new board" tile). Without an anchor it is a centred dialog. */
  anchor?: HTMLElement | null;
  anchorRef?: RefObject<HTMLElement | null>;
  placement?: PopoverPlacement;
  /** Preselect a list template (Templates menu) or a background. */
  initialTemplate?: string;
  initialColor?: string;
};

/**
 * Trello's "Create board": a 304px popover anchored to what opened it (a bottom sheet on phones), or a small centred
 * dialog when there is nothing to anchor to. The form state is discarded every time it closes.
 */
export function CreateBoardModal({ open, onClose, onCreated, anchor, anchorRef, placement = "bottom-start", initialTemplate, initialColor }: CreateBoardModalProps) {
  const el = anchor ?? anchorRef?.current ?? null;
  const form = <CreateBoardForm onClose={onClose} onCreated={onCreated} initialTemplate={initialTemplate} initialColor={initialColor} />;

  if (el) {
    return (
      <Popover open={open} onOpenChange={(o) => !o && onClose()} anchor={el} title="Create board" width={304} placement={placement}>
        {form}
      </Popover>
    );
  }
  return (
    <Modal open={open} onClose={onClose} title="Create board" size="small">
      {form}
    </Modal>
  );
}
