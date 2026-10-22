"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/client";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  color?: string; // override accent for primary
};

const variants: Record<Variant, string> = {
  primary: "text-white hover:brightness-110 shadow-sm",
  secondary: "bg-[#091e420f] text-ink hover:bg-[#091e4224]",
  ghost: "bg-transparent text-ink hover:bg-[#091e420f]",
  subtle: "bg-white/20 text-white hover:bg-white/30",
  danger: "bg-danger text-white hover:bg-[#ae2e24]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-2.5 text-[13px] gap-1.5",
  md: "h-9 px-3 text-sm gap-2",
  lg: "h-11 px-4 text-[15px] gap-2",
};

export function Button({ variant = "primary", size = "md", loading, icon, color, className, children, disabled, style, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={variant === "primary" ? { background: color ?? "#0c66e4", ...style } : style}
      className={cn(
        "inline-flex items-center justify-center rounded-[4px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function IconButton({ className, children, title, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      title={title}
      aria-label={title}
      className={cn("inline-flex h-8 w-8 items-center justify-center rounded-[4px] text-ink-soft transition hover:bg-[#091e420f] hover:text-ink", className)}
    >
      {children}
    </button>
  );
}
