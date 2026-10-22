"use client";

import { createContext, useContext } from "react";
import type { ProjectDetail } from "@/lib/types";

export type ProjectCtx = {
  project: ProjectDetail;
  refetch: (silent?: boolean) => Promise<void>;
  setProject: (updater: (p: ProjectDetail) => ProjectDetail) => void;
};

export const ProjectContext = createContext<ProjectCtx | null>(null);

export function useProject(): ProjectCtx {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used inside a project layout");
  return ctx;
}
