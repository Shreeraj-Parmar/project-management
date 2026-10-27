"use client";

import { SearchX, Upload } from "lucide-react";
import { MODULES } from "@/lib/constants";
import { Button, EmptyState, Skeleton } from "@/components/ui";

const MOD = MODULES.find((m) => m.id === "files")!;

export function FilesSkeleton({ grid }: { grid: boolean }) {
  if (grid) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading files">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} height={160} className="!block w-full !rounded-card" />
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-card border border-line" aria-busy="true" aria-label="Loading files">
      <div className="h-9 border-b border-line bg-surface" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-2 last:border-0">
          <Skeleton width={32} height={32} className="!block shrink-0" />
          <Skeleton height={14} width={`${40 + ((i * 13) % 30)}%`} />
        </div>
      ))}
    </div>
  );
}

/** Dashed dropzone shown when the folder is empty. */
export function FilesEmpty({ folder, configured, onChoose }: { folder: boolean; configured: boolean; onChoose: () => void }) {
  return (
    <div className="rounded-card border-2 border-dashed border-border-bold/50 bg-surface/60">
      <EmptyState
        icon={<Upload size={28} />}
        color={MOD.color}
        title={folder ? "This folder is empty" : "No files yet"}
        description={configured ? "Drag and drop files here, or choose them from your computer. They go straight to your S3 bucket." : "Connect an S3 bucket to start storing files."}
        action={
          configured ? (
            <Button icon={<Upload size={16} />} onClick={onChoose}>
              Upload files
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

export function FilesNoMatch({ query, onClear, elsewhere = 0 }: { query: string; onClear: () => void; elsewhere?: number }) {
  return (
    <div className="rounded-card border border-line">
      <EmptyState
        icon={<SearchX size={28} />}
        color={MOD.color}
        title={`No files match "${query}"`}
        description={elsewhere > 0 ? `${elsewhere} file${elsewhere === 1 ? "" : "s"} match in other folders. Search looks inside the open folder only.` : "Check the spelling or search in another folder."}
        action={
          <Button variant="secondary" onClick={onClear}>
            Clear search
          </Button>
        }
      />
    </div>
  );
}
