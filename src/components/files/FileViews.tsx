"use client";

import { Download, Eye, Folder, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn, formatBytes, formatDate } from "@/lib/client";
import type { FileItem } from "@/lib/types";
import { IconButton, Menu, MenuDivider, MenuItem } from "@/components/ui";
import { FileTile, kindOf, useFileUrl } from "./utils";

export type FolderEntry = { name: string; path: string; count: number };
export type FileActions = {
  open: (f: FileItem) => void; // preview for images, download otherwise
  preview: (f: FileItem) => void;
  download: (f: FileItem) => void;
  rename: (f: FileItem) => void;
  remove: (f: FileItem) => void;
};

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
      <MenuDivider />
      <MenuItem icon={<Trash2 size={16} />} danger onClick={() => a.remove(f)}>
        Delete
      </MenuItem>
    </Menu>
  );
}

const itemsLabel = (n: number) => `${n} item${n === 1 ? "" : "s"}`;

export function FileTable({ folders, files, actions, onOpenFolder }: { folders: FolderEntry[]; files: FileItem[]; actions: FileActions; onOpenFolder: (path: string) => void }) {
  return (
    <div className="overflow-hidden rounded-card border border-line">
      <table className="w-full table-fixed text-body">
        <thead>
          <tr className="border-b border-line bg-surface text-left text-h-xxs font-semibold text-ink-soft">
            <th scope="col" className="px-4 py-2">Name</th>
            <th scope="col" className="hidden w-28 px-4 py-2 sm:table-cell">Size</th>
            <th scope="col" className="hidden w-36 px-4 py-2 md:table-cell">Uploaded</th>
            <th scope="col" className="w-12 px-2 py-2"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {folders.map((d) => (
            <tr key={"d:" + d.path} className="group border-b border-line last:border-0 hover:bg-fill-subtle">
              <td className="px-4 py-2">
                <button type="button" onClick={() => onOpenFolder(d.path)} className="flex w-full min-w-0 items-center gap-3 text-left">
                  <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-card bg-orange-100 text-orange-800">
                    <Folder size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{d.name}</span>
                    <span className="block text-body-sm text-ink-muted sm:hidden">{itemsLabel(d.count)}</span>
                  </span>
                </button>
              </td>
              <td className="hidden px-4 py-2 text-ink-soft sm:table-cell">{itemsLabel(d.count)}</td>
              <td className="hidden px-4 py-2 md:table-cell" />
              <td />
            </tr>
          ))}
          {files.map((f) => (
            <tr key={f._id} className="group border-b border-line last:border-0 hover:bg-fill-subtle">
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
                <RowMenu f={f} a={actions} />
              </td>
            </tr>
          ))}
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
    return <img src={url} alt="" loading="lazy" className="size-full object-cover" />;
  }
  return isImg && !failed ? <div className="skeleton size-full" /> : <FileTile file={f} size={48} />;
}

export function FileGrid({ folders, files, base, actions, onOpenFolder }: { folders: FolderEntry[]; files: FileItem[]; base: string; actions: FileActions; onOpenFolder: (path: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {folders.map((d) => (
        <button key={"d:" + d.path} type="button" onClick={() => onOpenFolder(d.path)} className="t-card flex items-center gap-3 p-3 text-left">
          <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-card bg-orange-100 text-orange-800">
            <Folder size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-body font-medium text-ink">{d.name}</span>
            <span className="block text-body-sm text-ink-muted">{itemsLabel(d.count)}</span>
          </span>
        </button>
      ))}
      {files.map((f) => (
        <div key={f._id} className="t-card group relative flex flex-col overflow-hidden">
          <button type="button" onClick={() => actions.open(f)} className="flex flex-col text-left" aria-label={f.name}>
            <span className={cn("flex h-28 w-full items-center justify-center overflow-hidden bg-surface")}>
              <Thumb f={f} base={base} />
            </span>
            <span className="block px-3 pb-2 pt-2 pr-10">
              <span className="block truncate text-body font-medium text-ink">{f.name}</span>
              <span className="block text-body-sm text-ink-muted">
                {formatBytes(f.size)} · {formatDate(f.createdAt)}
              </span>
            </span>
          </button>
          <div className="absolute bottom-1.5 right-1.5">
            <RowMenu f={f} a={actions} />
          </div>
        </div>
      ))}
    </div>
  );
}
