"use client";

import { CircleAlert, CircleCheck, Info, Lightbulb, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/client";

export type SectionAppearance = "info" | "warning" | "error" | "success" | "discovery" | "neutral";

const STYLE: Record<SectionAppearance, { bg: string; icon: string; Icon: typeof Info }> = {
  info: { bg: "bg-brand-soft", icon: "#1d7afc", Icon: Info },
  warning: { bg: "bg-warning-soft", icon: "#e56910", Icon: TriangleAlert },
  error: { bg: "bg-danger-soft", icon: "#c9372c", Icon: CircleAlert },
  success: { bg: "bg-success-soft", icon: "#22a06b", Icon: CircleCheck },
  discovery: { bg: "bg-discovery-soft", icon: "#8270db", Icon: Lightbulb },
  neutral: { bg: "bg-fill", icon: "#44546f", Icon: Info },
};

/**
 * ADS section message: tinted block, 24px icon, optional bold title and link actions.
 *
 *   <SectionMessage appearance="error" title="Could not save" actions={<Button variant="link" onClick={retry}>Try again</Button>}>Network error.</SectionMessage>
 */
export function SectionMessage({
  appearance = "info",
  title,
  children,
  actions,
  icon,
  onDismiss,
  className,
}: {
  appearance?: SectionAppearance;
  title?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const { bg, icon: color, Icon } = STYLE[appearance];
  return (
    <div role={appearance === "error" || appearance === "warning" ? "alert" : "status"} className={cn("flex gap-4 rounded-card p-4 text-body text-ink", bg, className)}>
      <span className="mt-0 flex h-6 w-6 shrink-0 items-center justify-center" style={{ color }} aria-hidden>
        {icon ?? <Icon size={20} />}
      </span>
      <div className="min-w-0 flex-1">
        {title ? <div className="font-semibold">{title}</div> : null}
        {children ? <div className={cn("break-words", !!title && "mt-1")}>{children}</div> : null}
        {actions ? <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">{actions}</div> : null}
      </div>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-soft hover:bg-fill">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
