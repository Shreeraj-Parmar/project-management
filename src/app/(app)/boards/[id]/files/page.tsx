"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Files, FolderPlus, LayoutGrid, List, Upload } from "lucide-react";
import { api, cn, formatBytes, useFetch } from "@/lib/client";
import { MODULES } from "@/lib/constants";
import type { FileItem, Folder } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { Button, ConfirmDialog, ErrorBox, Field, IconButton, Input, Modal, PageHeader, SearchInput, SectionMessage, useToast } from "@/components/ui";
import { FileGrid, FileTable, FolderCrumbs, folderKey, type FileActions, type FolderActions, type FolderEntry, type Motion } from "@/components/files/FileViews";
import { FilesEmpty, FilesNoMatch, FilesSkeleton } from "@/components/files/FileStates";
import { MoveModal, type MoveSubject } from "@/components/files/MoveModal";
import { UploadQueue, type UploadJob } from "@/components/files/UploadQueue";
import { hasExternalFiles, useFileDnd, type DragItem } from "@/components/files/useFileDnd";
import { useFileUrl, kindOf } from "@/components/files/utils";

const MOD = MODULES.find((m) => m.id === "files")!;
type Resp = { configured: boolean; files: FileItem[]; folders: Folder[] };
type View = "list" | "grid";
const VIEW_KEY = "devboard.files.view";
const LEAVE_MS = 220;
const parentOf = (p: string) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "");
const joinPath = (parent: string, name: string) => (parent ? `${parent}/${name}` : name);
const under = (p: string, dir: string) => p === dir || p.startsWith(dir + "/");
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Preview({ file, base, onClose, onDownload }: { file: FileItem | null; base: string; onClose: () => void; onDownload: (f: FileItem) => void }) {
  const { url, failed } = useFileUrl(base, file?._id ?? "", Boolean(file));
  return (
    <Modal
      open={Boolean(file)}
      onClose={onClose}
      title={file?.name ?? "Preview"}
      size="large"
      footer={
        <>
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
          {file ? (
            <Button variant="secondary" onClick={() => onDownload(file)}>
              Download
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flex min-h-40 items-center justify-center rounded-card bg-surface">
        {failed ? (
          <p className="p-6 text-body text-ink-soft">Could not load the preview.</p>
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={file?.name ?? ""} className="max-h-[65vh] max-w-full object-contain" />
        ) : (
          <div className="skeleton h-56 w-full" />
        )}
      </div>
    </Modal>
  );
}

export default function FilesPage() {
  const { project, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/files`;
  const folderBase = `/api/projects/${project._id}/folders`;
  const { data, loading, error, refetch, setData } = useFetch<Resp>(base);
  const [folder, setFolder] = useState("");
  const [query, setQuery] = useState("");
  const [view, setViewState] = useState<View>("list");
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [deleting, setDeleting] = useState<FileItem | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<FolderEntry | null>(null);
  const [renaming, setRenaming] = useState<{ kind: "file"; file: FileItem } | { kind: "folder"; folder: FolderEntry } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moving, setMoving] = useState<{ subject: MoveSubject; file?: FileItem; folder?: FolderEntry } | null>(null);
  const [previewing, setPreviewing] = useState<FileItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const [newFolder, setNewFolder] = useState<string | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());
  const [entering, setEntering] = useState<ReadonlySet<string>>(new Set());
  const [pulse, setPulse] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const nextId = useRef(1);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(VIEW_KEY);
      if (v === "list" || v === "grid") setViewState(v);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const setView = (v: View) => {
    setViewState(v);
    try {
      window.localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  };

  const configured = Boolean(data?.configured);
  const files = useMemo(() => data?.files ?? [], [data]);
  const folderRecords = useMemo(() => data?.folders ?? [], [data]);
  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const q = query.trim().toLowerCase();

  /** Every folder path: saved folders, plus any implied by a file's folder (older uploads), plus their ancestors. */
  const allPaths = useMemo(() => {
    const set = new Set<string>();
    const add = (p: string) => {
      if (!p) return;
      const parts = p.split("/");
      for (let i = 1; i <= parts.length; i++) set.add(parts.slice(0, i).join("/"));
    };
    folderRecords.forEach((d) => add(d.path));
    files.forEach((f) => add(f.folder));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [folderRecords, files]);
  const recordByPath = useMemo(() => new Map(folderRecords.map((d) => [d.path, d])), [folderRecords]);

  const folders = useMemo<FolderEntry[]>(
    () =>
      allPaths
        .filter((p) => parentOf(p) === folder)
        .map((path) => ({ _id: recordByPath.get(path)?._id, name: path.split("/").pop()!, path, count: files.filter((x) => under(x.folder, path)).length })),
    [allPaths, folder, files, recordByPath],
  );
  const here = useMemo(() => files.filter((f) => f.folder === folder), [files, folder]);
  const shownFolders = q ? folders.filter((d) => d.name.toLowerCase().includes(q)) : folders;
  const shownFiles = q ? here.filter((f) => f.name.toLowerCase().includes(q)) : here;
  const isEmpty = folders.length === 0 && here.length === 0;

  // Leaving the current folder when it no longer exists (deleted or moved away).
  useEffect(() => {
    if (folder && data && !allPaths.includes(folder)) setFolder(parentOf(folder));
  }, [folder, allPaths, data]);

  /* ---- motion helpers ---- */
  const animateOut = useCallback(async (key: string) => {
    setLeaving((s) => new Set([...s, key]));
    await wait(LEAVE_MS);
    setLeaving((s) => {
      const n = new Set(s);
      n.delete(key);
      return n;
    });
  }, []);
  const animateIn = useCallback((key: string) => {
    setEntering((s) => new Set([...s, key]));
    setTimeout(() => setEntering((s) => {
      const n = new Set(s);
      n.delete(key);
      return n;
    }), 400);
  }, []);
  const pulseFolder = useCallback((path: string) => {
    setPulse(path);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => setPulse(null), 600);
  }, []);
  const motion: Motion = { leaving, entering, pulse };

  /* ---- uploads ---- */
  const patchJob = useCallback((id: number, patch: Partial<UploadJob>) => setJobs((j) => j.map((x) => (x.id === id ? { ...x, ...patch } : x))), []);

  const runUpload = useCallback(
    async (job: UploadJob) => {
      const { file, folder: dir, id } = job;
      patchJob(id, { status: "uploading", progress: 0, error: undefined });
      try {
        const { file: rec, uploadUrl } = await api.post<{ file: FileItem; uploadUrl: string }>(base, {
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          folder: dir,
        });
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) patchJob(id, { progress: Math.round((e.loaded / e.total) * 100) });
          };
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed (${xhr.status}). Check bucket CORS.`)));
          xhr.onerror = () => reject(new Error("Network error uploading to S3. Check the bucket CORS configuration."));
          xhr.send(file);
        });
        const saved = await api.patch<FileItem>(`${base}/${rec._id}`, { status: "uploaded", size: file.size });
        setData((prev) => (prev ? { ...prev, files: [saved, ...prev.files] } : prev));
        animateIn(saved._id);
        patchJob(id, { status: "done", progress: 100 });
        refetchProject(true);
        setTimeout(() => setJobs((j) => j.filter((x) => x.id !== id || x.status !== "done")), 4000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        patchJob(id, { status: "error", error: msg });
        toast(msg, "error");
      }
    },
    [base, patchJob, refetchProject, setData, toast, animateIn],
  );

  const uploadFiles = useCallback(
    async (list: FileList | File[], dir = folder) => {
      if (!configured) {
        toast("Connect an S3 bucket before uploading files.", "warning");
        return;
      }
      const batch: UploadJob[] = Array.from(list).map((file) => ({ id: nextId.current++, file, folder: dir, progress: 0, status: "uploading" }));
      if (!batch.length) return;
      setJobs((j) => [...j, ...batch]);
      if (dir !== folder) pulseFolder(dir);
      for (const job of batch) await runUpload(job);
    },
    [configured, folder, runUpload, toast, pulseFolder],
  );

  /* ---- file actions ---- */
  async function download(f: FileItem) {
    try {
      const { url } = await api.get<{ url: string }>(`${base}/${f._id}`);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.name;
      a.rel = "noopener";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Download failed", "error");
    }
  }

  async function remove(f: FileItem) {
    try {
      await animateOut(f._id);
      await api.del(`${base}/${f._id}`);
      setData((prev) => (prev ? { ...prev, files: prev.files.filter((x) => x._id !== f._id) } : prev));
      refetchProject(true);
      toast(`Deleted ${f.name}.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  /** Folders implied by old uploads have no record yet; create one on first rename / move / delete. */
  const ensureFolderId = useCallback(
    async (d: FolderEntry): Promise<string> => {
      if (d._id) return d._id;
      const rec = recordByPath.get(d.path);
      if (rec) return rec._id;
      const created = await api.post<Folder>(folderBase, { name: d.name, parent: parentOf(d.path) });
      setData((prev) => (prev ? { ...prev, folders: [...prev.folders, created] } : prev));
      return created._id;
    },
    [folderBase, recordByPath, setData],
  );

  /** Rewrite a path prefix locally (folder rename / move) so the UI doesn't wait for a refetch. */
  const relocateLocal = useCallback(
    (from: string, to: string) => {
      const rw = (p: string) => (under(p, from) ? to + p.slice(from.length) : p);
      setData((prev) =>
        prev
          ? {
              ...prev,
              folders: prev.folders.map((d) => (under(d.path, from) ? { ...d, path: rw(d.path), name: rw(d.path).split("/").pop()! } : d)),
              files: prev.files.map((f) => (under(f.folder, from) ? { ...f, folder: rw(f.folder) } : f)),
            }
          : prev,
      );
    },
    [setData],
  );

  async function submitRename() {
    const r = renaming;
    const name = renameValue.trim().replace(/[\/\\]+/g, "-");
    if (!r || !name) return setRenaming(null);
    try {
      if (r.kind === "file") {
        if (name === r.file.name) return setRenaming(null);
        const saved = await api.patch<FileItem>(`${base}/${r.file._id}`, { name });
        setData((prev) => (prev ? { ...prev, files: prev.files.map((x) => (x._id === r.file._id ? saved : x)) } : prev));
      } else {
        if (name === r.folder.name) return setRenaming(null);
        const id = await ensureFolderId(r.folder);
        await api.patch<Folder>(`${folderBase}/${id}`, { name });
        const to = joinPath(parentOf(r.folder.path), name);
        relocateLocal(r.folder.path, to);
        animateIn(folderKey(to));
        if (under(folder, r.folder.path)) setFolder(to + folder.slice(r.folder.path.length));
      }
      setRenaming(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Rename failed", "error");
    }
  }

  async function removeFolder(d: FolderEntry) {
    try {
      await animateOut(folderKey(d.path));
      const id = await ensureFolderId(d);
      const res = await api.del<{ files: number }>(`${folderBase}/${id}`);
      setData((prev) => (prev ? { ...prev, folders: prev.folders.filter((x) => !under(x.path, d.path)), files: prev.files.filter((f) => !under(f.folder, d.path)) } : prev));
      refetchProject(true);
      toast(`Deleted folder ${d.name}${res?.files ? ` and ${res.files} file${res.files === 1 ? "" : "s"}` : ""}.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't delete the folder", "error");
      refetch(true);
    }
  }

  /** Move a file or folder into `target` ("" = root). Animates the item out of the current list, then pulses the destination. */
  const moveItem = useCallback(
    async (item: DragItem, target: string, opts: { animate?: boolean } = {}) => {
      const targetName = target ? target.split("/").pop()! : project.name;
      try {
        if (item.kind === "file") {
          if (item.folder === target) return;
          if (opts.animate !== false && item.folder === folder) await animateOut(item.id);
          setData((prev) => (prev ? { ...prev, files: prev.files.map((f) => (f._id === item.id ? { ...f, folder: target } : f)) } : prev));
          await api.patch<FileItem>(`${base}/${item.id}`, { folder: target });
        } else {
          const to = joinPath(target, item.name);
          if (to === item.path || under(target, item.path)) return;
          const entry: FolderEntry = { _id: recordByPath.get(item.path)?._id, name: item.name, path: item.path, count: 0 };
          const id = await ensureFolderId(entry);
          if (opts.animate !== false && parentOf(item.path) === folder) await animateOut(folderKey(item.path));
          relocateLocal(item.path, to);
          await api.patch<Folder>(`${folderBase}/${id}`, { parent: target });
          if (under(folder, item.path)) setFolder(to + folder.slice(item.path.length));
        }
        if (parentOf(target) === folder || target === folder) pulseFolder(target);
        toast(`Moved ${item.name} to ${targetName}`, "success", { action: { label: "Open", onClick: () => go(target) } });
      } catch (err) {
        toast(err instanceof Error ? err.message : "Couldn't move. Try again.", "error");
        refetch(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, folderBase, folder, project.name, recordByPath, animateOut, ensureFolderId, relocateLocal, pulseFolder, refetch, setData, toast],
  );

  const dnd = useFileDnd({ onMove: (item, target) => void moveItem(item, target), onUploadTo: (list, target) => void uploadFiles(list, target) });

  async function createFolder(raw: string) {
    const name = raw.trim().replace(/[\/\\]+/g, "-");
    if (!name) return;
    setCreatingFolder(true);
    try {
      const created = await api.post<Folder>(folderBase, { name, parent: folder });
      setData((prev) => (prev ? { ...prev, folders: [...prev.folders, created] } : prev));
      setNewFolder(null);
      setQuery("");
      animateIn(folderKey(created.path));
      toast(`Created folder ${created.name}`, "success", { action: { label: "Open", onClick: () => go(created.path) } });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't create the folder", "error");
    } finally {
      setCreatingFolder(false);
    }
  }

  const actions: FileActions = {
    open: (f) => (kindOf(f) === "image" ? setPreviewing(f) : download(f)),
    preview: setPreviewing,
    download,
    rename: (f) => {
      setRenaming({ kind: "file", file: f });
      setRenameValue(f.name);
    },
    move: (f) => setMoving({ subject: { kind: "file", name: f.name, folder: f.folder }, file: f }),
    remove: setDeleting,
  };
  const folderActions: FolderActions = {
    open: (path) => go(path),
    rename: (d) => {
      setRenaming({ kind: "folder", folder: d });
      setRenameValue(d.name);
    },
    move: (d) => setMoving({ subject: { kind: "folder", name: d.name, path: d.path }, folder: d }),
    remove: setDeletingFolder,
  };

  function go(path: string) {
    setFolder(path);
    setQuery("");
  }

  const otherFolderCount = useMemo(() => files.filter((f) => f.folder !== folder && q && f.name.toLowerCase().includes(q)).length, [files, folder, q]);

  return (
    <div
      className="relative"
      onDragEnter={(e) => {
        if (!hasExternalFiles(e)) return;
        e.preventDefault();
        dragDepth.current++;
        setDragging(true);
      }}
      onDragOver={(e) => hasExternalFiles(e) && e.preventDefault()}
      onDragLeave={(e) => {
        if (!hasExternalFiles(e)) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragging(false);
      }}
      onDrop={(e) => {
        if (!hasExternalFiles(e)) return;
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
      }}
    >
      <PageHeader
        title="Files"
        description={`Stored in your AWS S3 bucket. ${files.length} file${files.length === 1 ? "" : "s"} in ${allPaths.length} folder${allPaths.length === 1 ? "" : "s"} · ${formatBytes(totalSize)}`}
        color={MOD.color}
        icon={<Files size={20} />}
        actions={
          <>
            <Button variant="secondary" icon={<FolderPlus size={16} />} onClick={() => setNewFolder("")}>
              New folder
            </Button>
            <Button icon={<Upload size={16} />} onClick={() => inputRef.current?.click()} disabled={!configured}>
              Upload
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) uploadFiles(Array.from(e.target.files));
                e.target.value = "";
              }}
            />
          </>
        }
      />

      {data && !data.configured ? (
        <SectionMessage appearance="warning" title="AWS S3 is not configured" className="mb-4">
          Add <span className="mono">AWS_REGION</span>, <span className="mono">AWS_ACCESS_KEY_ID</span>, <span className="mono">AWS_SECRET_ACCESS_KEY</span> and <span className="mono">AWS_S3_BUCKET</span> to your .env, and allow{" "}
          <span className="mono">PUT</span> from this origin in the bucket CORS policy.
        </SectionMessage>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="mr-auto min-w-0">
          <FolderCrumbs root={project.name} folder={folder} onGo={go} dnd={dnd} />
        </div>
        <SearchInput value={query} onValueChange={setQuery} placeholder="Search files" className="w-full sm:w-64" />
        <div role="group" aria-label="View" className="flex gap-0.5 rounded-control bg-fill p-0.5">
          <IconButton size="sm" title="List view" active={view === "list"} onClick={() => setView("list")}>
            <List size={16} />
          </IconButton>
          <IconButton size="sm" title="Grid view" active={view === "grid"} onClick={() => setView("grid")}>
            <LayoutGrid size={16} />
          </IconButton>
        </div>
      </div>

      {dnd.dragging ? (
        <p className="drag-hint mb-3 rounded-card border border-dashed border-brand/50 bg-brand-soft/60 px-3 py-1.5 text-body-sm text-brand-dark" aria-live="polite">
          Moving <strong className="font-semibold">{dnd.dragging.name}</strong>. Drop it on a folder{folder ? ", or on a breadcrumb to move it up" : ""}.
        </p>
      ) : null}

      {newFolder !== null ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createFolder(newFolder);
          }}
          className="anim-pop mb-4 flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-2"
        >
          <FolderPlus size={16} className="ml-1 text-orange-700" aria-hidden />
          <Input size="sm" autoFocus aria-label="Folder name" value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="Folder name" className="w-full sm:w-64" onKeyDown={(e) => e.key === "Escape" && setNewFolder(null)} />
          <span className="hidden text-body-sm text-ink-muted sm:inline">in {folder ? folder.split("/").pop() : project.name}</span>
          <Button type="submit" size="md" loading={creatingFolder} disabled={!newFolder.trim()}>
            Create folder
          </Button>
          <Button type="button" size="md" variant="subtle" onClick={() => setNewFolder(null)}>
            Cancel
          </Button>
        </form>
      ) : null}

      {loading && !data ? (
        <FilesSkeleton grid={view === "grid"} />
      ) : error ? (
        <ErrorBox message={error} onRetry={() => refetch()} />
      ) : isEmpty ? (
        <FilesEmpty folder={Boolean(folder)} configured={configured} onChoose={() => inputRef.current?.click()} />
      ) : shownFolders.length === 0 && shownFiles.length === 0 ? (
        <FilesNoMatch query={query} onClear={() => setQuery("")} elsewhere={otherFolderCount} />
      ) : view === "grid" ? (
        <FileGrid folders={shownFolders} files={shownFiles} base={base} actions={actions} folderActions={folderActions} dnd={dnd} motion={motion} />
      ) : (
        <FileTable folders={shownFolders} files={shownFiles} actions={actions} folderActions={folderActions} dnd={dnd} motion={motion} />
      )}

      <div
        aria-hidden={!dragging}
        className={cn("pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-card border-2 border-dashed border-brand bg-brand-soft/90 transition-opacity", dragging && !dnd.over ? "opacity-100" : "opacity-0 invisible")}
      >
        <div className="flex flex-col items-center gap-2 text-brand-dark">
          <Upload size={32} />
          <p className="text-h-s font-semibold">{configured ? `Drop files to upload to ${folder ? folder.split("/").pop() : project.name}` : "S3 is not configured"}</p>
          <p className="text-body-sm">Drop onto a folder to upload straight into it.</p>
        </div>
      </div>

      <UploadQueue
        jobs={jobs}
        onRetry={(id) => {
          const j = jobs.find((x) => x.id === id);
          if (j) runUpload(j);
        }}
        onDismiss={(id) => setJobs((j) => j.filter((x) => x.id !== id))}
        onClear={() => setJobs((j) => j.filter((x) => x.status === "uploading"))}
      />

      <Preview file={previewing} base={base} onClose={() => setPreviewing(null)} onDownload={download} />

      <Modal
        open={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        title={renaming?.kind === "folder" ? "Rename folder" : "Rename file"}
        size="small"
        footer={
          <>
            <Button variant="subtle" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button type="submit" form="rename-item" disabled={!renameValue.trim()}>
              Rename
            </Button>
          </>
        }
      >
        <form
          id="rename-item"
          onSubmit={(e) => {
            e.preventDefault();
            void submitRename();
          }}
        >
          <Field label={renaming?.kind === "folder" ? "Folder name" : "File name"} helper={renaming?.kind === "folder" ? "Files inside keep their place; only the name changes." : undefined}>
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} data-autofocus onFocus={(e) => {
              const dot = renaming?.kind === "file" ? e.target.value.lastIndexOf(".") : -1;
              e.target.setSelectionRange(0, dot > 0 ? dot : e.target.value.length);
            }} />
          </Field>
        </form>
      </Modal>

      {moving ? (
        <MoveModal
          subject={moving.subject}
          root={project.name}
          paths={allPaths}
          onMove={async (target) => {
            const item: DragItem = moving.file
              ? { kind: "file", id: moving.file._id, name: moving.file.name, folder: moving.file.folder }
              : { kind: "folder", path: moving.folder!.path, name: moving.folder!.name };
            setMoving(null);
            await moveItem(item, target);
          }}
          onClose={() => setMoving(null)}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
        title={`Delete ${deleting?.name ?? "file"}?`}
        message="The file will be removed from S3 as well. This cannot be undone."
        confirmLabel="Delete file"
      />

      <ConfirmDialog
        open={Boolean(deletingFolder)}
        onClose={() => setDeletingFolder(null)}
        onConfirm={() => deletingFolder && removeFolder(deletingFolder)}
        title={`Delete folder ${deletingFolder?.name ?? ""}?`}
        message={
          deletingFolder?.count
            ? `This removes the folder, its subfolders and ${deletingFolder.count} file${deletingFolder.count === 1 ? "" : "s"} inside it from S3. This cannot be undone.`
            : "The folder is empty. This cannot be undone."
        }
        confirmLabel="Delete folder"
        confirmText={deletingFolder && deletingFolder.count >= 10 ? deletingFolder.name : undefined}
      />
    </div>
  );
}
