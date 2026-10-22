"use client";

import { useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import type { ProjectDetail } from "@/lib/types";
import { useToast } from "@/components/ui";
import { boardsResource } from "@/components/nav/store";
import { useProject } from "./ProjectContext";
import type { BoardStatus } from "./status";

/** The fields PATCH /api/projects/:id accepts from the board shell (same names and shapes as the old edit dialog). */
export type BoardFields = Partial<Pick<ProjectDetail, "name" | "description" | "color" | "status" | "tags" | "starred" | "links">>;

/** All board PATCH requests of the shell are sent one after another, whichever component starts them. */
let requestChain: Promise<unknown> = Promise.resolve();

/**
 * Every board mutation of the shell in one place: optimistic update (context + the shared boards cache that feeds the
 * header's Starred / Recent menus), requests are sent one after another so quick edits cannot land out of order, and a
 * failure rolls the value back with an error toast. Reversible actions (archive, link removal) get an Undo toast.
 */
export function useBoardActions() {
  const { project, setProject } = useProject();
  const { toast } = useToast();
  const router = useRouter();
  const projectRef = useRef(project);
  projectRef.current = project;

  const apply = useCallback(
    (fields: BoardFields) => {
      setProject((p) => ({ ...p, ...fields }));
      const id = projectRef.current._id;
      boardsResource.setData((prev) => (prev ? prev.map((b) => (b._id === id ? { ...b, ...fields } : b)) : prev));
    },
    [setProject]
  );

  const patchRef = useRef<(fields: BoardFields, errorMessage: string) => Promise<boolean>>(async () => false);
  const patch = useCallback(
    async (fields: BoardFields, errorMessage: string): Promise<boolean> => {
      const id = projectRef.current._id;
      const before: Record<string, unknown> = {};
      for (const k of Object.keys(fields) as (keyof BoardFields)[]) before[k] = projectRef.current[k];
      apply(fields);
      const req = requestChain.then(() => api.patch(`/api/projects/${id}`, fields));
      requestChain = req.catch(() => undefined);
      try {
        await req;
        return true;
      } catch {
        apply(before as BoardFields);
        toast(errorMessage, "error", { action: { label: "Try again", onClick: () => void patchRef.current(fields, errorMessage) } });
        return false;
      }
    },
    [apply, toast]
  );
  patchRef.current = patch;

  const setStatus = useCallback(
    async (next: BoardStatus) => {
      const prev = projectRef.current.status;
      if (next === prev) return;
      const ok = await patch({ status: next }, "Couldn't change the status.");
      if (ok && (next === "archived" || prev === "archived")) {
        toast(next === "archived" ? "Board archived." : "Board restored.", "success", {
          action: { label: "Undo", onClick: () => void patch({ status: prev }, "Couldn't undo that.") },
        });
      }
    },
    [patch, toast]
  );

  return useMemo(
    () => ({
      /** Trello behaviour: empty names are rejected with a message, unchanged names are ignored. */
      rename: async (raw: string) => {
        const name = raw.trim();
        if (!name) {
          toast("Board name can't be empty.", "error");
          return false;
        }
        if (name === projectRef.current.name) return true;
        return patch({ name }, "Couldn't rename the board.");
      },
      toggleStar: () => patch({ starred: !projectRef.current.starred }, "Couldn't update the star."),
      setColor: (color: string) => (color === projectRef.current.color ? Promise.resolve(true) : patch({ color }, "Couldn't change the background.")),
      setStatus,
      archive: () => setStatus("archived"),
      unarchive: () => setStatus("active"),
      setDescription: (description: string) => patch({ description }, "Couldn't save the description."),
      setTags: (tags: string[]) => patch({ tags }, "Couldn't save the tags."),
      setLinks: (links: ProjectDetail["links"]) => patch({ links }, "Couldn't save the links."),
      /** Removes one quick link with an Undo toast. */
      removeLink: async (index: number) => {
        const before = projectRef.current.links;
        const link = before[index];
        if (!link) return;
        const ok = await patch({ links: before.filter((_, i) => i !== index) }, "Couldn't remove the link.");
        if (ok) toast(`Removed link "${link.label}".`, "success", { action: { label: "Undo", onClick: () => void patch({ links: before }, "Couldn't undo that.") } });
      },
      copyLink: async () => {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}/boards/${projectRef.current._id}`);
          toast("Board link copied.", "success");
        } catch {
          toast("Couldn't copy the link.", "error");
        }
      },
      remove: async () => {
        const id = projectRef.current._id;
        try {
          await api.del(`/api/projects/${id}`);
        } catch {
          toast("Couldn't delete the board. Try again.", "error");
          return;
        }
        boardsResource.setData((prev) => (prev ? prev.filter((b) => b._id !== id) : prev));
        toast("Board deleted.", "success");
        router.replace("/boards");
      },
    }),
    [patch, setStatus, toast, router]
  );
}
