"use client";

import { useEffect, useRef } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/client";

type Common = Omit<React.ComponentProps<"input">, "type" | "size" | "children" | "className"> & {
  label?: React.ReactNode;
  description?: React.ReactNode;
  invalid?: boolean;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
};

const RING = "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";

function LabelText({ label, description, disabled }: { label?: React.ReactNode; description?: React.ReactNode; disabled?: boolean }) {
  if (!label && !description) return null;
  return (
    <span className={cn("min-w-0 text-body", disabled ? "text-ink-disabled" : "text-ink")}>
      {label}
      {description ? <span className="block text-body-sm text-ink-muted">{description}</span> : null}
    </span>
  );
}

/**
 * Trello / ADS checkbox: 16px, 3px radius, 2px #8590A2 ring, blue fill when checked.
 * `shape="round"` is the circular "mark complete" box used on cards and checklist items.
 * Native <input type=checkbox> underneath (keyboard, forms, labels all work).
 */
export function Checkbox({
  label,
  description,
  indeterminate,
  shape = "square",
  invalid,
  className,
  inputRef,
  onCheckedChange,
  ...rest
}: Common & { indeterminate?: boolean; shape?: "square" | "round"; onCheckedChange?: (checked: boolean) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate, rest.checked]);
  const round = shape === "round";
  return (
    <label className={cn("flex w-fit max-w-full items-start gap-2", rest.disabled ? "cursor-not-allowed" : "cursor-pointer", className)}>
      <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0">
        <input
          {...rest}
          type="checkbox"
          ref={(el) => {
            ref.current = el;
            if (typeof inputRef === "function") inputRef(el);
            else if (inputRef) (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          }}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            rest.onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          className="peer absolute inset-0 m-0 h-full w-full cursor-[inherit] opacity-0"
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none flex h-4 w-4 items-center justify-center bg-white text-white shadow-[inset_0_0_0_2px_#8590a2] transition-colors",
            round ? "rounded-full" : "rounded-control",
            "peer-hover:bg-surface peer-checked:bg-brand peer-checked:shadow-none peer-checked:peer-hover:bg-brand-dark peer-indeterminate:bg-brand peer-indeterminate:shadow-none",
            "peer-disabled:bg-fill-subtle peer-disabled:text-ink-disabled peer-disabled:shadow-[inset_0_0_0_2px_#091e420f] peer-checked:peer-disabled:bg-fill-subtle",
            invalid && "shadow-[inset_0_0_0_2px_#e2483d]",
            "peer-checked:[&>.ck]:opacity-100 peer-indeterminate:[&>.dash]:opacity-100",
            RING
          )}
        >
          <Check size={12} strokeWidth={3.5} className="ck opacity-0" />
          <Minus size={12} strokeWidth={3.5} className="dash absolute opacity-0" />
        </span>
      </span>
      <LabelText label={label} description={description} disabled={rest.disabled} />
    </label>
  );
}

/** ADS toggle switch (role="switch"): 40x24 track, green when on. */
export function Toggle({ label, description, invalid, className, inputRef, onCheckedChange, ...rest }: Common & { onCheckedChange?: (checked: boolean) => void }) {
  return (
    <label className={cn("flex w-fit max-w-full items-start gap-2", rest.disabled ? "cursor-not-allowed" : "cursor-pointer", className)}>
      <span className="relative inline-flex h-6 w-10 shrink-0">
        <input
          {...rest}
          type="checkbox"
          role="switch"
          ref={inputRef}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            rest.onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          className="peer absolute inset-0 m-0 h-full w-full cursor-[inherit] opacity-0"
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full bg-ink-muted transition-colors",
            "peer-hover:bg-ink-soft peer-checked:bg-success peer-checked:peer-hover:bg-success-dark peer-disabled:bg-fill-subtle peer-checked:peer-disabled:bg-fill-subtle",
            "peer-checked:[&>span]:translate-x-4 peer-disabled:[&>span]:bg-ink-disabled",
            RING
          )}
        >
          <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-100" />
        </span>
      </span>
      <span className="pt-0.5">
        <LabelText label={label} description={description} disabled={rest.disabled} />
      </span>
    </label>
  );
}

/** ADS radio: 16px circle, blue with a white dot when selected. */
export function Radio({ label, description, invalid, className, inputRef, ...rest }: Common) {
  return (
    <label className={cn("flex w-fit max-w-full items-start gap-2", rest.disabled ? "cursor-not-allowed" : "cursor-pointer", className)}>
      <span className="relative mt-0.5 inline-flex h-4 w-4 shrink-0">
        <input {...rest} type="radio" ref={inputRef} aria-invalid={invalid || undefined} className="peer absolute inset-0 m-0 h-full w-full cursor-[inherit] opacity-0" />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_2px_#8590a2] transition-colors",
            "peer-hover:bg-surface peer-checked:bg-brand peer-checked:shadow-none peer-checked:peer-hover:bg-brand-dark",
            "peer-disabled:bg-fill-subtle peer-disabled:shadow-[inset_0_0_0_2px_#091e420f]",
            "peer-checked:[&>span]:opacity-100",
            RING
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white opacity-0" />
        </span>
      </span>
      <LabelText label={label} description={description} disabled={rest.disabled} />
    </label>
  );
}
