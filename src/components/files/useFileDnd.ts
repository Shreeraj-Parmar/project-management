"use client";

import { useCallback, useRef, useState } from "react";

export type DragItem = { kind: "file"; id: string; name: string; folder: string } | { kind: "folder"; path: string; name: string };

const MIME = "application/x-devboard-file-item";

export const hasExternalFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
const isInternal = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes(MIME);

/**
 * Native HTML5 drag and drop between files, folders and breadcrumbs.
 * `onMove(item, targetPath)` moves an item we drag ourselves, `onUploadTo(files, targetPath)` handles files dragged in from the OS.
 */
export function useFileDnd({ onMove, onUploadTo }: { onMove: (item: DragItem, target: string) => void; onUploadTo: (files: FileList, target: string) => void }) {
  const [dragging, setDragging] = useState<DragItem | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const depth = useRef<Record<string, number>>({});

  /** A folder can't be dropped into itself or its own subtree; a file not into the folder it is already in. */
  const canDrop = useCallback(
    (target: string, item: DragItem | null = dragging) => {
      if (!item) return true; // external files
      if (item.kind === "file") return item.folder !== target;
      return target !== item.path && !target.startsWith(item.path + "/") && target !== (item.path.includes("/") ? item.path.slice(0, item.path.lastIndexOf("/")) : "");
    },
    [dragging],
  );

  const dragProps = useCallback(
    (item: DragItem) => ({
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.setData(MIME, JSON.stringify(item));
        e.dataTransfer.setData("text/plain", item.name);
        e.dataTransfer.effectAllowed = "move";
        // Let the browser paint the ghost before we fade the source.
        requestAnimationFrame(() => setDragging(item));
      },
      onDragEnd: () => {
        setDragging(null);
        setOver(null);
        depth.current = {};
      },
    }),
    [],
  );

  const dropProps = useCallback(
    (target: string) => ({
      onDragEnter: (e: React.DragEvent) => {
        const ext = hasExternalFiles(e);
        if (!ext && !isInternal(e)) return;
        if (!canDrop(target)) return;
        e.preventDefault();
        e.stopPropagation();
        depth.current[target] = (depth.current[target] ?? 0) + 1;
        setOver(target);
      },
      onDragOver: (e: React.DragEvent) => {
        const ext = hasExternalFiles(e);
        if (!ext && !isInternal(e)) return;
        if (!canDrop(target)) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = ext ? "copy" : "move";
      },
      onDragLeave: (e: React.DragEvent) => {
        if (!hasExternalFiles(e) && !isInternal(e)) return;
        depth.current[target] = Math.max(0, (depth.current[target] ?? 0) - 1);
        if (!depth.current[target]) setOver((o) => (o === target ? null : o));
      },
      onDrop: (e: React.DragEvent) => {
        depth.current[target] = 0;
        setOver(null);
        if (hasExternalFiles(e)) {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files.length) onUploadTo(e.dataTransfer.files, target);
          return;
        }
        const raw = e.dataTransfer.getData(MIME);
        if (!raw) return;
        e.preventDefault();
        e.stopPropagation();
        try {
          const item = JSON.parse(raw) as DragItem;
          if (canDrop(target, item)) onMove(item, target);
        } catch {
          /* ignore malformed payloads */
        }
        setDragging(null);
      },
    }),
    [canDrop, onMove, onUploadTo],
  );

  return { dragging, over, canDrop, dragProps, dropProps };
}
