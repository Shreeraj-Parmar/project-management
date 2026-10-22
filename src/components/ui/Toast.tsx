"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/client";

export type ToastKind = "success" | "error" | "info" | "warning";
export type ToastOptions = {
  /** Link-style action on the flag, e.g. { label: "Undo", onClick }. Actions default to the dark snackbar look and an 8s lifetime. */
  action?: { label: string; onClick: () => void };
  /** ms before auto-dismiss. 0 = stay until dismissed. Default 5000 (8000 with an action, 10000 for errors). */
  duration?: number;
  /** Bold first line above the message. */
  title?: string;
  /** Force the dark snackbar appearance on / off. */
  bold?: boolean;
};
type ToastItem = { id: number; kind: ToastKind; message: string; opts: ToastOptions };

type Ctx = { toast: (message: string, kind?: ToastKind, opts?: ToastOptions) => number; dismiss: (id: number) => void };
const ToastCtx = createContext<Ctx>({ toast: () => 0, dismiss: () => {} });

/** `const { toast } = useToast(); toast("Card archived.", "success", { action: { label: "Undo", onClick } })` */
export function useToast() {
  return useContext(ToastCtx);
}

const ICON: Record<ToastKind, { Icon: typeof Info; color: string }> = {
  success: { Icon: CircleCheck, color: "#22a06b" },
  error: { Icon: CircleAlert, color: "#c9372c" },
  warning: { Icon: TriangleAlert, color: "#e56910" },
  info: { Icon: Info, color: "#1d7afc" },
};
const MAX_VISIBLE = 3;

function Flag({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { kind, message, opts } = item;
  const bold = opts.bold ?? !!opts.action;
  const duration = opts.duration ?? (opts.action ? 8000 : kind === "error" ? 10000 : 5000);
  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const start = useCallback(() => {
    if (duration <= 0 || timer.current) return;
    startedAt.current = Date.now();
    timer.current = setTimeout(() => dismissRef.current(), remaining.current);
  }, [duration]);
  const pause = useCallback(() => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    remaining.current = Math.max(1000, remaining.current - (Date.now() - startedAt.current));
  }, []);
  useEffect(() => {
    start();
    return () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [start]);

  const { Icon, color } = ICON[kind];
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      onMouseEnter={pause}
      onMouseLeave={start}
      onFocus={pause}
      onBlur={start}
      className={cn(
        "anim-toast pointer-events-auto flex w-full items-start gap-3 rounded-card p-4 shadow-overlay sm:w-[400px]",
        bold ? "bg-ink text-white" : "bg-canvas text-ink"
      )}
    >
      <Icon size={20} className="mt-0.5 shrink-0" style={{ color: bold && kind === "info" ? "#85b8ff" : color }} aria-hidden />
      <div className="min-w-0 flex-1 text-body">
        {opts.title ? <div className="font-semibold">{opts.title}</div> : null}
        <div className={cn("break-words", opts.title && !bold && "text-ink-soft")}>{message}</div>
        {opts.action ? (
          <button
            type="button"
            onClick={() => {
              opts.action?.onClick();
              onDismiss();
            }}
            className={cn("mt-2 rounded-sm text-body font-semibold underline-offset-2 hover:underline", bold ? "text-[#85b8ff]" : "text-link")}
          >
            {opts.action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className={cn("-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-control", bold ? "text-white hover:bg-white/20" : "text-ink-soft hover:bg-fill")}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const itemsRef = useRef<ToastItem[]>([]);
  itemsRef.current = items;

  const dismiss = useCallback((id: number) => setItems((p) => p.filter((t) => t.id !== id)), []);
  const toast = useCallback((message: string, kind: ToastKind = "info", opts: ToastOptions = {}) => {
    const id = ++seq.current;
    setItems((prev) => [...prev, { id, kind, message, opts }].slice(-MAX_VISIBLE));
    return id;
  }, []);

  // Ctrl/Cmd+Z triggers Undo of the newest toast that carries an action
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z" || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const last = [...itemsRef.current].reverse().find((i) => i.opts.action?.label === "Undo");
      if (!last) return;
      e.preventDefault();
      last.opts.action?.onClick();
      dismiss(last.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:items-start"
        style={{ zIndex: 600, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((t) => (
          <Flag key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
