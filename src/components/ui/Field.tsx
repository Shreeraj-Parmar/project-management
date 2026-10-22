"use client";

import { Children, cloneElement, isValidElement, useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/client";

export function Label({
  children,
  hint,
  required,
  htmlFor,
  className,
  ...rest
}: Omit<React.ComponentProps<"label">, "children"> & { children: React.ReactNode; hint?: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className={cn("t-label", className)} {...rest}>
      {children}
      {required ? (
        <span aria-hidden className="ml-0.5 text-danger-text">
          *
        </span>
      ) : null}
      {hint ? <span className="ml-1 font-normal text-ink-muted">{hint}</span> : null}
    </label>
  );
}

type InputExtras = {
  /** 40px (md, default) or 32px (sm, compact: popovers, composers, toolbars). */
  size?: "sm" | "md";
  invalid?: boolean;
};

export type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  InputExtras & {
    /** 16px icon rendered inside the left edge. */
    startIcon?: React.ReactNode;
    /** Node rendered inside the right edge (e.g. a show/hide IconButton). */
    endAdornment?: React.ReactNode;
  };

export function Input({ className, size = "md", invalid, startIcon, endAdornment, ...rest }: InputProps) {
  const el = (
    <input
      {...rest}
      aria-invalid={invalid || rest["aria-invalid"] || undefined}
      className={cn("t-input", size === "sm" && "t-input--sm", !!startIcon && "pl-8", !!endAdornment && "pr-10", className)}
    />
  );
  if (!startIcon && !endAdornment) return el;
  return (
    <div className="relative w-full">
      {startIcon ? <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft">{startIcon}</span> : null}
      {el}
      {endAdornment ? <span className="absolute right-1 top-1/2 -translate-y-1/2">{endAdornment}</span> : null}
    </div>
  );
}

export function Textarea({ className, invalid, ...rest }: React.ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea {...rest} aria-invalid={invalid || rest["aria-invalid"] || undefined} className={cn("t-input min-h-[88px]", className)} />;
}

export function Select({ className, children, size = "md", invalid, ...rest }: Omit<React.ComponentProps<"select">, "size"> & InputExtras) {
  return (
    <select {...rest} aria-invalid={invalid || rest["aria-invalid"] || undefined} className={cn("t-input", size === "sm" && "t-input--sm", className)}>
      {children}
    </select>
  );
}

export type FieldControlProps = { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string; required?: boolean };

/**
 * Label + control + helper / error text, wired with htmlFor / aria-describedby via useId.
 * The first element child receives id, aria-invalid and aria-describedby automatically
 * (works for Input, Select, Textarea, TagInput, plain inputs). Or pass a render function.
 *
 *   <Field label="Board title" required error={err}><Input value={v} onChange={...} /></Field>
 */
export function Field({
  label,
  hint,
  helper,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label: string;
  /** Inline muted suffix next to the label, e.g. "(optional)". */
  hint?: string;
  /** Helper text under the control. */
  helper?: React.ReactNode;
  /** Error text under the control (also marks the control invalid). */
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode | ((p: FieldControlProps) => React.ReactNode);
  className?: string;
  htmlFor?: string;
}) {
  const uid = useId();
  const id = htmlFor ?? `f${uid}`;
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const describedBy = [error ? errId : null, helpId && helper ? helpId : null].filter(Boolean).join(" ") || undefined;
  const controlProps: FieldControlProps = { id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy, required: required || undefined };

  let body: React.ReactNode;
  if (typeof children === "function") body = children(controlProps);
  else {
    let done = false;
    body = Children.map(children, (c) => {
      const isControl = isValidElement(c) && (typeof c.type !== "string" || ["input", "select", "textarea"].includes(c.type));
      if (!done && isControl) {
        done = true;
        const p = (c as React.ReactElement<Record<string, unknown>>).props;
        return cloneElement(c as React.ReactElement<Record<string, unknown>>, {
          id: p.id ?? id,
          "aria-invalid": p["aria-invalid"] ?? controlProps["aria-invalid"],
          "aria-describedby": p["aria-describedby"] ?? describedBy,
        });
      }
      return c;
    });
  }

  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint} required={required}>
        {label}
      </Label>
      {body}
      {error ? (
        <p id={errId} role="alert" className="mt-1 flex items-start gap-1 text-body-sm text-danger-text">
          <AlertCircle size={14} className="mt-px shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      ) : null}
      {helper ? (
        <p id={helpId} className="mt-1 text-body-sm text-ink-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
