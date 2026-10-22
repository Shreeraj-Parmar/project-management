"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/client";
import { Tooltip } from "./Tooltip";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "subtle"
  | "transparent"
  | "link"
  | "danger"
  | "warning"
  | "ghost" // alias of subtle (old name)
  | "glass"; // translucent white fill + white text, for use on a board gradient / glass header
export type ButtonSize = "sm" | "md" | "lg";

/** sm = 24px (32px on touch), md = 32px, lg = 40px. */
export function buttonClass({
  variant = "primary",
  size = "md",
  fullWidth,
  iconOnly,
  align,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  align?: "start";
  className?: string;
} = {}) {
  const v = variant === "ghost" ? "subtle" : variant;
  return cn(
    "btn",
    `btn--${v}`,
    size === "sm" && "btn--sm",
    size === "lg" && "btn--lg",
    iconOnly && "btn--icon",
    fullWidth && "btn--full",
    align === "start" && "btn--start",
    className
  );
}

type Props = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner, keeps the width and blocks clicks. */
  loading?: boolean;
  /** Leading icon (16px lucide icon recommended). */
  icon?: React.ReactNode;
  /** Trailing icon, e.g. a chevron. */
  iconRight?: React.ReactNode;
  /** Accent colour override for the primary variant (module colours). */
  color?: string;
  fullWidth?: boolean;
  /** Left-align content (sidebar buttons in the card back). */
  alignStart?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  iconRight,
  color,
  fullWidth,
  alignStart,
  className,
  children,
  disabled,
  style,
  onClick,
  type,
  ...rest
}: Props) {
  const colored = variant === "primary" && !!color;
  const hasText = children !== undefined && children !== null && children !== false;
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      data-colored={colored ? "" : undefined}
      onClick={(e) => {
        if (loading) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
      style={colored ? ({ "--btn-color": color, ...style } as React.CSSProperties) : style}
      className={buttonClass({ variant, size, fullWidth, align: alignStart ? "start" : undefined, iconOnly: !hasText && !!(icon || iconRight), className })}
    >
      {loading ? (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <Loader2 size={16} className="animate-spin" />
        </span>
      ) : null}
      <span className={cn("inline-flex min-w-0 items-center justify-[inherit] gap-[inherit]", loading && "invisible")}>
        {icon}
        {hasText ? <span className={cn("min-w-0", variant !== "link" && "truncate")}>{children}</span> : null}
        {iconRight}
      </span>
    </button>
  );
}

type IconButtonProps = Omit<React.ComponentProps<"button">, "title"> & {
  /** Accessible name AND tooltip text. Required for an icon-only control. */
  title?: string;
  /** Alias of title. */
  label?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  /** Highlights the button as toggled on (filters, view switchers). Also sets aria-pressed. */
  active?: boolean;
  /** Set false to skip the tooltip (e.g. inside a menu). */
  tooltip?: boolean;
};

/** Square icon-only button. 32px by default, `size="sm"` 24px, `size="lg"` 40px. */
export function IconButton({ className, children, title, label, size = "md", variant = "subtle", active, tooltip = true, type = "button", ...rest }: IconButtonProps) {
  const name = label ?? title;
  const btn = (
    <button
      {...rest}
      type={type}
      aria-label={rest["aria-label"] ?? name}
      aria-pressed={active === undefined ? rest["aria-pressed"] : active}
      data-active={active ? "true" : undefined}
      className={buttonClass({ variant, size, iconOnly: true, className: cn("icon-btn", className) })}
    >
      {children}
    </button>
  );
  if (!name || !tooltip || rest.disabled) return btn;
  return <Tooltip content={name}>{btn}</Tooltip>;
}

/** Horizontal group with a 4px gap (button rows in composers, headers). */
export function ButtonGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-1", className)}>{children}</div>;
}
