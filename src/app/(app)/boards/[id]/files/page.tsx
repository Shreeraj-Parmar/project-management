"use client";

import { useMemo, useRef, useState } from "react";
import { Files, Upload, Download, Trash2, FolderOpen, Folder, FileText, FileImage, FileArchive, FileCode, File, AlertTriangle, ChevronRight, Pencil } from "lucide-react";
import { api, cn, formatBytes, formatDate, useFetch } from "@/lib/client";
import { MODULES } from "@/lib/constants";
import type { FileItem } from "@/lib/types";
import { useProject } from "@/components/project/ProjectContext";
import { ModuleHeader, Spinner, ErrorBox, EmptyState } from "@/components/ui/Misc";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Confirm";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

const MOD = MODULES.find((m) => m.id === "files")!;
type Resp = { configured: boolean; files: FileItem[] };
type UploadState = { name: string; progress: number; error?: string };

function iconFor(f: FileItem) {
  const t = f.contentType;
  const n = f.name.toLowerCase();
  if (t.startsWith("image/")) return <FileImage size={18} className="text-[#ae4787]" />;
  if (/zip|tar|gzip|rar|7z/.test(t) || /\.(zip|tar|gz|rar|7z)$/.test(n)) return <FileArchive size={18} className="text-[#946f00]" />;
  if (/json|javascript|typescript|xml|yaml|html|css/.test(t) || /\.(js|ts|tsx|jsx|json|yml|yaml|env|sh|py|go|rs|sql)$/.test(n)) return <FileCode size={18} className="text-[#1f845a]" />;
  if (/pdf|text|document|sheet|presentation/.test(t) || /\.(pdf|md|txt|docx?|xlsx?|csv)$/.test(n)) return <FileText size={18} className="text-[#0c66e4]" />;
  return <File size={18} className="text-ink-muted" />;
}

export default function FilesPage() {
  const { project, refetch: refetchProject } = useProject();
  const { toast } = useToast();
  const base = `/api/projects/${project._id}/files`;
  const { data, loading, error, refetch, setData } = useFetch<Resp>(base);
  const [folder, setFolder] = useState("");
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [deleting, setDeleting] = useState<FileItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newFolder, setNewFolder] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const files = data?.files ?? [];
  const folders = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      if (!f.folder) return;
      if (!folder) set.add(f.folder.split("/")[0]);
      else if (f.folder.startsWith(folder + "/")) set.add(f.folder.slice(folder.length + 1).split("/")[0]);
    });
    return [...set].sort();
  }, [files, folder]);
  const list = files.filter((f) => f.folder === folder);
  const totalSize = files.reduce((a, f) => a + f.size, 0);

  async function uploadFiles(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    for (const file of arr) {
      const state: UploadState = { name: file.name, progress: 0 };
      setUploads((u) => [...u, state]);
      try {
        const { file: rec, uploadUrl } = await api.post<{ file: FileItem; uploadUrl: string }>(base, {
          name: file.name,
          size: file.size,
          contentType: file.type || "application/octet-stream",
          folder,
        });
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              setUploads((u) => u.map((x) => (x === state ? { ...x, progress: pct } : x)));
            }
          };
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`S3 upload failed (${xhr.status}). Check bucket CORS.`)));
          xhr.onerror = () => reject(new Error("Network error uploading to S3. Check the bucket CORS configuration."));
          xhr.send(file);
        });
        const saved = await api.patch<FileItem>(`${base}/${rec._id}`, { status: "uploaded", size: file.size });
        setData((prev) => (prev ? { ...prev, files: [saved, ...prev.files] } : prev));
        setUploads((u) => u.filter((x) => x !== state));
        refetchProject(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setUploads((u) => u.map((x) => (x === state ? { ...x, error: msg } : x)));
        toast(msg, "error");
      }
    }
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
    toast("File deleted", "success");
  }

  async function rename(f: FileItem) {
    const name = prompt("Rename file", f.name);
    if (!name || name === f.name) return;
    const saved = await api.patch<FileItem>(`${base}/${f._id}`, { name });
    setData((prev) => (prev ? { ...prev, files: prev.files.map((x) => (x._id === f._id ? saved : x)) } : prev));
  }

  const crumbs = folder ? folder.split("/") : [];

  return (
    <div className="mx-auto max-w-5xl">
      <ModuleHeader
        title="Files"
        description={`Stored in your AWS S3 bucket. ${files.length} file${files.length === 1 ? "" : "s"} · ${formatBytes(totalSize)}`}
        color={MOD.color}
        icon={<Files size={20} />}
        actions={
          <>
            <Button variant="secondary" icon={<Folder size={15} />} onClick={() => setNewFolder("")}>
              New folder
            </Button>
            <Button color={MOD.color} icon={<Upload size={15} />} onClick={() => inputRef.current?.click()} disabled={data ? !data.configured : true}>
              Upload
            </Button>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
          </>
        }
      />

      {data && !data.configured ? (
        <div className="mb-4 flex gap-2 rounded-lg border border-[#fedec8] bg-[#fff3eb] p-3 text-[13px] text-[#5f3811]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <b>AWS S3 is not configured.</b> Add <span className="mono">AWS_REGION</span>, <span className="mono">AWS_ACCESS_KEY_ID</span>, <span className="mono">AWS_SECRET_ACCESS_KEY</span> and{" "}
            <span className="mono">AWS_S3_BUCKET</span> to your .env, and allow <span className="mono">PUT</span> from this origin in the bucket CORS policy.
          </div>
        </div>
      ) : null}

      {/* Breadcrumbs */}
      <div className="mb-3 flex items-center gap-1 text-sm">
        <button onClick={() => setFolder("")} className={cn("flex items-center gap-1 rounded px-2 py-1 font-semibold hover:bg-[#091e420f]", !folder && "text-ink")} style={!folder ? undefined : { color: MOD.color }}>
          <FolderOpen size={15} /> {project.name}
        </button>
        {crumbs.map((c, i) => {
          const path = crumbs.slice(0, i + 1).join("/");
          return (
            <span key={path} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-ink-muted" />
              <button onClick={() => setFolder(path)} className={cn("rounded px-2 py-1 font-semibold hover:bg-[#091e420f]", i === crumbs.length - 1 && "text-ink")} style={i === crumbs.length - 1 ? undefined : { color: MOD.color }}>
                {c}
              </button>
            </span>
          );
        })}
      </div>

      {newFolder !== null ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = newFolder.trim().replace(/[\/\\]+/g, "-");
            if (!name) return;
            setFolder(folder ? `${folder}/${name}` : name);
            setNewFolder(null);
            toast("Folder opened. Upload a file to keep it.", "info");
          }}
          className="mb-3 flex items-center gap-2"
        >
          <Folder size={16} className="text-ink-muted" />
          <Input autoFocus value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="Folder name" className="h-9 w-64" onKeyDown={(e) => e.key === "Escape" && setNewFolder(null)} />
          <Button type="submit" size="sm" color={MOD.color}>
            Open
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setNewFolder(null)}>
            Cancel
          </Button>
        </form>
      ) : null}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (data?.configured && e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        className={cn("rounded-xl transition", dragOver && "ring-2 ring-offset-2")}
        style={dragOver ? { boxShadow: `0 0 0 2px ${MOD.color}` } : undefined}
      >
        {uploads.length > 0 ? (
          <div className="mb-3 space-y-2">
            {uploads.map((u, i) => (
              <div key={i} className="t-card flex items-center gap-3 p-3 text-sm">
                <Upload size={16} className={u.error ? "text-danger" : "text-ink-muted"} />
                <span className="truncate">{u.name}</span>
                {u.error ? (
                  <span className="ml-auto text-xs text-danger">{u.error}</span>
                ) : (
                  <>
                    <div className="ml-auto h-1.5 w-40 overflow-hidden rounded bg-[#091e4224]">
                      <div className="h-full transition-all" style={{ width: `${u.progress}%`, background: MOD.color }} />
                    </div>
                    <span className="w-10 text-right text-xs text-ink-muted">{u.progress}%</span>
                  </>
                )}
                {u.error ? (
                  <button onClick={() => setUploads((x) => x.filter((_, j) => j !== i))} className="text-xs underline">
                    dismiss
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {loading && !data ? (
          <Spinner />
        ) : error ? (
          <ErrorBox message={error} onRetry={() => refetch()} />
        ) : folders.length === 0 && list.length === 0 ? (
          <EmptyState
            icon={<Upload size={22} />}
            color={MOD.color}
            title={folder ? "This folder is empty" : "No files yet"}
            description="Drag & drop files here or click Upload. Files go straight to your S3 bucket via a presigned URL."
            action={
              data?.configured ? (
                <Button color={MOD.color} onClick={() => inputRef.current?.click()}>
                  Choose files
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="t-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f7f8f9] text-left text-xs font-bold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="hidden px-4 py-2.5 sm:table-cell">Size</th>
                  <th className="hidden px-4 py-2.5 md:table-cell">Uploaded</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {folders.map((f) => (
                  <tr key={"dir:" + f} onClick={() => setFolder(folder ? `${folder}/${f}` : f)} className="cursor-pointer hover:bg-[#f7f8f9]">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 font-medium text-ink">
                        <Folder size={18} fill="#fea362" className="text-[#c25100]" /> {f}
                      </div>
                    </td>
                    <td className="hidden px-4 py-2.5 text-ink-muted sm:table-cell">{files.filter((x) => x.folder === (folder ? `${folder}/${f}` : f) || x.folder.startsWith((folder ? `${folder}/${f}` : f) + "/")).length} items</td>
                    <td className="hidden px-4 py-2.5 md:table-cell" />
                    <td />
                  </tr>
                ))}
                {list.map((f) => (
                  <tr key={f._id} className="group hover:bg-[#f7f8f9]">
                    <td className="px-4 py-2.5">
                      <button onClick={() => download(f)} className="flex items-center gap-2 text-left font-medium text-ink hover:text-brand">
                        {iconFor(f)} <span className="truncate">{f.name}</span>
                      </button>
                    </td>
                    <td className="hidden px-4 py-2.5 text-ink-muted sm:table-cell">{formatBytes(f.size)}</td>
                    <td className="hidden px-4 py-2.5 text-ink-muted md:table-cell">{formatDate(f.createdAt)}</td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100">
                        <IconButton title="Download" onClick={() => download(f)}>
                          <Download size={15} />
                        </IconButton>
                        <IconButton title="Rename" onClick={() => rename(f)}>
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton title="Delete" onClick={() => setDeleting(f)} className="hover:!text-danger">
                          <Trash2 size={15} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={() => deleting && remove(deleting)} title={`Delete "${deleting?.name}"?`} message="The file will be removed from S3 as well." />
    </div>
  );
}
