"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, LogOut, Plus, Search, Home } from "lucide-react";
import { api, cn } from "@/lib/client";
import { CreateBoardModal } from "./CreateBoardModal";

/**
 * Global header. On the home page it is a light bar (like Trello's current design);
 * inside a board it becomes a translucent dark overlay on top of the board background.
 */
export function TopNav({ transparent = false, onSearch }: { transparent?: boolean; onSearch?: (q: string) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function logout() {
    await api.post("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  const onHome = pathname === "/boards";
  const navItem = (active: boolean) =>
    cn(
      "flex h-8 items-center gap-1.5 rounded px-2.5 text-sm font-medium transition",
      transparent ? "text-white hover:bg-white/20" : active ? "bg-brand-soft text-brand-dark" : "text-ink-soft hover:bg-[#091e420f] hover:text-ink"
    );

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-12 items-center gap-1.5 px-3",
        transparent ? "bg-[#0000003d] text-white backdrop-blur-sm" : "border-b border-line bg-white text-ink"
      )}
    >
      <Link href="/boards" className={cn("flex items-center gap-2 rounded px-2 py-1 font-bold tracking-tight", transparent ? "hover:bg-white/20" : "hover:bg-[#091e420f]")}>
        <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden>
          <rect width="64" height="64" rx="12" fill={transparent ? "#fff" : "#0c66e4"} />
          <rect x="12" y="12" width="17" height="40" rx="3" fill={transparent ? "#0c66e4" : "#fff"} />
          <rect x="35" y="12" width="17" height="26" rx="3" fill={transparent ? "#0c66e4" : "#fff"} />
        </svg>
        <span className="text-[17px]">DevBoard</span>
      </Link>
      <nav className="ml-1 hidden items-center gap-0.5 sm:flex">
        <Link href="/boards" className={navItem(onHome)}>
          <Home size={15} /> Home
        </Link>
        <Link href="/boards#boards" className={navItem(false)}>
          <LayoutGrid size={15} /> Boards
        </Link>
      </nav>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "ml-1 flex h-8 items-center gap-1 rounded px-3 text-sm font-semibold transition",
          transparent ? "bg-white/20 text-white hover:bg-white/30" : "bg-brand text-white hover:bg-brand-dark"
        )}
      >
        <Plus size={16} /> <span className="hidden sm:inline">Create</span>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        {onSearch ? (
          <div className="relative hidden md:block">
            <Search size={14} className={cn("pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2", transparent ? "text-white/80" : "text-ink-muted")} />
            <input
              type="search"
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search boards"
              aria-label="Search boards"
              className={cn(
                "h-8 w-56 rounded border pl-8 pr-2 text-sm outline-none transition",
                transparent
                  ? "border-white/40 bg-white/15 text-white placeholder-white/70 focus:border-white focus:bg-white/25"
                  : "border-line bg-white text-ink placeholder:text-ink-muted focus:border-brand focus:shadow-[0_0_0_1px_var(--color-brand)]"
              )}
            />
          </div>
        ) : null}
        <button onClick={logout} title="Lock workspace" className={navItem(false)}>
          <LogOut size={15} /> <span className="hidden sm:inline">Lock</span>
        </button>
      </div>
      <CreateBoardModal open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
