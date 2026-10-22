"use client";

import { cn } from "@/lib/client";
import { Popover, PopoverDivider, PopoverItem, type PopoverPlacement } from "./Popover";

/**
 * Dropdown action menu (role="menu"): arrow keys, Home/End, typeahead, Esc, outside click, focus return.
 *
 *   <Menu trigger={<IconButton title="List actions"><MoreHorizontal size={16} /></IconButton>}>
 *     <MenuItem icon={<Pencil size={16} />} onClick={rename}>Rename</MenuItem>
 *     <MenuDivider />
 *     <MenuItem danger icon={<Trash2 size={16} />} onClick={remove}>Delete</MenuItem>
 *   </Menu>
 */
export function Menu({
  trigger,
  children,
  align = "right",
  width = "w-56",
  title,
  placement,
  className,
  ariaLabel,
  open,
  onOpenChange,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  /** right = menu's right edge aligns with the trigger's right edge. */
  align?: "left" | "right";
  /** Tailwind width class (legacy, default w-56), a number of px, or "auto". */
  width?: string | number;
  /** Optional Trello-style header (centered title + close). */
  title?: React.ReactNode;
  placement?: PopoverPlacement;
  className?: string;
  ariaLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isClass = typeof width === "string" && /^[a-z-]*:?[a-z]*-/.test(width) && width !== "auto";
  return (
    <Popover
      role="menu"
      trigger={trigger}
      title={title}
      ariaLabel={ariaLabel ?? (typeof title === "string" ? title : "Menu")}
      open={open}
      onOpenChange={onOpenChange}
      placement={placement ?? (align === "right" ? "bottom-end" : "bottom-start")}
      width={isClass ? "auto" : width}
      className={cn(isClass && width, "min-w-[180px]", className)}
      padded={false}
      bodyClassName="py-1"
    >
      {children}
    </Popover>
  );
}

export const MenuItem = PopoverItem;
export const MenuDivider = PopoverDivider;
/** Group label inside a menu. */
export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div role="presentation" className="px-3 pb-1 pt-2 text-h-xxs font-semibold text-ink-soft">
      {children}
    </div>
  );
}
