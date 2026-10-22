"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { api } from "@/lib/client";
import { Avatar, IconButton, Menu, MenuDivider, MenuItem, useToast } from "@/components/ui";
import type { Tone } from "./HeaderMenus";

/** Account avatar ("D") with the workspace name and "Lock workspace" (POST /api/auth/logout, then back to /login). */
export function AccountMenu({ tone }: { tone: Tone }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function lock() {
    if (busy) return;
    setBusy(true);
    try {
      await api.post("/api/auth/logout");
      router.replace("/login");
      router.refresh();
    } catch (err) {
      setBusy(false);
      toast(err instanceof Error ? err.message : "Couldn't lock the workspace. Try again.", "error");
    }
  }

  return (
    <Menu
      align="right"
      width="w-72"
      ariaLabel="Account"
      trigger={
        <IconButton title="Account" variant={tone === "glass" ? "transparent" : "subtle"}>
          <Avatar name="D" size={28} color="#0c66e4" className={tone === "glass" ? "pointer-events-none ring-1 ring-white/70" : "pointer-events-none"} />
        </IconButton>
      }
    >
      <div role="presentation" className="flex items-center gap-3 px-3 pb-2 pt-2">
        <Avatar name="D" size={40} color="#0c66e4" className="pointer-events-none" />
        <div className="min-w-0">
          <div className="truncate text-body font-semibold text-ink">DevBoard workspace</div>
          <div className="truncate text-body-sm text-ink-muted">Private, single user</div>
        </div>
      </div>
      <MenuDivider />
      <MenuItem icon={<Lock size={16} aria-hidden />} onClick={lock} description="Sign out and ask for the password again">
        Lock workspace
      </MenuItem>
    </Menu>
  );
}
