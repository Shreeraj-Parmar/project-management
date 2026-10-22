"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/client";

export function Menu({ trigger, children, align = "right", width = "w-56" }: { trigger: React.ReactNode; children: React.ReactNode; align?: "left" | "right"; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open ? (
        <div
          className={cn("fade-in absolute z-40 mt-1 rounded-lg bg-white p-1.5 shadow-[var(--shadow-overlay)]", width, align === "right" ? "right-0" : "left-0")}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({ children, onClick, danger, icon }: { children: React.ReactNode; onClick?: () => void; danger?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn("flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm hover:bg-[#091e420f]", danger ? "text-danger" : "text-ink")}
    >
      {icon}
      {children}
    </button>
  );
}
