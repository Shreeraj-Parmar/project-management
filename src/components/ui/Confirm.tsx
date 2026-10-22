"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Field";

/**
 * Small (400px) confirmation dialog. Name the object in the title ("Delete board Portfolio?"),
 * label the button with the verb ("Delete board"). For irreversible actions at scale pass
 * `confirmText` to require typing a name first.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  confirmText,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => unknown;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  /** Type-to-confirm: the confirm button stays disabled until the input matches (case-insensitive). */
  confirmText?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  const blocked = !!confirmText && typed.trim().toLowerCase() !== confirmText.trim().toLowerCase();

  async function run() {
    if (blocked) return;
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="small"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={variant} loading={busy} disabled={blocked} onClick={run}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-body text-ink-soft">{message ?? "This action cannot be undone."}</div>
      {confirmText ? (
        <div className="mt-4">
          <label htmlFor="confirm-typed" className="t-label">
            Type <span className="font-bold text-ink">{confirmText}</span> to confirm
          </label>
          <Input
            id="confirm-typed"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                run();
              }
            }}
            autoComplete="off"
            data-autofocus
          />
        </div>
      ) : null}
    </Modal>
  );
}
