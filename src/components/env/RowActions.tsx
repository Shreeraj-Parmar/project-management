"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, CopyPlus, Eye, EyeOff, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { IconButton, Menu, MenuDivider, MenuItem, MenuLabel } from "@/components/ui";
import type { EnvVar } from "@/lib/types";
import type { EnvController } from "./types";
import { envLabel } from "./utils";

/** Copy button that flips to a check mark for a moment once the copy worked. */
export function CopyButton({
  title,
  onCopy,
  disabled,
  size = "md",
  className,
}: {
  title: string;
  onCopy: () => Promise<boolean>;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  return (
    <IconButton
      title={title}
      size={size}
      disabled={disabled}
      className={className}
      onClick={async () => {
        if (!(await onCopy())) return;
        setDone(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check size={16} className="text-success" /> : <Copy size={16} />}
    </IconButton>
  );
}

/** Reveal / copy value / more menu for one variable. Same controls in the table and in the mobile card. */
export function RowActions({ v, ctl, withMenu = true }: { v: EnvVar; ctl: EnvController; withMenu?: boolean }) {
  const shown = ctl.revealed[v._id];
  const busy = ctl.revealing.has(v._id);
  const canReveal = v.secret && v.hasValue;
  return (
    <div className="flex items-center justify-end gap-0.5">
      {canReveal ? (
        <IconButton
          title={shown !== undefined ? `Hide value of ${v.key}` : `Reveal value of ${v.key}`}
          aria-busy={busy || undefined}
          onClick={() => ctl.toggleReveal(v)}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : shown !== undefined ? <EyeOff size={16} /> : <Eye size={16} />}
        </IconButton>
      ) : (
        <span className="h-8 w-8 shrink-0" aria-hidden />
      )}
      <CopyButton title={`Copy value of ${v.key}`} disabled={!v.hasValue} onCopy={() => ctl.copyValue(v)} />
      {withMenu ? <RowMenu v={v} ctl={ctl} /> : null}
    </div>
  );
}

export function RowMenu({ v, ctl }: { v: EnvVar; ctl: EnvController }) {
  return (
    <Menu
      width="w-56"
      ariaLabel={`Actions for ${v.key}`}
      trigger={
        <IconButton title={`More actions for ${v.key}`}>
          <MoreHorizontal size={16} />
        </IconButton>
      }
    >
      <MenuItem icon={<Pencil size={16} />} onClick={() => ctl.edit(v)}>
        Edit
      </MenuItem>
      <MenuItem icon={<Copy size={16} />} onClick={() => void ctl.copyKey(v)}>
        Copy key
      </MenuItem>
      {ctl.otherEnvironments.length > 0 ? (
        <>
          <MenuDivider />
          <MenuLabel>Duplicate to</MenuLabel>
          {ctl.otherEnvironments.map((e) => (
            <MenuItem key={e} icon={<CopyPlus size={16} />} onClick={() => ctl.duplicate(v, e)}>
              {envLabel(e)}
            </MenuItem>
          ))}
        </>
      ) : null}
      <MenuDivider />
      <MenuItem danger icon={<Trash2 size={16} />} onClick={() => ctl.remove(v)}>
        Delete
      </MenuItem>
    </Menu>
  );
}
