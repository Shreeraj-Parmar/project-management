"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, LogOut, Plus, Search, Home } from "lucide-react";
import { api, cn } from "@/lib/client";
import { CreateBoardModal } from "./CreateBoardModal";

export function TopNav({ transparent = false, onSearch }: { transparent?: boolean; onSearch?: (q: string) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await api.post("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  return (
    <header
      className={cn("sticky top-0 z-30 flex h-12 items-center gap-2 px-3 text-white", transparent ? "bg-[#0000003d] backdrop-blur-sm" : "")}
      style={transparent ? undefined : { background: "linear-gradient(90deg,#0747a6,#0c66e4)" }}
    >
      <Link href="/boards" className="flex items-center gap-2 rounded px-2 py-1 font-bold tracking-tight hover:bg-white/15">
        <svg viewBox="0 0 64 64" className="h-5 w-5">
          <rect x="10" y="10" width="19" height="44" rx="4" fill="#fff" />
          <rect x="35" y="10" width="19" height="28" rx="4" fill="#fff" />
        </svg>
        <span className="text-[17px]">DevBoard</span>
      </Link>
      <nav className="ml-2 hidden items-center gap-1 sm:flex">
        <Link href="/boards" className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium hover:bg-white/15">
          <Home size={15} /> Home
        </Link>
        <Link href="/boards#boards" className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium hover:bg-white/15">
          <LayoutGrid size={15} /> Boards
        </Link>
      </nav>
      <button
        onClick={() => setOpen(true)}
        className="ml-1 flex h-8 items-center gap-1 rounded bg-white/20 px-3 text-sm font-semibold hover:bg-white/30"
      >
        <Plus size={16} /> <span className="hidden sm:inline">Create</span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {onSearch ? (
          <div className="relative hidden md:block">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-white/80" />
            <input
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search boards"
              className="h-8 w-56 rounded border border-white/40 bg-white/15 pl-8 pr-2 text-sm text-white placeholder-white/70 outline-none focus:border-white focus:bg-white/25"
            />
          </div>
        ) : null}
        <button onClick={logout} title="Lock workspace" className="flex h-8 items-center gap-1.5 rounded px-2.5 text-sm font-medium hover:bg-white/15">
          <LogOut size={15} /> <span className="hidden sm:inline">Lock</span>
        </button>
      </div>
      <CreateBoardModal open={open} onClose={() => setOpen(false)} />
    </header>
  );
}
