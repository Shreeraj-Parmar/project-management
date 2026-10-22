/** Tooltip content with a keyboard shortcut: "Show menu  ]". */
export function TooltipHint({ label, shortcut }: { label: string; shortcut: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      <kbd className="rounded-[2px] bg-white/25 px-1 font-sans text-micro">{shortcut}</kbd>
    </span>
  );
}
