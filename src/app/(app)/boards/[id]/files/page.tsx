"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Files, FolderPlus, LayoutGrid, List, Upload } from "lucide-react";
import { api, cn } from "@/lib/client";
import { formatBytes } from "@/lib/client";
import { MODULES } from "@/lib/constants";
import type { FileItem } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { Breadcrumbs, Button, ConfirmDialog, ErrorBox, Field, IconButton, Input, Modal, PageHeader, SearchInput, SectionMessage, useToast } from "@/components/ui";
import { FileGrid, FileTable, type FileActions, type FolderEntry } from "@/components/files/FileViews";
import { FilesEmpty, FilesNoMatch, FilesSkeleton } from "@/components/files/FileStates";
import { UploadQueue, type UploadJob } from "@/components/files/UploadQueue";
import { useFileUrl, kindOf } from "@/components/files/utils";
import { useFetch } from "@/lib/client";

const MOD = MODULES.find((m) => m.id === "files")!;
type Resp = { configured: boolean; files: FileItem[] };
type View = "list" | "grid";
const VIEW_KEY = "devboard.files.view";

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
  const { data, loading, error, refetch, setData } = useFetch<Resp>(base);
  const [folder, setFolder] = useState("");
  const [query, setQuery] = useState("");
  const [view, setViewState] = useState<View>("list");
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [deleting, setDeleting] = useState<FileItem | null>(null);
  const [renaming, setRenaming] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [previewing, setPreviewing] = useState<FileItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const [newFolder, setNewFolder] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const nextId = useRef(1);

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
  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const q = query.trim().toLowerCase();

  const folders = useMemo<FolderEntry[]>(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      if (!f.folder) return;
      if (!folder) set.add(f.folder.split("/")[0]);
      else if (f.folder.startsWith(folder + "/")) set.add(f.folder.slice(folder.length + 1).split("/")[0]);
    });
    return [...set]
      .sort((a, b) => a.localeCompare(b))
      .map((name) => {
        const path = folder ? `${folder}/${name}` : name;
        return { name, path, count: files.filter((x) => x.folder === path || x.folder.startsWith(path + "/")).length };
      });
  }, [files, folder]);
  const here = useMemo(() => files.filter((f) => f.folder === folder), [files, folder]);
  const shownFolders = q ? folders.filter((d) => d.name.toLowerCase().includes(q)) : folders;
  const shownFiles = q ? here.filter((f) => f.name.toLowerCase().includes(q)) : here;
  const isEmpty = folders.length === 0 && here.length === 0;

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
        patchJob(id, { status: "done", progress: 100 });
        refetchProject(true);
        setTimeout(() => setJobs((j) => j.filter((x) => x.id !== id || x.status !== "done")), 4000);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        patchJob(id, { status: "error", error: msg });
        toast(msg, "error");
      }
    },
    [base, patchJob, refetchProject, setData, toast]
  );

  async function uploadFiles(list: FileList | File[]) {
    if (!configured) return;
    const batch: UploadJob[] = Array.from(list).map((file) => ({ id: nextId.current++, file, folder, progress: 0, status: "uploading" }));
    if (!batch.length) return;
    setJobs((j) => [...j, ...batch]);
    for (const job of batch) await runUpload(job);
  }

  async function download(f: FileItem) {
    try {
      const { url } = await api.get<{ url: string }>(`${base}/${f._id}`);
      window.open(url, "_blank");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  }

  async function remove(f: FileItem) {
    await api.del(`${base}/${f._id}`);
    setData((prev) => (prev ? { ...prev, files: prev.files.filter((x) => x._id !== f._id) } : prev));
    refetchProject(true);
    toast(`Deleted ${f.name}.`, "success");
  }

  async function submitRename() {
    const f = renaming;
    const name = renameValue.trim();
    if (!f || !name || name === f.name) return setRenaming(null);
    try {
      const saved = await api.patch<FileItem>(`${base}/${f._id}`, { name });
      setData((prev) => (prev ? { ...prev, files: prev.files.map((x) => (x._id === f._id ? saved : x)) } : prev));
      setRenaming(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Rename failed", "error");
    }
  }

  const actions: FileActions = {
    open: (f) => (kindOf(f) === "image" ? setPreviewing(f) : download(f)),
    preview: setPreviewing,
    download,
    rename: (f) => {
      setRenaming(f);
      setRenameValue(f.name);
    },
    remove: setDeleting,
  };

  const crumbs = folder ? folder.split("/") : [];
  const go = (path: string) => {
    setFolder(path);
    setQuery("");
  };
  const breadcrumbItems = [
    { label: project.name, onClick: () => go("") },
    ...crumbs.map((c, i) => ({ label: c, onClick: () => go(crumbs.slice(0, i + 1).join("/")) })),
  ];

  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

  return (
    <div
      className="relative"
      onDragEnter={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        dragDepth.current++;
        setDragging(true);
      }}
      onDragOver={(e) => hasFiles(e) && e.preventDefault()}
      onDragLeave={(e) => {
        if (!hasFiles(e)) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragging(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        if (configured && e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
      }}
    >
      <PageHeader
        title="Files"
        description={`Stored in your AWS S3 bucket. ${files.length} file${files.length === 1 ? "" : "s"} · ${formatBytes(totalSize)}`}
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
        <Breadcrumbs items={breadcrumbItems} className="mr-auto" />
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

      {newFolder !== null ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = newFolder.trim().replace(/[\/\\]+/g, "-");
            if (!name) return;
            go(folder ? `${folder}/${name}` : name);
            setNewFolder(null);
            toast("Folder opened. Upload a file to keep it.", "info");
          }}
          className="mb-4 flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-2"
        >
          <Input size="sm" autoFocus aria-label="Folder name" value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="Folder name" className="w-full sm:w-64" onKeyDown={(e) => e.key === "Escape" && setNewFolder(null)} />
          <Button type="submit" size="md" disabled={!newFolder.trim()}>
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
        <FilesNoMatch query={query} onClear={() => setQuery("")} />
      ) : view === "grid" ? (
        <FileGrid folders={shownFolders} files={shownFiles} base={base} actions={actions} onOpenFolder={go} />
      ) : (
        <FileTable folders={shownFolders} files={shownFiles} actions={actions} onOpenFolder={go} />
      )}

      <div
        aria-hidden={!dragging}
        className={cn("pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-card border-2 border-dashed border-brand bg-brand-soft/90 transition-opacity", dragging ? "opacity-100" : "opacity-0 invisible")}
      >
        <div className="flex flex-col items-center gap-2 text-brand-dark">
          <Upload size={32} />
          <p className="text-h-s font-semibold">{configured ? "Drop files to upload" : "S3 is not configured"}</p>
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
        title="Rename file"
        size="small"
        footer={
          <>
            <Button variant="subtle" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button type="submit" form="rename-file" disabled={!renameValue.trim()}>
              Rename
            </Button>
          </>
        }
      >
        <form
          id="rename-file"
          onSubmit={(e) => {
            e.preventDefault();
            submitRename();
          }}
        >
          <Field label="File name">
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} data-autofocus />
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
        title={`Delete ${deleting?.name ?? "file"}?`}
        message="The file will be removed from S3 as well. This cannot be undone."
        confirmLabel="Delete file"
      />
    </div>
  );
}
