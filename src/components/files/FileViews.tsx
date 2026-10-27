"use client";

import { ChevronRight, Download, Eye, Folder, FolderInput, FolderOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn, formatBytes, formatDate } from "@/lib/client";
import type { FileItem } from "@/lib/types";
import { IconButton, Menu, MenuDivider, MenuItem } from "@/components/ui";
import { FileTile, kindOf, useFileUrl } from "./utils";
import type { DragItem, useFileDnd } from "./useFileDnd";

export type FolderEntry = { _id?: string; name: string; path: string; count: number };
export type FileActions = {
  open: (f: FileItem) => void; // preview for images, download otherwise
  preview: (f: FileItem) => void;
  download: (f: FileItem) => void;
  rename: (f: FileItem) => void;
  move: (f: FileItem) => void;
  remove: (f: FileItem) => void;
};
export type FolderActions = {
  open: (path: string) => void;
  rename: (d: FolderEntry) => void;
  move: (d: FolderEntry) => void;
  remove: (d: FolderEntry) => void;
};
export type Dnd = ReturnType<typeof useFileDnd>;
/** Transient animation state owned by the page. */
export type Motion = { leaving: ReadonlySet<string>; entering: ReadonlySet<string>; pulse: string | null };

export type ViewProps = {
  folders: FolderEntry[];
  files: FileItem[];
  actions: FileActions;
  folderActions: FolderActions;
  dnd: Dnd;
  motion: Motion;
};

export const folderKey = (path: string) => "d:" + path;
const fileDrag = (f: FileItem): DragItem => ({ kind: "file", id: f._id, name: f.name, folder: f.folder });
const folderDrag = (d: FolderEntry): DragItem => ({ kind: "folder", path: d.path, name: d.name });
const isSource = (dnd: Dnd, item: DragItem) =>
  dnd.dragging && (dnd.dragging.kind === "file" ? item.kind === "file" && item.id === dnd.dragging.id : item.kind === "folder" && item.path === dnd.dragging.path);

function RowMenu({ f, a }: { f: FileItem; a: FileActions }) {
  return (
    <Menu trigger={<IconButton size="sm" title={`Actions for ${f.name}`}><MoreHorizontal size={16} /></IconButton>} width="w-48">
      {kindOf(f) === "image" ? (
        <MenuItem icon={<Eye size={16} />} onClick={() => a.preview(f)}>
          Preview
        </MenuItem>
      ) : null}
      <MenuItem icon={<Download size={16} />} onClick={() => a.download(f)}>
        Download
      </MenuItem>
      <MenuItem icon={<Pencil size={16} />} onClick={() => a.rename(f)}>
        Rename
      </MenuItem>
      <MenuItem icon={<FolderInput size={16} />} onClick={() => a.move(f)}>
        Move to…
      </MenuItem>
      <MenuDivider />
      <MenuItem icon={<Trash2 size={16} />} danger onClick={() => a.remove(f)}>
        Delete
      </MenuItem>
    </Menu>
  );
}

function FolderMenu({ d, a }: { d: FolderEntry; a: FolderActions }) {
  return (
    <Menu trigger={<IconButton size="sm" title={`Actions for folder ${d.name}`}><MoreHorizontal size={16} /></IconButton>} width="w-48">
      <MenuItem icon={<FolderOpen size={16} />} onClick={() => a.open(d.path)}>
        Open
      </MenuItem>
      <MenuItem icon={<Pencil size={16} />} onClick={() => a.rename(d)}>
        Rename
      </MenuItem>
      <MenuItem icon={<FolderInput size={16} />} onClick={() => a.move(d)}>
        Move to…
      </MenuItem>
      <MenuDivider />
      <MenuItem icon={<Trash2 size={16} />} danger onClick={() => a.remove(d)}>
        Delete folder
      </MenuItem>
    </Menu>
  );
}

const itemsLabel = (n: number) => `${n} item${n === 1 ? "" : "s"}`;

function FolderIcon({ size = 18, open }: { size?: number; open?: boolean }) {
  const Icon = open ? FolderOpen : Folder;
  return (
    <span aria-hidden className={cn("folder-icon inline-flex shrink-0 items-center justify-center rounded-card bg-orange-100 text-orange-800", size > 18 ? "size-10" : "size-8")}>
      <Icon size={size} />
    </span>
  );
}

/** Classes shared by rows and tiles: drop highlight, drag source fade, leave / enter / pulse animations. */
function motionClass(key: string, dnd: Dnd, motion: Motion, item: DragItem, droppable: boolean) {
  const path = item.kind === "folder" ? item.path : null;
  return cn(
    droppable && "drop-target",
    droppable && dnd.over === path && "drop-target--over",
    isSource(dnd, item) && "drag-source",
    dnd.dragging && !isSource(dnd, item) && !droppable && "drag-dim",
    motion.leaving.has(key) && "file-leave",
    motion.entering.has(key) && "file-enter",
    motion.pulse === path && "drop-pulse",
  );
}

export function FileTable({ folders, files, actions, folderActions, dnd, motion }: ViewProps) {
  return (
    <div className="overflow-hidden rounded-card border border-line">
      <table className="w-full table-fixed text-body">
        <thead>
          <tr className="border-b border-line bg-surface text-left text-h-xxs font-semibold text-ink-soft">
            <th scope="col" className="px-4 py-2">Name</th>
            <th scope="col" className="hidden w-28 px-4 py-2 sm:table-cell">Size</th>
            <th scope="col" className="hidden w-36 px-4 py-2 md:table-cell">Uploaded</th>
            <th scope="col" className="w-20 px-2 py-2"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {folders.map((d) => {
            const item = folderDrag(d);
            return (
              <tr
                key={folderKey(d.path)}
                {...dnd.dragProps(item)}
                {...dnd.dropProps(d.path)}
                className={cn("group cursor-grab border-b border-line last:border-0 hover:bg-fill-subtle active:cursor-grabbing", motionClass(folderKey(d.path), dnd, motion, item, true))}
              >
                <td className="px-4 py-2">
                  <button type="button" onClick={() => folderActions.open(d.path)} className="flex w-full min-w-0 items-center gap-3 text-left">
                    <FolderIcon open={dnd.over === d.path} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{d.name}</span>
                      <span className="block text-body-sm text-ink-muted sm:hidden">{itemsLabel(d.count)}</span>
                    </span>
                  </button>
                </td>
                <td className="hidden px-4 py-2 text-ink-soft sm:table-cell">{itemsLabel(d.count)}</td>
                <td className="hidden px-4 py-2 text-ink-soft md:table-cell">
                  {dnd.dragging && dnd.canDrop(d.path) ? <span className="text-body-sm text-brand">Drop to move here</span> : null}
                </td>
                <td className="px-2 py-1 text-right">
                  <span className="inline-flex items-center gap-0.5">
                    <IconButton size="sm" title="Open folder" className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => folderActions.open(d.path)}>
                      <ChevronRight size={16} />
                    </IconButton>
                    <FolderMenu d={d} a={folderActions} />
                  </span>
                </td>
              </tr>
            );
          })}
          {files.map((f) => {
            const item = fileDrag(f);
            return (
              <tr
                key={f._id}
                {...dnd.dragProps(item)}
                className={cn("group cursor-grab border-b border-line last:border-0 hover:bg-fill-subtle active:cursor-grabbing", motionClass(f._id, dnd, motion, item, false))}
              >
                <td className="px-4 py-2">
                  <button type="button" onClick={() => actions.open(f)} className="flex w-full min-w-0 items-center gap-3 text-left">
                    <FileTile file={f} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink group-hover:text-link">{f.name}</span>
                      <span className="block text-body-sm text-ink-muted sm:hidden">
                        {formatBytes(f.size)} · {formatDate(f.createdAt)}
                      </span>
                    </span>
                  </button>
                </td>
                <td className="hidden px-4 py-2 text-ink-soft sm:table-cell">{formatBytes(f.size)}</td>
                <td className="hidden px-4 py-2 text-ink-soft md:table-cell">{formatDate(f.createdAt)}</td>
                <td className="px-2 py-1 text-right">
                  <span className="inline-flex items-center gap-0.5">
                    <IconButton size="sm" title={`Download ${f.name}`} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" onClick={() => actions.download(f)}>
                      <Download size={16} />
                    </IconButton>
                    <RowMenu f={f} a={actions} />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Thumb({ f, base }: { f: FileItem; base: string }) {
  const isImg = kindOf(f) === "image";
  const { url, failed } = useFileUrl(base, f._id, isImg);
  if (isImg && url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" loading="lazy" draggable={false} className="size-full object-cover" />;
  }
  return isImg && !failed ? <div className="skeleton size-full" /> : <FileTile file={f} size={48} />;
}

export function FileGrid({ folders, files, base, actions, folderActions, dnd, motion }: ViewProps & { base: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {folders.map((d) => {
        const item = folderDrag(d);
        return (
          <div
            key={folderKey(d.path)}
            {...dnd.dragProps(item)}
            {...dnd.dropProps(d.path)}
            className={cn("t-card group relative flex cursor-grab items-center gap-3 p-3 pr-9 active:cursor-grabbing", motionClass(folderKey(d.path), dnd, motion, item, true))}
          >
            <button type="button" onClick={() => folderActions.open(d.path)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <FolderIcon size={20} open={dnd.over === d.path} />
              <span className="min-w-0">
                <span className="block truncate text-body font-medium text-ink">{d.name}</span>
                <span className="block text-body-sm text-ink-muted">{dnd.dragging && dnd.canDrop(d.path) ? "Drop to move here" : itemsLabel(d.count)}</span>
              </span>
            </button>
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
              <FolderMenu d={d} a={folderActions} />
            </div>
          </div>
        );
      })}
      {files.map((f) => {
        const item = fileDrag(f);
        return (
          <div
            key={f._id}
            {...dnd.dragProps(item)}
            className={cn("t-card group relative flex cursor-grab flex-col overflow-hidden active:cursor-grabbing", motionClass(f._id, dnd, motion, item, false))}
          >
            <button type="button" onClick={() => actions.open(f)} className="flex flex-col text-left" aria-label={f.name}>
              <span className="flex h-28 w-full items-center justify-center overflow-hidden bg-surface">
                <Thumb f={f} base={base} />
              </span>
              <span className="block px-3 pb-2 pt-2 pr-10">
                <span className="block truncate text-body font-medium text-ink">{f.name}</span>
                <span className="block text-body-sm text-ink-muted">
                  {formatBytes(f.size)} · {formatDate(f.createdAt)}
                </span>
              </span>
            </button>
            <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <IconButton size="sm" title={`Download ${f.name}`} className="bg-canvas/90 shadow-card" onClick={() => actions.download(f)}>
                <Download size={16} />
              </IconButton>
            </div>
            <div className="absolute bottom-1.5 right-1.5">
              <RowMenu f={f} a={actions} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Breadcrumb trail that also accepts drops (drag a file onto a parent to move it up). */
export function FolderCrumbs({ root, folder, onGo, dnd }: { root: string; folder: string; onGo: (path: string) => void; dnd: Dnd }) {
  const parts = folder ? folder.split("/") : [];
  const crumbs = [{ label: root, path: "" }, ...parts.map((p, i) => ({ label: p, path: parts.slice(0, i + 1).join("/") }))];
  return (
    <nav aria-label="Folder" className="min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-y-1 text-body">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          const droppable = !!dnd.dragging && dnd.canDrop(c.path);
          return (
            <li key={c.path || "root"} className="flex min-w-0 items-center">
              <button
                type="button"
                onClick={() => !last && onGo(c.path)}
                {...dnd.dropProps(c.path)}
                aria-current={last ? "page" : undefined}
                className={cn(
                  "drop-target inline-flex max-w-[28ch] items-center gap-1 truncate rounded-control px-1.5 py-0.5",
                  last ? "font-semibold text-ink" : "text-ink-soft hover:bg-fill hover:text-ink",
                  droppable && "ring-1 ring-inset ring-brand/40",
                  dnd.over === c.path && "drop-target--over text-brand",
                )}
              >
                {i === 0 ? <Folder size={14} aria-hidden className="shrink-0" /> : null}
                <span className="truncate">{c.label}</span>
              </button>
              {!last ? <ChevronRight size={14} aria-hidden className="mx-0.5 shrink-0 text-ink-muted" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
