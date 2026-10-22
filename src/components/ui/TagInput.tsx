"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/client";

/** Chip-style tag input: type and press Enter / comma to add, Backspace to remove the last one. */
export function TagInput({
  value,
  onChange,
  placeholder = "Add a tag…",
  max = 20,
  className,
  id,
  ...aria
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const parts = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft("");
  }

  return (
    <div
      className={cn("t-input t-input--wrap flex-wrap", className)}
      aria-invalid={aria["aria-invalid"] || undefined}
      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus()}
    >
      {value.map((t) => (
        <span key={t} className="inline-flex h-6 items-center gap-1 rounded-control bg-fill pl-2 pr-1 text-body-sm font-semibold text-ink-soft">
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((x) => x !== t));
            }}
            className="flex h-4 w-4 items-center justify-center rounded-sm text-ink-soft hover:bg-fill-hover hover:text-ink"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        id={id}
        aria-describedby={aria["aria-describedby"]}
        value={draft}
        onChange={(e) => {
          if (e.target.value.includes(",")) commit(e.target.value);
          else setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => commit(draft)}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-body text-ink outline-none"
      />
    </div>
  );
}
