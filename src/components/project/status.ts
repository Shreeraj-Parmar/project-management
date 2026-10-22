import type { LozengeAppearance } from "@/components/ui";
import type { ProjectDetail } from "@/lib/types";

export type BoardStatus = ProjectDetail["status"];

/** Board statuses. `appearance` maps to the Lozenge colours; the description is shown in the picker. */
export const STATUSES: { id: BoardStatus; label: string; description: string; appearance: LozengeAppearance }[] = [
  { id: "active", label: "Active", description: "Work is in progress.", appearance: "success" },
  { id: "paused", label: "Paused", description: "On hold for now.", appearance: "moved" },
  { id: "completed", label: "Completed", description: "Finished and shipped.", appearance: "inprogress" },
  { id: "archived", label: "Archived", description: "Hidden from your boards list.", appearance: "default" },
];

export function statusMeta(status: BoardStatus) {
  return STATUSES.find((s) => s.id === status) ?? STATUSES[0];
}
