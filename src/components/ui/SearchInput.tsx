"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/client";

/**
 * Search field with leading icon and clear button. 32px by default (header / toolbars), `size="md"` 40px.
 * `onBoard` = translucent white field for the glass header that turns white on focus.
 * `expandOnFocus` grows the field (header search: 200px to 280px).
 */
export function SearchInput({
  value,
  defaultValue,
  onValueChange,
  onChange,
  onClear,
  size = "sm",
  onBoard,
  expandOnFocus,
  className,
  placeholder = "Search",
  ...rest
}: Omit<React.ComponentProps<"input">, "size" | "value" | "defaultValue"> & {
  value?: string;
  defaultValue?: string;
  /** Called with the string value on every change and on clear. */
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  size?: "sm" | "md";
  onBoard?: boolean;
  expandOnFocus?: boolean;
}) {
  const [inner, setInner] = useState(defaultValue ?? "");
  const controlled = value !== undefined;
  const v = controlled ? value : inner;
  const set = (next: string) => {
    if (!controlled) setInner(next);
    onValueChange?.(next);
  };
  return (
    <div className={cn("group relative w-full", expandOnFocus && "sm:w-[200px] sm:transition-[width] sm:duration-150 sm:focus-within:w-[280px]", className)}>
      <Search size={16} aria-hidden className={cn("pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2", onBoard ? "text-white group-focus-within:text-ink-soft" : "text-ink-soft")} />
      <input
        {...rest}
        type="search"
        value={v}
        placeholder={placeholder}
        aria-label={rest["aria-label"] ?? placeholder}
        onChange={(e) => {
          onChange?.(e);
          set(e.target.value);
        }}
        onKeyDown={(e) => {
          rest.onKeyDown?.(e);
          if (e.key === "Escape" && v) {
            e.preventDefault();
            e.stopPropagation();
            set("");
            onClear?.();
          }
        }}
        className={cn(
          "w-full rounded-control border pl-8 pr-8 text-body outline-none transition-colors",
          size === "sm" ? "h-8" : "h-10",
          onBoard
            ? "border-transparent bg-on-board text-white placeholder:text-white/85 hover:bg-on-board-hover focus:border-focus focus:bg-white focus:text-ink focus:shadow-[0_0_0_1px_var(--color-focus)] focus:placeholder:text-ink-muted"
            : "border-border-input bg-canvas text-ink hover:bg-surface focus:border-focus focus:bg-canvas focus:shadow-[0_0_0_1px_var(--color-focus)]"
        )}
      />
      {v ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            set("");
            onClear?.();
          }}
          className={cn("absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-control", onBoard ? "text-white hover:bg-white/20 group-focus-within:text-ink-soft group-focus-within:hover:bg-fill" : "text-ink-soft hover:bg-fill")}
        >
          <X size={14} />
        </button>
      ) : null}
    </div>
  );
}
