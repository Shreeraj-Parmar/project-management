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
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  className?: string;
  id?: string;
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
      className={cn("t-input flex min-h-[38px] cursor-text flex-wrap items-center gap-1.5 py-1.5 focus-within:border-brand focus-within:shadow-[0_0_0_1px_var(--color-brand)]", className)}
      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus()}
    >
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded bg-[#091e420f] px-2 py-0.5 text-[12px] font-semibold text-ink-soft">
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((x) => x !== t));
            }}
            className="rounded text-ink-muted hover:bg-[#091e4224] hover:text-ink"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        id={id}
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
        className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm text-ink outline-none placeholder:text-[#8590a2]"
      />
    </div>
  );
}
