"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/client";
import { Tooltip } from "@/components/ui";

/** Single-line ellipsis text. The full text appears in a tooltip only when it is actually cut off. */
export function Truncate({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setCut(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);

  return (
    <Tooltip content={text} disabled={!cut}>
      <span ref={ref} className={cn("block min-w-0 truncate", className)}>
        {text}
      </span>
    </Tooltip>
  );
}
